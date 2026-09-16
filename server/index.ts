import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { storage } from './storage.js';
import { getLocalIpAddress } from './network.js';
import { GameManager } from './game/GameManager.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Proteção de cabeçalhos de segurança HTTP com Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Permite conexões Socket.IO e fontes externas
    crossOriginEmbedderPolicy: false,
  })
);

// Configuração de CORS para desenvolvimento com Vite
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Limite estrito de payload para proteção contra DoS de memória
app.use(express.json({ limit: '2mb' }));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const gameManager = new GameManager(io);

// === Rotas da API REST ===

// Informações de rede para conexão dos celulares via Wi-Fi ou Nuvem
app.get('/api/network', (req, res) => {
  const localIp = getLocalIpAddress();
  res.json({
    localIp,
    port: PORT,
    clientPort: 5173,
    localUrl: `http://${localIp}:${PORT}`,
    devClientUrl: `http://${localIp}:5173`,
  });
});

// Listar todos os quizzes
app.get('/api/quizzes', (req, res) => {
  const quizzes = storage.getAllQuizzes();
  res.json(quizzes);
});

// Obter um quiz específico por ID
app.get('/api/quizzes/:id', (req, res) => {
  const quiz = storage.getQuizById(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz não encontrado' });
  }
  res.json(quiz);
});

// Obter banco de questões pré-cadastradas para o criador de quizzes
app.get('/api/question-bank', (req, res) => {
  const bank = storage.getQuestionBank();
  res.json(bank);
});

// Baixar relatório da sessão de quiz em CSV
app.get('/api/sessions/:pin/report', (req, res) => {
  const csv = gameManager.generateCsvReport(req.params.pin);
  if (!csv) {
    return res.status(404).json({ error: 'Sessão não encontrada ou sem dados para relatório' });
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-quiz-${req.params.pin}.csv"`);
  res.send(csv);
});

// Criar ou atualizar quiz
app.post('/api/quizzes', (req, res) => {
  try {
    const saved = storage.saveQuiz(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao salvar quiz' });
  }
});

// Excluir quiz
app.delete('/api/quizzes/:id', (req, res) => {
  const deleted = storage.deleteQuiz(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Quiz não encontrado' });
  }
  res.json({ success: true });
});

// Importar lista de quizzes (JSON)
app.post('/api/quizzes/import', (req, res) => {
  try {
    const quizzes = req.body;
    if (!Array.isArray(quizzes)) {
      return res.status(400).json({ error: 'Formato inválido. Esperava-se uma lista de quizzes.' });
    }
    const result = storage.importQuizzes(quizzes);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Servir frontend compilado se existir (produção / modo offline)
const clientDist = path.resolve(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// === Eventos Socket.IO em Tempo Real ===
io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // Apresentador (Professor) cria uma sessão de quiz
  socket.on('host:create_game', ({ quizId }, callback) => {
    const quiz = storage.getQuizById(quizId);
    if (!quiz) {
      return callback({ error: 'Quiz não encontrado no banco de dados' });
    }

    const pin = gameManager.createGame(quiz, socket.id);
    socket.join(pin);

    const localIp = getLocalIpAddress();

    callback({
      success: true,
      pin,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      localIp,
    });
  });

  // Participante entra na sala com PIN e Nick
  socket.on('player:join', ({ pin, nickname, avatar }, callback) => {
    const result = gameManager.joinPlayer(pin, nickname, avatar, socket);
    callback(result);
  });

  // Apresentador inicia a contagem e jogo
  socket.on('host:start_game', ({ pin }) => {
    gameManager.startGame(pin, socket.id);
  });

  // Aluno envia resposta
  socket.on('player:submit_answer', ({ pin, optionId }, callback) => {
    const result = gameManager.submitAnswer(socket.id, pin, optionId);
    if (callback) callback(result);
  });

  // Apresentador avança para o placar da rodada
  socket.on('host:show_leaderboard', ({ pin }) => {
    gameManager.showLeaderboard(pin, socket.id);
  });

  // Apresentador avança para a próxima pergunta
  socket.on('host:next_question', ({ pin }) => {
    const session = gameManager.getGame(pin);
    if (session && session.hostSocketId === socket.id) {
      gameManager.startNextQuestion(session);
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log(`[Socket] Desconectado: ${socket.id}`);
    gameManager.handleDisconnect(socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`=================================================`);
  console.log(`⚡ QUIZ AO VIVO - OPERATIVE SYSTEM INITIALIZED`);
  console.log(`👉 Acesso Local (PC): http://localhost:${PORT}`);
  console.log(`📱 Acesso Celulares (Wi-Fi): http://${localIp}:${PORT}`);
  console.log(`=================================================`);
});
