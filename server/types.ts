export type GameMode = 'speed_bonus' | 'traditional' | 'elimination';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  timeLimit: number; // segundos (ex: 15, 20, 30)
  points: number; // base de pontos (ex: 1000)
  explanation?: string; // explicação após a pergunta
  options: Option[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  gameMode: GameMode;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerAnswer {
  questionId: string;
  optionId: string;
  responseTimeMs: number;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface Player {
  id: string; // socket.id
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  lastAnswer?: PlayerAnswer;
  isEliminated?: boolean;
  connected: boolean;
}

export type GameStatus = 
  | 'LOBBY' 
  | 'COUNTDOWN' 
  | 'QUESTION' 
  | 'REVEAL' 
  | 'LEADERBOARD' 
  | 'PODIUM' 
  | 'FINISHED';

export interface GameSessionState {
  pin: string;
  quizId: string;
  quizTitle: string;
  category: string;
  gameMode: GameMode;
  status: GameStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion?: Omit<Question, 'options'> & {
    options: Array<{ id: string; text: string }>; // sem o campo isCorrect para não vazar a resposta
  };
  timeRemaining?: number;
  playerCount: number;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  rank: number;
  lastPointsEarned: number;
  isCorrect: boolean;
}

export interface QuestionResultStats {
  question: Question;
  optionCounts: Record<string, number>; // optionId -> total de votos
  totalAnswers: number;
  correctOptionId: string;
}
