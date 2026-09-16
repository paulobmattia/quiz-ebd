import fs from 'fs';
import path from 'path';
import { Quiz } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');

const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-biblico-classico',
    title: 'Super Quiz Bíblico - Heróis da Fé',
    description: 'Um desafio emocionante sobre as histórias mais marcantes da Bíblia para toda a classe!',
    category: 'EBD / Bíblico',
    gameMode: 'speed_bonus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        text: 'Quem construiu a grande arca para salvar sua família e os animais do grande dilúvio?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Gênesis 6:14 - Deus ordenou a Noé que fizesse uma arca de madeira de gofer.',
        options: [
          { id: 'q1-a', text: 'Moisés', isCorrect: false },
          { id: 'q1-b', text: 'Noé', isCorrect: true },
          { id: 'q1-c', text: 'Abraão', isCorrect: false },
          { id: 'q1-d', text: 'Davi', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        text: 'Quantas pedras lisas Davi escolheu no ribeiro antes de vencer o gigante Golias?',
        timeLimit: 20,
        points: 1000,
        explanation: '1 Samuel 17:40 - Davi escolheu 5 pedras lisas do ribeiro e as pôs no seu alforje.',
        options: [
          { id: 'q2-a', text: '1 pedra', isCorrect: false },
          { id: 'q2-b', text: '3 pedras', isCorrect: false },
          { id: 'q2-c', text: '5 pedras', isCorrect: true },
          { id: 'q2-d', text: '7 pedras', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        text: 'Qual mar se abriu em dois para o povo de Israel passar a pé enxuto?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Êxodo 14:21-22 - Moisés estendeu a mão sobre o mar, e o Senhor abriu o Mar Vermelho.',
        options: [
          { id: 'q3-a', text: 'Mar Vermelho', isCorrect: true },
          { id: 'q3-b', text: 'Mar Morto', isCorrect: false },
          { id: 'q3-c', text: 'Mar da Galileia', isCorrect: false },
          { id: 'q3-d', text: 'Mar Mediterrâneo', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        text: 'Quem foi engolido por um grande peixe após tentar fugir da ordem de ir a Nínive?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Jonas 1:17 - Preparou o Senhor um grande peixe para que tragasse a Jonas.',
        options: [
          { id: 'q4-a', text: 'Elias', isCorrect: false },
          { id: 'q4-b', text: 'Daniel', isCorrect: false },
          { id: 'q4-c', text: 'Jonas', isCorrect: true },
          { id: 'q4-d', text: 'Jeremias', isCorrect: false },
        ],
      },
      {
        id: 'q5',
        text: 'As muralhas de qual cidade vieram abaixo após o povo rodear e tocar as trombetas?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Josué 6:20 - Ouvindo o som das trombetas, o povo gritou com grande alarido, e o muro caiu.',
        options: [
          { id: 'q5-a', text: 'Jerusalém', isCorrect: false },
          { id: 'q5-b', text: 'Jericó', isCorrect: true },
          { id: 'q5-c', text: 'Belém', isCorrect: false },
          { id: 'q5-d', text: 'Damasco', isCorrect: false },
        ],
      },
      {
        id: 'q6',
        text: 'Quem passou a noite na cova dos leões e não foi ferido porque Deus fechou a boca das feras?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Daniel 6:22 - O meu Deus enviou o seu anjo e fechou a boca dos leões.',
        options: [
          { id: 'q6-a', text: 'Daniel', isCorrect: true },
          { id: 'q6-b', text: 'Sansão', isCorrect: false },
          { id: 'q6-c', text: 'José', isCorrect: false },
          { id: 'q6-d', text: 'Ezequiel', isCorrect: false },
        ],
      },
      {
        id: 'q7',
        text: 'Qual apóstolo andou sobre as águas ao encontro de Jesus após Ele dizer "Vem"?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Mateus 14:29 - E Pedro, descendo do barco, andou sobre as águas para ir ter com Jesus.',
        options: [
          { id: 'q7-a', text: 'João', isCorrect: false },
          { id: 'q7-b', text: 'Tiago', isCorrect: false },
          { id: 'q7-c', text: 'Pedro', isCorrect: true },
          { id: 'q7-d', text: 'André', isCorrect: false },
        ],
      },
      {
        id: 'q8',
        text: 'Qual é o fruto do Espírito mencionado pelo apóstolo Paulo em Gálatas 5?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Gálatas 5:22 - Amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão e domínio próprio.',
        options: [
          { id: 'q8-a', text: 'Amor, alegria, paz e domínio próprio', isCorrect: true },
          { id: 'q8-b', text: 'Ouro, prata e pedras preciosas', isCorrect: false },
          { id: 'q8-c', text: 'Força, espada e armadura', isCorrect: false },
          { id: 'q8-d', text: 'Fama, riqueza e autoridade', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'quiz-curiosidades-gerais',
    title: 'Desafio dos Curiosos: Bíblia e História',
    description: 'Perguntas divertidas para testar a memória e a rapidez dos participantes!',
    category: 'Geral / Conhecimento',
    gameMode: 'speed_bonus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'cq1',
        text: 'Qual é o livro com mais capítulos em toda a Bíblia?',
        timeLimit: 20,
        points: 1000,
        explanation: 'O livro de Salmos possui 150 capítulos (salmos) no total.',
        options: [
          { id: 'cq1-a', text: 'Gênesis', isCorrect: false },
          { id: 'cq1-b', text: 'Isaías', isCorrect: false },
          { id: 'cq1-c', text: 'Salmos', isCorrect: true },
          { id: 'cq1-d', text: 'Apocalipse', isCorrect: false },
        ],
      },
      {
        id: 'cq2',
        text: 'Qual rei de Israel pediu sabedoria a Deus para governar o povo com justiça?',
        timeLimit: 20,
        points: 1000,
        explanation: '1 Reis 3:9 - Salomão pediu a Deus um coração compreensivo para julgar o povo.',
        options: [
          { id: 'cq2-a', text: 'Saul', isCorrect: false },
          { id: 'cq2-b', text: 'Salomão', isCorrect: true },
          { id: 'cq2-c', text: 'Herodes', isCorrect: false },
          { id: 'cq2-d', text: 'Acabe', isCorrect: false },
        ],
      },
      {
        id: 'cq3',
        text: 'Quem foi vendido pelos próprios irmãos como escravo e mais tarde se tornou governador do Egito?',
        timeLimit: 20,
        points: 1000,
        explanation: 'Gênesis 41:41 - Faraó disse a José: "Eis que te ponho sobre toda a terra do Egito".',
        options: [
          { id: 'cq3-a', text: 'José', isCorrect: true },
          { id: 'cq3-b', text: 'Benjamim', isCorrect: false },
          { id: 'cq3-c', text: 'Judá', isCorrect: false },
          { id: 'cq3-d', text: 'Gideão', isCorrect: false },
        ],
      },
    ],
  },
];

export const QUESTION_BANK: Array<{
  id: string;
  category: string;
  question: Question;
}> = [
  {
    id: 'qb-1',
    category: 'Novo Testamento',
    question: {
      id: 'qb-q1',
      text: 'Qual apóstolo era cobrador de impostos antes de ser chamado por Jesus?',
      timeLimit: 20,
      points: 1000,
      explanation: 'Mateus 9:9 - Jesus viu um homem chamado Mateus sentado na coletoria e disse-lhe: "Siga-me".',
      options: [
        { id: 'qb-1-a', text: 'Lucas', isCorrect: false },
        { id: 'qb-1-b', text: 'Mateus', isCorrect: true },
        { id: 'qb-1-c', text: 'Bartolomeu', isCorrect: false },
        { id: 'qb-1-d', text: 'Tomé', isCorrect: false },
      ],
    },
  },
  {
    id: 'qb-2',
    category: 'Antigo Testamento',
    question: {
      id: 'qb-q2',
      text: 'Quantos dias e noites choveu sobre a terra durante o dilúvio?',
      timeLimit: 20,
      points: 1000,
      explanation: 'Gênesis 7:12 - E caiu a chuva sobre a terra quarenta dias e quarenta noites.',
      options: [
        { id: 'qb-2-a', text: '40 dias e 40 noites', isCorrect: true },
        { id: 'qb-2-b', text: '7 dias e 7 noites', isCorrect: false },
        { id: 'qb-2-c', text: '100 dias e 100 noites', isCorrect: false },
        { id: 'qb-2-d', text: '30 dias e 30 noites', isCorrect: false },
      ],
    },
  },
  {
    id: 'qb-3',
    category: 'Mulheres da Bíblia',
    question: {
      id: 'qb-q3',
      text: 'Qual rainha judia arriscou a própria vida perante o rei Assuero para salvar seu povo?',
      timeLimit: 20,
      points: 1000,
      explanation: 'Ester 4:16 - "...se perecer, pereci." A rainha Ester intercedeu pelo povo judeu.',
      options: [
        { id: 'qb-3-a', text: 'Rute', isCorrect: false },
        { id: 'qb-3-b', text: 'Sara', isCorrect: false },
        { id: 'qb-3-c', text: 'Ester', isCorrect: true },
        { id: 'qb-3-d', text: 'Débora', isCorrect: false },
      ],
    },
  },
  {
    id: 'qb-4',
    category: 'Gênesis',
    question: {
      id: 'qb-q4',
      text: 'Qual foi o sinal colocado nas nuvens como aliança de que não haveria outro dilúvio universal?',
      timeLimit: 15,
      points: 1000,
      explanation: 'Gênesis 9:13 - "O meu arco tenho posto nas nuvens; este será por sinal da aliança entre mim e a terra."',
      options: [
        { id: 'qb-4-a', text: 'O Arco-Íris', isCorrect: true },
        { id: 'qb-4-b', text: 'Uma Estrela Cadente', isCorrect: false },
        { id: 'qb-4-c', text: 'Uma Nuvem de Fogo', isCorrect: false },
        { id: 'qb-4-d', text: 'Um Relâmpago', isCorrect: false },
      ],
    },
  },
  {
    id: 'qb-5',
    category: 'Geral',
    question: {
      id: 'qb-q5',
      text: 'Quantos livros compõem a Bíblia Sagrada tradicional (39 no AT e 27 no NT)?',
      timeLimit: 20,
      points: 1000,
      explanation: 'A Bíblia contém 66 livros no cânon protestante: 39 no Antigo Testamento e 27 no Novo Testamento.',
      options: [
        { id: 'qb-5-a', text: '66 livros', isCorrect: true },
        { id: 'qb-5-b', text: '73 livros', isCorrect: false },
        { id: 'qb-5-c', text: '50 livros', isCorrect: false },
        { id: 'qb-5-d', text: '70 livros', isCorrect: false },
      ],
    },
  },
  {
    id: 'qb-6',
    category: 'Antigo Testamento',
    question: {
      id: 'qb-q6',
      text: 'Quem foi colocado num cesto de junco nas águas do rio Nilo para ser salvo quando bebê?',
      timeLimit: 20,
      points: 1000,
      explanation: 'Êxodo 2:3 - Joquebede colocou o menino Moisés no cesto de junco entre os juncos à beira do rio.',
      options: [
        { id: 'qb-6-a', text: 'Moisés', isCorrect: true },
        { id: 'qb-6-b', text: 'Josué', isCorrect: false },
        { id: 'qb-6-c', text: 'Samuel', isCorrect: false },
        { id: 'qb-6-d', text: 'Sansão', isCorrect: false },
      ],
    },
  },
];

export class StorageService {
  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(QUIZZES_FILE)) {
      fs.writeFileSync(QUIZZES_FILE, JSON.stringify(INITIAL_QUIZZES, null, 2), 'utf-8');
    }
  }

  public getAllQuizzes(): Quiz[] {
    try {
      this.ensureDataDir();
      const content = fs.readFileSync(QUIZZES_FILE, 'utf-8');
      return JSON.parse(content) as Quiz[];
    } catch (err) {
      console.error('Erro ao ler quizzes:', err);
      return INITIAL_QUIZZES;
    }
  }

  public getQuizById(id: string): Quiz | undefined {
    const quizzes = this.getAllQuizzes();
    return quizzes.find((q) => q.id === id);
  }

  public getQuestionBank() {
    return QUESTION_BANK;
  }

  public saveQuiz(quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Quiz {
    const quizzes = this.getAllQuizzes();
    const now = new Date().toISOString();

    if (quizData.id) {
      const index = quizzes.findIndex((q) => q.id === quizData.id);
      if (index >= 0) {
        const updated: Quiz = {
          ...quizzes[index],
          ...quizData,
          id: quizData.id,
          updatedAt: now,
        };
        quizzes[index] = updated;
        fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');
        return updated;
      }
    }

    const newQuiz: Quiz = {
      ...quizData,
      id: quizData.id || `quiz-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    quizzes.push(newQuiz);
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');
    return newQuiz;
  }

  public deleteQuiz(id: string): boolean {
    const quizzes = this.getAllQuizzes();
    const filtered = quizzes.filter((q) => q.id !== id);
    if (filtered.length !== quizzes.length) {
      fs.writeFileSync(QUIZZES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    }
    return false;
  }

  public importQuizzes(importedQuizzes: Quiz[]): Quiz[] {
    const current = this.getAllQuizzes();
    const currentMap = new Map(current.map((q) => [q.id, q]));
    
    for (const q of importedQuizzes) {
      currentMap.set(q.id, q);
    }
    
    const result = Array.from(currentMap.values());
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(result, null, 2), 'utf-8');
    return result;
  }
}

export const storage = new StorageService();

