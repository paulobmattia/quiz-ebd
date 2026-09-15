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
  timeLimit: number;
  points: number;
  explanation?: string;
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

export type GameStatus = 
  | 'LOBBY' 
  | 'COUNTDOWN' 
  | 'QUESTION' 
  | 'REVEAL' 
  | 'LEADERBOARD' 
  | 'PODIUM' 
  | 'FINISHED';

export interface PublicQuestion {
  id: string;
  text: string;
  imageUrl?: string;
  timeLimit: number;
  points: number;
  options: Array<{ id: string; text: string }>;
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
  optionCounts: Record<string, number>;
  totalAnswers: number;
  correctOptionId: string;
}

export interface NetworkInfo {
  localIp: string;
  port: number;
  clientPort: number;
  localUrl: string;
  devClientUrl: string;
}
