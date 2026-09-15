import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Smartphone
} from 'lucide-react';
import { socket } from '../services/socket.js';
import { soundManager } from '../utils/audio.js';
import type { PublicQuestion } from '../types.js';

interface PlayerViewProps {
  initialPin?: string;
  onExit: () => void;
}

type PlayerState = 
  | 'JOIN' 
  | 'WAITING_LOBBY' 
  | 'COUNTDOWN' 
  | 'QUESTION' 
  | 'ANSWERED' 
  | 'RESULT' 
  | 'PODIUM';

const AVATARS = ['🦁', '👑', '🕊️', '⚡', '🌟', '📖', '🛡️', '⛵', '🍞', '🍇', '🔥', '🏆'];

export const PlayerView: React.FC<PlayerViewProps> = ({ initialPin = '', onExit }) => {
  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [state, setState] = useState<PlayerState>('JOIN');
  const [errorMessage, setErrorMessage] = useState('');

  // Pergunta em andamento
  const [currentQuestion, setCurrentQuestion] = useState<PublicQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Resultado da rodada
  const [roundResult, setRoundResult] = useState<{
    answered: boolean;
    isCorrect: boolean;
    pointsAwarded: number;
    totalScore: number;
    correctOptionId?: string;
    explanation?: string;
  } | null>(null);

  // Placar / Pódio individual
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number>(0);

  useEffect(() => {
    // Se o PIN vier por parâmetro de URL (ex: ?pin=123456)
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    if (pinParam) {
      setPin(pinParam);
    }

    // Escuta contagem regressiva
    socket.on('game:countdown', () => {
      setState('COUNTDOWN');
      soundManager.playTick();
      if ('vibrate' in navigator) navigator.vibrate(50);
    });

    // Início de nova pergunta
    socket.on('question:start', (data) => {
      setState('QUESTION');
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setTimeRemaining(data.timeRemaining);
      setSelectedOptionId(null);
      setRoundResult(null);
      soundManager.playQuestionStart();
      if ('vibrate' in navigator) navigator.vibrate(100);
    });

    // Cronômetro
    socket.on('timer:tick', ({ timeRemaining: remaining }) => {
      setTimeRemaining(remaining);
      if (remaining <= 3 && remaining > 0) {
        soundManager.playTick();
      }
    });

    // Confirmação de resposta recebida
    socket.on('answer:confirmed', ({ optionId }) => {
      setSelectedOptionId(optionId);
      setState('ANSWERED');
      soundManager.playClick();
      if ('vibrate' in navigator) navigator.vibrate([40, 40, 40]);
    });

    // Resultado individual da rodada
    socket.on('player:result', (result) => {
      setRoundResult(result);
      setTotalScore(result.totalScore);
      setState('RESULT');
      if (result.isCorrect) {
        soundManager.playCorrect();
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      } else {
        soundManager.playWrong();
        if ('vibrate' in navigator) navigator.vibrate(200);
      }
    });

    // Posição no placar
    socket.on('player:leaderboard', ({ rank, score }) => {
      setPlayerRank(rank);
      setTotalScore(score);
    });

    // Pódio final
    socket.on('game:podium', () => {
      setState('PODIUM');
      soundManager.playFanfare();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    });

    // Apresentador desconectou
    socket.on('game:host_disconnected', ({ message }) => {
      alert(message || 'A sessão foi encerrada pelo apresentador.');
      onExit();
    });

    return () => {
      socket.off('game:countdown');
      socket.off('question:start');
      socket.off('timer:tick');
      socket.off('answer:confirmed');
      socket.off('player:result');
      socket.off('player:leaderboard');
      socket.off('game:podium');
      socket.off('game:host_disconnected');
    };
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    soundManager.playClick();

    if (!pin.trim() || !nickname.trim()) {
      setErrorMessage('Preencha o PIN e seu nome.');
      return;
    }

    socket.emit('player:join', { pin: pin.trim(), nickname: nickname.trim(), avatar }, (res: any) => {
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao entrar na sala.');
        return;
      }
      setState('WAITING_LOBBY');
    });
  };

  const handleSelectOption = (optionId: string) => {
    if (state !== 'QUESTION' || selectedOptionId) return;
    setSelectedOptionId(optionId);
    setState('ANSWERED');
    soundManager.playClick();
    if ('vibrate' in navigator) navigator.vibrate(80);

    socket.emit('player:submit_answer', { pin, optionId });
  };

  // Cores dos botões de resposta no celular
  const optionThemes = [
    { bg: 'from-rose-600 to-red-700', symbol: '▲' },
    { bg: 'from-blue-600 to-indigo-700', symbol: '◆' },
    { bg: 'from-amber-500 to-yellow-600', symbol: '●' },
    { bg: 'from-emerald-600 to-green-700', symbol: '■' },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-between max-w-md mx-auto px-4 py-6 text-center select-none">
      {/* ==================================================== */}
      {/* 1. TELA DE ENTRADA (PIN, NICK, AVATAR) */}
      {/* ==================================================== */}
      {state === 'JOIN' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 my-auto">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-2xl mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Entrar no Quiz</h2>
            <p className="text-xs text-slate-400 mt-1">
              Participe ao vivo e dispute o topo do ranking!
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">PIN da Sala</label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 593821"
                className="w-full text-center font-mono text-2xl tracking-widest py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Seu Nome ou Apelido</label>
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Como quer ser chamado?"
                className="w-full py-2.5 px-4 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Escolha de Avatar */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Escolha seu Avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setAvatar(emoji);
                    }}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      avatar === emoji
                        ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-105'
                        : 'bg-slate-950 hover:bg-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-600/30 transition-all mt-4"
            >
              Entrar no Jogo!
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. SALA DE ESPERA (LOBBY DO PARTICIPANTE) */}
      {/* ==================================================== */}
      {state === 'WAITING_LOBBY' && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 my-auto">
          <div className="w-24 h-24 rounded-full bg-indigo-500/20 text-6xl flex items-center justify-center mx-auto animate-bounce shadow-inner border border-indigo-500/30">
            {avatar}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">{nickname}</h2>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              ✓ Conectado na Sala {pin}
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-sm font-semibold text-slate-200">
              Olhe para a tela do professor!
            </p>
            <p className="text-xs text-slate-400">
              O quiz começará assim que o professor clicar em "Iniciar". Seja rápido nas respostas para pontuar mais alto!
            </p>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. CONTAGEM REGRESSIVA */}
      {/* ==================================================== */}
      {state === 'COUNTDOWN' && (
        <div className="my-auto space-y-4">
          <div className="text-6xl animate-pulse">⚡</div>
          <h2 className="text-2xl font-extrabold text-white">Atenção!</h2>
          <p className="text-sm text-slate-400">A pergunta está prestes a aparecer...</p>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. PERGUNTA & BOTÕES DE RESPOSTA NO CELULAR */}
      {/* ==================================================== */}
      {state === 'QUESTION' && currentQuestion && (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
          {/* Cabeçalho da Pergunta no Celular */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-400">
                Pergunta {questionIndex} de {totalQuestions}
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg font-mono font-black ${
                  timeRemaining <= 5 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-200'
                }`}
              >
                ⏱️ {timeRemaining}s
              </span>
            </div>

            {/* Texto da pergunta no celular (Estilo Mentimeter: acessível e fácil de ler de perto!) */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {currentQuestion.text}
              </h3>
            </div>
          </div>

          {/* Botões Grandes para Toque com as Alternativas */}
          <div className="grid grid-cols-1 gap-3 my-auto">
            {currentQuestion.options.map((opt, idx) => {
              const theme = optionThemes[idx % optionThemes.length];
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full p-4 rounded-2xl bg-gradient-to-r ${theme.bg} hover:brightness-110 active:scale-95 text-white font-bold text-left flex items-center gap-3 shadow-lg transition-transform`}
                >
                  <span className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center text-lg font-black shrink-0">
                    {theme.symbol}
                  </span>
                  <span className="text-sm sm:text-base leading-snug flex-1">
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Barra de Tempo no Celular */}
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. RESPOSTA ENVIADA / AGUARDANDO REVELAÇÃO */}
      {/* ==================================================== */}
      {state === 'ANSWERED' && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 my-auto">
          <div className="w-20 h-20 rounded-full bg-indigo-500/20 text-4xl flex items-center justify-center mx-auto animate-pulse">
            ✓
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Resposta Registrada!</h2>
            <p className="text-sm text-slate-400">
              Aguardando os outros participantes responderem...
            </p>
          </div>
          <div className="text-xs text-indigo-400 font-semibold animate-pulse">
            Fique atento ao telão para a resposta certa!
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. RESULTADO DA RODADA NO CELULAR */}
      {/* ==================================================== */}
      {state === 'RESULT' && roundResult && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-5 my-auto text-center">
          {roundResult.isCorrect ? (
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-5xl">
                <CheckCircle2 className="w-14 h-14" />
              </div>
              <h2 className="text-3xl font-black text-emerald-400">Você Acertou! 🎉</h2>
              <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-lg">
                +{roundResult.pointsAwarded} pontos
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-5xl">
                <XCircle className="w-14 h-14" />
              </div>
              <h2 className="text-2xl font-black text-rose-400">Que pena, você errou!</h2>
              <p className="text-xs text-slate-400">Não desanime, a próxima pergunta vem aí!</p>
            </div>
          )}

          {/* Explicação Bíblica / Didática no Celular */}
          {roundResult.explanation && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-1">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Explicação:
              </span>
              <p className="text-slate-300">{roundResult.explanation}</p>
            </div>
          )}

          {/* Pontuação Acumulada e Posição */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-around text-xs">
            <div>
              <span className="text-slate-400 block">Sua Pontuação</span>
              <span className="font-mono font-black text-lg text-white">
                {totalScore.toLocaleString()} pts
              </span>
            </div>
            {playerRank && (
              <div>
                <span className="text-slate-400 block">Sua Posição</span>
                <span className="font-black text-lg text-amber-400">
                  #{playerRank} lugar
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. PÓDIO / FINAL DO QUIZ NO CELULAR */}
      {/* ==================================================== */}
      {state === 'PODIUM' && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 my-auto text-center">
          <div className="text-6xl animate-bounce">🏆</div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Fim do Quiz!</h2>
            <p className="text-xs text-slate-400">Obrigado por participar!</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-3xl">{avatar}</div>
            <h3 className="text-lg font-bold text-white">{nickname}</h3>
            <div className="font-mono text-xl font-black text-indigo-400">
              {totalScore.toLocaleString()} pontos
            </div>
            {playerRank && (
              <div className="text-sm font-bold text-amber-400">
                Posição Final: #{playerRank} lugar
              </div>
            )}
          </div>

          <button
            onClick={onExit}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Sair do Quiz
          </button>
        </div>
      )}
    </div>
  );
};
