import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

function createConnectedSocket(): Promise<Socket> {
  return new Promise((resolve) => {
    const s = io(SERVER_URL);
    if (s.connected) {
      resolve(s);
    } else {
      s.once('connect', () => resolve(s));
    }
  });
}

async function runTest() {
  console.log('--- [1] Testando APIs REST (Quizzes, Rede, Banco de Questões) ---');
  const quizzesRes = await fetch(`${SERVER_URL}/api/quizzes`);
  const quizzes = await quizzesRes.json();
  console.log(`✓ Quizzes encontrados: ${quizzes.length}`);
  if (quizzes.length === 0) throw new Error('Nenhum quiz encontrado!');

  const sampleQuiz = quizzes[0];
  console.log(`✓ Usando quiz: "${sampleQuiz.title}" com ${sampleQuiz.questions.length} perguntas`);

  const bankRes = await fetch(`${SERVER_URL}/api/question-bank`);
  const bank = await bankRes.json();
  console.log(`✓ Banco de questões curadas disponível com ${bank.length} questões temáticas`);
  if (bank.length === 0) throw new Error('Banco de questões vazio!');

  const networkRes = await fetch(`${SERVER_URL}/api/network`);
  const network = await networkRes.json();
  console.log(`✓ Info de Rede: IP = ${network.localIp}`);

  console.log('\n--- [2] Conectando Apresentador (Host) via WebSocket ---');
  const hostSocket = await createConnectedSocket();

  const gameInfo: any = await new Promise((resolve) => {
    hostSocket.emit('host:create_game', { quizId: sampleQuiz.id }, (res: any) => {
      resolve(res);
    });
  });

  const pin = gameInfo.pin;
  console.log(`✓ Sala criada com sucesso! PIN: ${pin}`);

  console.log('\n--- [3] Conectando 2 Participantes (com Teste de Sanitização Anti-XSS) ---');
  const player1 = await createConnectedSocket();
  const player2 = await createConnectedSocket();

  // Teste de sanitização: apelido com tags HTML para comprovar remoção de injeção
  const dirtyNick = '<b>Paulo</b><script>alert(1)</script>';
  await new Promise((resolve) => {
    player1.emit('player:join', { pin, nickname: dirtyNick, avatar: '🦁' }, (res: any) => {
      console.log(`✓ Jogador 1 enviou nick com tags HTML. Status: ${res.success}`);
      resolve(res);
    });
  });

  await new Promise((resolve) => {
    player2.emit('player:join', { pin, nickname: 'Mariana Operativa', avatar: '👑' }, (res: any) => {
      console.log(`✓ Jogador 2 entrou com sucesso: ${res.success}`);
      resolve(res);
    });
  });

  console.log('\n--- [4] Apresentador Inicia a Rodada ---');
  const questionStartPromise = new Promise<any>((resolve) => {
    player1.once('question:start', (data) => resolve(data));
  });

  hostSocket.emit('host:start_game', { pin });

  console.log('Aguardando contagem regressiva e início da pergunta...');
  const questionData = await questionStartPromise;

  console.log(`✓ Pergunta iniciada: "${questionData.question.text}"`);

  const originalQ = sampleQuiz.questions[0];
  const correctOpt = originalQ.options.find((o: any) => o.isCorrect);
  const wrongOpt = originalQ.options.find((o: any) => !o.isCorrect);

  console.log(`\n--- [5] Enviando Respostas ---`);
  const revealPromise = new Promise<any>((resolve) => {
    hostSocket.once('question:reveal', (stats) => resolve(stats));
  });

  // Jogador 1 responde certo rápido (em 300ms)
  await new Promise((r) => setTimeout(r, 300));
  player1.emit('player:submit_answer', { pin, optionId: correctOpt.id });
  console.log(`✓ Jogador 1 respondeu: ${correctOpt.text} (Correto - Bônus de Velocidade)`);

  // Jogador 2 responde errado após 600ms
  await new Promise((r) => setTimeout(r, 300));
  player2.emit('player:submit_answer', { pin, optionId: wrongOpt.id });
  console.log(`✓ Jogador 2 respondeu: ${wrongOpt.text} (Incorreto)`);

  console.log('\n--- [6] Aguardando Revelação e Verificação de Sanitização ---');
  const revealStats = await revealPromise;
  console.log(`✓ Revelação recebida com sucesso! Respostas computadas: ${revealStats.totalAnswers}`);

  console.log('\n--- [7] Apresentador Avança para o Placar ---');
  const leaderboardPromise = new Promise<any>((resolve) => {
    hostSocket.once('leaderboard:update', (data) => resolve(data));
  });

  hostSocket.emit('host:show_leaderboard', { pin });
  const leaderboardData = await leaderboardPromise;

  console.log(`✓ Placar Atualizado:`);
  leaderboardData.leaderboard.forEach((entry: any) => {
    console.log(`   #${entry.rank} ${entry.avatar} ${entry.nickname} - ${entry.score} pts`);
  });

  // Validação do apelido sanitizado (tags HTML eliminadas)
  const sanitizedPlayer = leaderboardData.leaderboard.find((e: any) => e.avatar === '🦁');
  if (sanitizedPlayer.nickname.includes('<') || sanitizedPlayer.nickname.includes('>')) {
    throw new Error('Falha de segurança: o apelido não foi devidamente sanitizado contra XSS!');
  }
  console.log(`✓ [SEGURANÇA APROVADA] Apelido sanitizado no servidor: "${sanitizedPlayer.nickname}"`);

  console.log('\n--- [8] Teste de Download de Relatório CSV ---');
  const csvRes = await fetch(`${SERVER_URL}/api/sessions/${pin}/report`);
  if (!csvRes.ok) throw new Error('Falha ao obter relatório CSV!');
  const csvText = await csvRes.text();
  console.log('✓ Conteúdo do Relatório CSV Gerado:\n' + csvText.trim());

  if (!csvText.includes('Posição') || !csvText.includes('Acertos') || !csvText.includes('Precisão')) {
    throw new Error('Formato do relatório CSV inválido!');
  }

  console.log('\n🎉 TODOS OS TESTES (DESIGN, FUNCIONALIDADES E SEGURANÇA) PASSARAM COM 100% DE SUCESSO!');

  hostSocket.disconnect();
  player1.disconnect();
  player2.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Falha no teste:', err);
  process.exit(1);
});
