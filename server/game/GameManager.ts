import { Server, Socket } from 'socket.io';
import { 
  Quiz, 
  Player, 
  GameStatus, 
  QuestionResultStats, 
  LeaderboardEntry,
  PlayerAnswer
} from '../types.js';

interface GameSession {
  pin: string;
  quiz: Quiz;
  hostSocketId: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartTime: number;
  players: Map<string, Player>; // socketId -> Player
  answers: Map<string, PlayerAnswer>; // socketId -> PlayerAnswer
  timerInterval?: NodeJS.Timeout;
  timeRemaining: number;
}

export class GameManager {
  private io: Server;
  private games: Map<string, GameSession> = new Map(); // pin -> session

  constructor(io: Server) {
    this.io = io;
  }

  public generatePin(): string {
    let pin = '';
    do {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.games.has(pin));
    return pin;
  }

  public createGame(quiz: Quiz, hostSocketId: string): string {
    const pin = this.generatePin();
    const session: GameSession = {
      pin,
      quiz,
      hostSocketId,
      status: 'LOBBY',
      currentQuestionIndex: -1,
      questionStartTime: 0,
      players: new Map(),
      answers: new Map(),
      timeRemaining: 0,
    };

    this.games.set(pin, session);
    return pin;
  }

  public getGame(pin: string): GameSession | undefined {
    return this.games.get(pin);
  }

  public getGameByHostSocketId(socketId: string): GameSession | undefined {
    for (const session of this.games.values()) {
      if (session.hostSocketId === socketId) {
        return session;
      }
    }
    return undefined;
  }

  public getGameByPlayerSocketId(socketId: string): GameSession | undefined {
    for (const session of this.games.values()) {
      if (session.players.has(socketId)) {
        return session;
      }
    }
    return undefined;
  }

  public joinPlayer(pin: string, nickname: string, avatar: string, socket: Socket): { success: boolean; error?: string } {
    const session = this.games.get(pin);
    if (!session) {
      return { success: false, error: 'Sala não encontrada. Verifique o PIN digitado.' };
    }

    if (session.status !== 'LOBBY') {
      return { success: false, error: 'Este quiz já começou ou foi finalizado.' };
    }

    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      return { success: false, error: 'Por favor, digite um nome ou apelido válido.' };
    }

    // Verifica se nome já existe
    for (const p of session.players.values()) {
      if (p.nickname.toLowerCase() === trimmedNick.toLowerCase()) {
        return { success: false, error: 'Já existe um participante com esse nome nesta sala. Escolha outro.' };
      }
    }

    const player: Player = {
      id: socket.id,
      nickname: trimmedNick,
      avatar: avatar || '⭐',
      score: 0,
      streak: 0,
      connected: true,
    };

    session.players.set(socket.id, player);
    socket.join(pin);

    // Notifica todos na sala
    this.broadcastLobby(session);

