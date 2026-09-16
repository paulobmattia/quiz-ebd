import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Smartphone,
  Eye
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
  | 'ELIMINATED'
  | 'PODIUM';

const AVATARS = ['🦁', '👑', '🕊️', '⚡', '🌟', '📖', '🛡️', '⛵', '🍞', '🍇', '🔥', '🏆'];

export const PlayerView: React.FC<PlayerViewProps> = ({ initialPin = '', onExit }) => {
  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [state, setState] = useState<PlayerState>('JOIN');
  const [errorMessage, setErrorMessage] = useState('');
  const [isEliminated, setIsEliminated] = useState(false);

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
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    if (pinParam) {
      setPin(pinParam);
    }

    // Contagem regressiva
    socket.on('game:countdown', () => {
      setState('COUNTDOWN');
      soundManager.playTick();
      if ('vibrate' in navigator) navigator.vibrate(50);
    });

    // Início de nova pergunta
    socket.on('question:start', (data) => {
      if (isEliminated) {
        setState('ELIMINATED');
        setCurrentQuestion(data.question);
        setQuestionIndex(data.questionIndex);
        setTotalQuestions(data.totalQuestions);
        return;
      }

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

    // Confirmação de resposta registrada
    socket.on('answer:confirmed', ({ optionId }) => {
      setSelectedOptionId(optionId);
      setState('ANSWERED');
      soundManager.playClick();
      if ('vibrate' in navigator) navigator.vibrate([40, 40, 40]);
    });

    // Notificação de eliminação (Modo Sobrevivência)
    socket.on('player:eliminated', () => {
      setIsEliminated(true);
      setState('ELIMINATED');
      soundManager.playWrong();
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    });

    // Resultado individual da rodada
    socket.on('player:result', (result) => {
      setRoundResult(result);
      setTotalScore(result.totalScore);
      if (result.isEliminated) {
        setIsEliminated(true);
      }
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

    // Apresentador encerrou a sessão
    socket.on('game:host_disconnected', ({ message }) => {
      alert(message || 'A sessão foi encerrada pelo apresentador.');
      onExit();
    });

    return () => {
      socket.off('game:countdown');
      socket.off('question:start');
      socket.off('timer:tick');
      socket.off('answer:confirmed');
      socket.off('player:eliminated');
      socket.off('player:result');
      socket.off('player:leaderboard');
      socket.off('game:podium');
      socket.off('game:host_disconnected');
    };
  }, [isEliminated]);

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
    if (state !== 'QUESTION' || selectedOptionId || isEliminated) return;
    setSelectedOptionId(optionId);
    setState('ANSWERED');
    soundManager.playClick();
    if ('vibrate' in navigator) navigator.vibrate(80);

    socket.emit('player:submit_answer', { pin, optionId });
  };

  // Cores dos botões de resposta no celular
  const optionThemes = [
    { bg: 'choice-cyan', symbol: '▲', color: 'text-[#00E5FF]', label: 'A' },
    { bg: 'choice-red', symbol: '◆', color: 'text-[#E51C24]', label: 'B' },
    { bg: 'choice-amber', symbol: '●', color: 'text-amber-400', label: 'C' },
    { bg: 'choice-emerald', symbol: '■', color: 'text-emerald-400', label: 'D' },
  ];

  return (
    <div className="min-h-[90vh] flex flex-col justify-between max-w-md mx-auto px-4 py-6 text-center select-none font-sans cyber-grid">
      {/* ==================================================== */}
      {/* 1. TELA DE ENTRADA (PIN, NICK, AVATAR) */}
      {/* ==================================================== */}
      {state === 'JOIN' && (
        <div className="hud-panel p-6 space-y-5 my-auto text-left">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-lg bg-[#03060A] border border-[#27272A] flex items-center justify-center text-[#00E5FF] mx-auto mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-widest block">
              CONSOLE DO OPERATIVO
            </span>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Conectar ao Quiz</h2>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#E51C24]/10 border border-[#E51C24]/30 rounded-lg text-[#E51C24] text-xs font-mono font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase block mb-1">PIN DA SALA</label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center font-mono text-2xl tracking-widest py-2 bg-[#03060A] border border-[#27272A] rounded-lg text-[#00E5FF] focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase block mb-1">SEU NOME / APELIDO</label>
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Paulo"
                className="w-full py-2 px-3 bg-[#03060A] border border-[#27272A] rounded-lg text-white text-sm focus:border-[#00E5FF] focus:outline-none font-sans"
              />
            </div>

            {/* Escolha de Avatar */}
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase block mb-2">INSÍGNIA TÁTICA</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setAvatar(emoji);
                    }}
                    className={`h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                      avatar === emoji
                        ? 'bg-[#00E5FF] text-[#03060A] scale-105 shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                        : 'bg-[#03060A] border border-[#27272A] hover:border-white/40'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono font-bold text-xs uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all mt-3"
            >
              AUTORIZAR E ENTRAR
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. SALA DE ESPERA (LOBBY DO PARTICIPANTE) */}
      {/* ==================================================== */}
      {state === 'WAITING_LOBBY' && (
        <div className="hud-panel p-8 space-y-6 my-auto">
          <div className="w-20 h-20 rounded-lg bg-[#03060A] border-2 border-[#00E5FF] text-4xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,229,255,0.25)]">
            {avatar}
          </div>

          <div className="space-y-1 font-mono">
            <span className="text-[10px] text-[#00E5FF] uppercase tracking-wider block">OPERATIVO CONECTADO</span>
            <h2 className="text-xl font-bold text-white font-sans">{nickname}</h2>
            <div className="inline-block px-3 py-1 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold">
              SALAL #{pin}
            </div>
          </div>

          <div className="p-4 bg-[#03060A] rounded-lg border border-[#27272A] space-y-1.5 font-mono text-xs">
            <p className="text-white font-bold uppercase">
              OLHE PARA O TELÃO DO PROFESSOR
            </p>
            <p className="text-[#A1A1AA] text-[11px]">
              O quiz começará em instantes. Quanto mais rápido você responder, maior será seu bônus de pontuação!
            </p>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. CONTAGEM REGRESSIVA */}
      {/* ==================================================== */}
      {state === 'COUNTDOWN' && (
        <div className="my-auto space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#00E5FF] flex items-center justify-center mx-auto animate-pulse-cyan text-[#00E5FF] text-2xl font-mono font-bold">
            !
          </div>
          <h2 className="text-xl font-mono font-bold text-white uppercase tracking-wider">ATENÇÃO</h2>
          <p className="text-xs font-mono text-[#A1A1AA]">CARREGANDO PERGUNTA NO DISPOSITIVO...</p>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. PERGUNTA & BOTÕES DE RESPOSTA */}
      {/* ==================================================== */}
      {state === 'QUESTION' && currentQuestion && (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
          {/* Topo da Pergunta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#00E5FF] font-bold">
                FASE {questionIndex} / {totalQuestions}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-black ${
                  timeRemaining <= 5 ? 'bg-[#E51C24] text-white animate-pulse' : 'bg-[#18181B] text-[#00E5FF] border border-[#27272A]'
                }`}
              >
                ⏱️ {timeRemaining}S
              </span>
            </div>

            {/* Enunciado da Pergunta direto no Smartphone */}
            <div className="hud-panel p-4 text-left">
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {currentQuestion.text}
              </h3>
            </div>
          </div>

          {/* Botões Grandes para Toque */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {currentQuestion.options.map((opt, idx) => {
              const theme = optionThemes[idx % optionThemes.length];
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full p-3.5 rounded-lg ${theme.bg} active:scale-95 text-white font-bold text-left flex items-center gap-3 transition-transform`}
                >
                  <span className={`w-8 h-8 rounded bg-[#03060A] border border-white/20 flex items-center justify-center text-sm font-black shrink-0 ${theme.color}`}>
                    {theme.symbol}
                  </span>
                  <span className="text-xs sm:text-sm font-sans flex-1">
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Barra de Tempo no Celular */}
          <div className="w-full bg-[#18181B] rounded-full h-2 overflow-hidden border border-[#27272A]">
            <div
              className="h-full bg-[#00E5FF] transition-all duration-1000"
              style={{ width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. RESPOSTA ENVIADA / BLOQUEADA */}
      {/* ==================================================== */}
      {state === 'ANSWERED' && (
        <div className="hud-panel p-8 space-y-5 my-auto">
          <div className="w-14 h-14 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF] text-[#00E5FF] text-2xl flex items-center justify-center mx-auto animate-pulse">
            ✓
          </div>
          <div className="space-y-1 font-mono">
            <span className="text-[10px] text-[#00E5FF] uppercase tracking-wider block">TRANSMISSÃO CONCLUÍDA</span>
            <h2 className="text-lg font-bold text-white font-sans uppercase">Resposta Registrada</h2>
            <p className="text-xs text-[#A1A1AA]">Aguardando encerramento da rodada no telão...</p>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. RESULTADO DA RODADA */}
      {/* ==================================================== */}
      {state === 'RESULT' && roundResult && (
        <div className="hud-panel p-6 space-y-4 my-auto text-center">
          {roundResult.isCorrect ? (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF] text-[#00E5FF] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-[#00E5FF] uppercase">ACERTOU!</h2>
              <div className="inline-block px-3 py-1 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] font-mono font-bold text-base">
                +{roundResult.pointsAwarded} PONTOS
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#E51C24]/20 border border-[#E51C24] text-[#E51C24] flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-[#E51C24] uppercase">RESPOSTA INCORRETA</h2>
              <p className="text-xs text-[#A1A1AA]">Foco na próxima rodada!</p>
            </div>
          )}

          {roundResult.explanation && (
            <div className="p-3 bg-[#03060A] rounded-lg border border-[#27272A] text-left text-xs space-y-1 font-sans">
              <span className="font-mono font-bold text-[#00E5FF] flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> REFERÊNCIA:
              </span>
              <p className="text-[#A1A1AA] text-[11px]">{roundResult.explanation}</p>
            </div>
          )}

          <div className="pt-3 border-t border-[#27272A] flex items-center justify-around font-mono text-xs">
            <div>
              <span className="text-[#A1A1AA] block text-[10px]">TOTAL ACUMULADO</span>
              <span className="font-bold text-white text-base">
                {totalScore.toLocaleString()} PTS
              </span>
            </div>
            {playerRank && (
              <div>
                <span className="text-[#A1A1AA] block text-[10px]">POSIÇÃO ATUAL</span>
                <span className="font-bold text-[#00E5FF] text-base">
                  #{playerRank} LUGAR
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. MODO ESPECTADOR (OPERATIVO ELIMINADO) */}
      {/* ==================================================== */}
      {state === 'ELIMINATED' && (
        <div className="hud-panel p-6 space-y-4 my-auto border-[#E51C24]/50">
          <div className="w-14 h-14 rounded-full bg-[#E51C24]/20 border border-[#E51C24] text-[#E51C24] flex items-center justify-center mx-auto animate-pulse">
            <Eye className="w-7 h-7" />
          </div>
          <div className="space-y-1 font-mono">
            <span className="text-[10px] text-[#E51C24] uppercase tracking-widest block font-bold">
              MODO SOBREVIVÊNCIA
            </span>
            <h2 className="text-base font-bold text-white uppercase">MODO ESPECTADOR ATIVO</h2>
            <p className="text-xs text-[#A1A1AA]">
              Você foi eliminado da disputa direta nesta rodada, mas pode continuar acompanhando a partida ao vivo pelo telão!
            </p>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. PÓDIO FINAL */}
      {/* ==================================================== */}
      {state === 'PODIUM' && (
        <div className="hud-panel p-6 space-y-5 my-auto text-center font-mono">
          <div className="text-5xl animate-bounce">🏆</div>
          <div className="space-y-1">
            <span className="text-[10px] text-[#00E5FF] uppercase tracking-widest block font-bold">
              MISSÃO FINALIZADA
            </span>
            <h2 className="text-xl font-bold text-white uppercase font-sans">Fim do Quiz!</h2>
          </div>

          <div className="bg-[#03060A] p-4 rounded-lg border border-[#27272A] space-y-2">
            <div className="text-3xl">{avatar}</div>
            <h3 className="text-sm font-bold text-white font-sans">{nickname}</h3>
            <div className="text-lg font-bold text-[#00E5FF]">
              {totalScore.toLocaleString()} PONTOS
            </div>
            {playerRank && (
              <div className="text-xs font-bold text-amber-400">
                POSIÇÃO FINAL: #{playerRank} LUGAR
              </div>
            )}
          </div>

          <button
            onClick={onExit}
            className="w-full py-2.5 bg-[#03060A] hover:bg-[#27272A] border border-[#27272A] text-white font-bold text-xs uppercase rounded-lg transition-all"
          >
            SAIR DO QUIZ
          </button>
        </div>
      )}
    </div>
  );
};
