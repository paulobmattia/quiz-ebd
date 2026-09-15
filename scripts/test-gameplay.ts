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
  console.log('--- [1] Testando API REST ---');
  const quizzesRes = await fetch(`${SERVER_URL}/api/quizzes`);
  const quizzes = await quizzesRes.json();
  console.log(`✓ Quizzes encontrados: ${quizzes.length}`);
  if (quizzes.length === 0) throw new Error('Nenhum quiz encontrado!');

  const sampleQuiz = quizzes[0];
  console.log(`✓ Usando quiz: "${sampleQuiz.title}" com ${sampleQuiz.questions.length} perguntas`);

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

  console.log('\n--- [3] Conectando 2 Participantes (Celulares Simulados) ---');
  const player1 = await createConnectedSocket();
  const player2 = await createConnectedSocket();

  await new Promise((resolve) => {
    player1.emit('player:join', { pin, nickname: 'Paulo (Aluno)', avatar: '🦁' }, (res: any) => {
      console.log(`✓ Jogador 1 entrou com sucesso: ${res.success}`);
      resolve(res);
    });
  });

  await new Promise((resolve) => {
    player2.emit('player:join', { pin, nickname: 'Mariana (Aluna)', avatar: '👑' }, (res: any) => {
      console.log(`✓ Jogador 2 entrou com sucesso: ${res.success}`);
      resolve(res);
    });
  });

  console.log('\n--- [4] Apresentador Inicia o Jogo ---');
  // Registra listeners de início de pergunta antes de dar o start
  const questionStartPromise = new Promise<any>((resolve) => {
    player1.once('question:start', (data) => resolve(data));
  });

  hostSocket.emit('host:start_game', { pin });

  console.log('Aguardando contagem regressiva e início da pergunta...');
  const questionData = await questionStartPromise;

  console.log(`✓ Pergunta 1 iniciada: "${questionData.question.text}"`);
  console.log(`✓ Opções disponíveis: ${questionData.question.options.map((o: any) => o.text).join(', ')}`);

  // Encontra qual é a opção correta para testar acerto
  const originalQ = sampleQuiz.questions[0];
  const correctOpt = originalQ.options.find((o: any) => o.isCorrect);
  const wrongOpt = originalQ.options.find((o: any) => !o.isCorrect);

  console.log(`\n--- [5] Enviando Respostas ---`);
  const revealPromise = new Promise<any>((resolve) => {
    hostSocket.once('question:reveal', (stats) => resolve(stats));
  });

  // Jogador 1 responde certo rápido (após 400ms)
  await new Promise((r) => setTimeout(r, 400));
  player1.emit('player:submit_answer', { pin, optionId: correctOpt.id });
  console.log(`✓ Jogador 1 respondeu: ${correctOpt.text} (Correto - Rápido)`);

  // Jogador 2 responde errado após 800ms
  await new Promise((r) => setTimeout(r, 400));
  player2.emit('player:submit_answer', { pin, optionId: wrongOpt.id });
  console.log(`✓ Jogador 2 respondeu: ${wrongOpt.text} (Incorreto)`);

  console.log('\n--- [6] Aguardando Revelação da Pergunta ---');
  const revealStats = await revealPromise;

  console.log(`✓ Revelação recebida com sucesso!`);
  console.log(`✓ Total de respostas computadas: ${revealStats.totalAnswers}`);
  console.log(`✓ Votos por opção:`, revealStats.optionCounts);

  console.log('\n--- [7] Apresentador Avança para o Placar ---');
  const leaderboardPromise = new Promise<any>((resolve) => {
    hostSocket.once('leaderboard:update', (data) => resolve(data));
  });

  hostSocket.emit('host:show_leaderboard', { pin });
  const leaderboardData = await leaderboardPromise;

  console.log(`✓ Placar Atualizado:`);
  leaderboardData.leaderboard.forEach((entry: any) => {
    console.log(`   #${entry.rank} ${entry.avatar} ${entry.nickname} - ${entry.score} pts (Streak: ${entry.streak})`);
  });

  if (leaderboardData.leaderboard[0].nickname !== 'Paulo (Aluno)') {
    throw new Error('Jogador 1 deveria ser o primeiro colocado!');
  }
  if (leaderboardData.leaderboard[0].score < 800) {
    throw new Error('Pontuação do Jogador 1 deveria ter bônus de agilidade!');
  }

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');

  hostSocket.disconnect();
  player1.disconnect();
  player2.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Falha no teste:', err);
  process.exit(1);
});