    return { success: true };
  }

  public broadcastLobby(session: GameSession) {
    const playersList = Array.from(session.players.values()).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
    }));

    this.io.to(session.pin).emit('lobby:update', {
      pin: session.pin,
      quizTitle: session.quiz.title,
      category: session.quiz.category,
      playerCount: playersList.length,
      players: playersList,
      gameMode: session.quiz.gameMode,
    });
  }

  public startGame(pin: string, hostSocketId: string) {
    const session = this.games.get(pin);
    if (!session || session.hostSocketId !== hostSocketId) return;

    session.status = 'COUNTDOWN';
    session.currentQuestionIndex = -1;

    let countdown = 3;
    this.io.to(session.pin).emit('game:countdown', { count: countdown });

    const countdownInterval = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        this.io.to(session.pin).emit('game:countdown', { count: countdown });
      } else {
        clearInterval(countdownInterval);
        this.startNextQuestion(session);
      }
    }, 1000);
  }

  public startNextQuestion(session: GameSession) {
    if (session.timerInterval) {
      clearInterval(session.timerInterval);
    }

    session.currentQuestionIndex += 1;
    if (session.currentQuestionIndex >= session.quiz.questions.length) {
      this.finishGame(session);
      return;
    }

    const question = session.quiz.questions[session.currentQuestionIndex];
    session.status = 'QUESTION';
    session.answers.clear();
    session.questionStartTime = Date.now();
    session.timeRemaining = question.timeLimit;

    // Remove isCorrect dos dados enviados aos clientes para evitar trapaças
    const publicQuestion = {
      id: question.id,
      text: question.text,
      imageUrl: question.imageUrl,
      timeLimit: question.timeLimit,
      points: question.points,
      options: question.options.map((o) => ({ id: o.id, text: o.text })),
    };

    this.io.to(session.pin).emit('question:start', {
      questionIndex: session.currentQuestionIndex + 1,
      totalQuestions: session.quiz.questions.length,
      question: publicQuestion,
      timeRemaining: session.timeRemaining,
      totalPlayers: session.players.size,
    });

    session.timerInterval = setInterval(() => {
      session.timeRemaining -= 1;
      this.io.to(session.pin).emit('timer:tick', { timeRemaining: session.timeRemaining });

      if (session.timeRemaining <= 0) {
        this.revealQuestion(session);
      }
    }, 1000);
  }

  public submitAnswer(socketId: string, pin: string, optionId: string): { success: boolean; error?: string } {
    const session = this.games.get(pin);
    if (!session) return { success: false, error: 'Sessão não encontrada' };
    if (session.status !== 'QUESTION') return { success: false, error: 'A rodada não está aceitando respostas' };

    const player = session.players.get(socketId);
    if (!player) return { success: false, error: 'Jogador não encontrado' };
    if (session.answers.has(socketId)) return { success: false, error: 'Você já respondeu esta pergunta' };

    const question = session.quiz.questions[session.currentQuestionIndex];
    const option = question.options.find((o) => o.id === optionId);
    if (!option) return { success: false, error: 'Opção inválida' };

    const responseTimeMs = Date.now() - session.questionStartTime;
    const isCorrect = option.isCorrect;

    // Cálculo da pontuação
    let pointsAwarded = 0;
    if (isCorrect) {
      if (session.quiz.gameMode === 'speed_bonus') {
        const totalDurationMs = question.timeLimit * 1000;
        const timeFraction = Math.max(0, Math.min(1, responseTimeMs / totalDurationMs));
        // Base de 500 pontos + até 500 de bônus por rapidez
        const basePoints = question.points * 0.5;
        const speedBonus = question.points * 0.5 * (1 - timeFraction);
        pointsAwarded = Math.round(basePoints + speedBonus);
      } else {
        pointsAwarded = question.points;
      }
      player.streak += 1;
    } else {
      player.streak = 0;
      if (session.quiz.gameMode === 'elimination') {
        player.isEliminated = true;
      }
    }

    player.score += pointsAwarded;

    const playerAnswer: PlayerAnswer = {
      questionId: question.id,
      optionId,
      responseTimeMs,
      isCorrect,
      pointsAwarded,
    };

    player.lastAnswer = playerAnswer;
    session.answers.set(socketId, playerAnswer);

    // Envia confirmação ao jogador
    this.io.to(socketId).emit('answer:confirmed', {
      optionId,
      timeRemaining: session.timeRemaining,
    });

    // Atualiza contagem de respostas na tela do apresentador
    this.io.to(session.hostSocketId).emit('host:answer_count', {
      answeredCount: session.answers.size,
      totalPlayers: session.players.size,
    });

    // Se todos responderam, finaliza a pergunta imediatamente!
    if (session.answers.size >= session.players.size && session.players.size > 0) {
      this.revealQuestion(session);
    }

    return { success: true };
  }

  public revealQuestion(session: GameSession) {
    if (session.timerInterval) {
      clearInterval(session.timerInterval);
      session.timerInterval = undefined;
    }

    session.status = 'REVEAL';
    const question = session.quiz.questions[session.currentQuestionIndex];
    const correctOption = question.options.find((o) => o.isCorrect);

    // Contagem de votos por alternativa
    const optionCounts: Record<string, number> = {};
    question.options.forEach((o) => (optionCounts[o.id] = 0));

    session.answers.forEach((ans) => {
      if (optionCounts[ans.optionId] !== undefined) {
        optionCounts[ans.optionId] += 1;
      }
    });

    const stats: QuestionResultStats = {
      question,
      optionCounts,
      totalAnswers: session.answers.size,
      correctOptionId: correctOption?.id || '',
    };

    // Emite revelação para a tela grande (Host)
    this.io.to(session.hostSocketId).emit('question:reveal', stats);

    // Emite resultado individual para cada aluno em seu celular
    session.players.forEach((player, socketId) => {
      const ans = session.answers.get(socketId);
      this.io.to(socketId).emit('player:result', {
        answered: !!ans,
        isCorrect: ans ? ans.isCorrect : false,
        pointsAwarded: ans ? ans.pointsAwarded : 0,
        totalScore: player.score,
        correctOptionId: correctOption?.id,
        explanation: question.explanation,
      });
    });
  }

  public showLeaderboard(pin: string, hostSocketId: string) {
    const session = this.games.get(pin);
    if (!session || session.hostSocketId !== hostSocketId) return;

    session.status = 'LEADERBOARD';

    const sortedPlayers = Array.from(session.players.values()).sort((a, b) => b.score - a.score);

    const leaderboard: LeaderboardEntry[] = sortedPlayers.map((p, idx) => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      rank: idx + 1,
      lastPointsEarned: p.lastAnswer?.pointsAwarded || 0,
      isCorrect: p.lastAnswer?.isCorrect || false,
    }));

    const isLastQuestion = session.currentQuestionIndex >= session.quiz.questions.length - 1;

    // Emite placar geral para o telão
    this.io.to(session.hostSocketId).emit('leaderboard:update', {
      leaderboard: leaderboard.slice(0, 10), // Top 10
      isLastQuestion,
    });

    // Emite posição individual para cada aluno
    leaderboard.forEach((entry) => {
      this.io.to(entry.id).emit('player:leaderboard', {
        rank: entry.rank,
        score: entry.score,
        totalPlayers: leaderboard.length,
        isLastQuestion,
      });
    });
  }

  public finishGame(session: GameSession) {
    if (session.timerInterval) {
      clearInterval(session.timerInterval);
    }

    session.status = 'PODIUM';

    const sortedPlayers = Array.from(session.players.values()).sort((a, b) => b.score - a.score);

    const podium = sortedPlayers.slice(0, 5).map((p, idx) => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      rank: idx + 1,
    }));

    this.io.to(session.pin).emit('game:podium', {
      podium,
      allPlayersCount: sortedPlayers.length,
    });
  }

  public handleDisconnect(socketId: string) {
    // Se o host desconectar
    for (const [pin, session] of this.games.entries()) {
      if (session.hostSocketId === socketId) {
        if (session.timerInterval) {
          clearInterval(session.timerInterval);
        }
        this.io.to(pin).emit('game:host_disconnected', { message: 'O apresentador encerrou a sessão.' });
        this.games.delete(pin);
        break;
      } else if (session.players.has(socketId)) {
        const p = session.players.get(socketId)!;
        p.connected = false;
        // Se estiver em lobby, remove
        if (session.status === 'LOBBY') {
          session.players.delete(socketId);
          this.broadcastLobby(session);
        }
        break;
      }
    }
  }
}
