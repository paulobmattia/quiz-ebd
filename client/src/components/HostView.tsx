import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Play, 
  ChevronRight, 
  Trophy, 
  Flame, 
  Maximize2, 
  Minimize2, 
  Home, 
  BookOpen, 
  CheckCircle2, 
  Download,
  Terminal,
  Crosshair,
  Volume2,
  VolumeX
} from 'lucide-react';
import { socket } from '../services/socket.js';
import { soundManager } from '../utils/audio.js';
import type { 
  GameStatus, 
  PublicQuestion, 
  LeaderboardEntry, 
  QuestionResultStats 
} from '../types.js';

interface HostViewProps {
  quizId: string;
  onExit: () => void;
}

export const HostView: React.FC<HostViewProps> = ({ quizId, onExit }) => {
  const [pin, setPin] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>('LOBBY');
  const [players, setPlayers] = useState<Array<{ id: string; nickname: string; avatar: string }>>([]);
  const [countdown, setCountdown] = useState<number>(3);
  
  // Pergunta atual
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<PublicQuestion | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(20);
  const [answeredCount, setAnsweredCount] = useState<number>(0);

  // Revelação de Resposta
  const [stats, setStats] = useState<QuestionResultStats | null>(null);

  // Placar & Pódio
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLastQuestion, setIsLastQuestion] = useState<boolean>(false);
  const [podium, setPodium] = useState<Array<{ id: string; nickname: string; avatar: string; score: number; rank: number }>>([]);

  // URL e Rede
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted);

  useEffect(() => {
    // Cria sessão no servidor
    socket.emit('host:create_game', { quizId }, (res: any) => {
      if (res.error) {
        alert(res.error);
        onExit();
        return;
      }
      setPin(res.pin);
      setQuizTitle(res.quizTitle);
      setTotalQuestions(res.totalQuestions);

      // Constrói URL amigável para celular
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocalhost) {
        setJoinUrl(`${window.location.origin}/?pin=${res.pin}`);
      } else {
        const host = res.localIp || window.location.hostname;
        const port = window.location.port === '5173' ? '5173' : window.location.port || '3001';
        const protocol = window.location.protocol;
        setJoinUrl(`${protocol}//${host}:${port}/?pin=${res.pin}`);
      }
    });

    // Escuta atualizações do lobby
    socket.on('lobby:update', (data) => {
      setPlayers(data.players);
    });

    // Contagem regressiva
    socket.on('game:countdown', ({ count }) => {
      setStatus('COUNTDOWN');
      setCountdown(count);
      soundManager.playTick();
    });

    // Início da pergunta
    socket.on('question:start', (data) => {
      setStatus('QUESTION');
      setQuestionIndex(data.questionIndex);
      setCurrentQuestion(data.question);
      setTimeRemaining(data.timeRemaining);
      setAnsweredCount(0);
      setStats(null);
      soundManager.playQuestionStart();
    });

    // Cronômetro da pergunta
    socket.on('timer:tick', ({ timeRemaining: remaining }) => {
      setTimeRemaining(remaining);
      if (remaining <= 5 && remaining > 0) {
        soundManager.playTick();
      }
    });

    // Contagem de respostas recebidas em tempo real
    socket.on('host:answer_count', ({ answeredCount: count }) => {
      setAnsweredCount(count);
      soundManager.playClick();
    });

    // Revelação dos resultados e gráfico de respostas
    socket.on('question:reveal', (resultStats: QuestionResultStats) => {
      setStatus('REVEAL');
      setStats(resultStats);
      soundManager.playCorrect();
    });

    // Atualização do placar
    socket.on('leaderboard:update', (data) => {
      setStatus('LEADERBOARD');
      setLeaderboard(data.leaderboard);
      setIsLastQuestion(data.isLastQuestion);
      soundManager.playFanfare();
    });

    // Pódio Final com Celebração
    socket.on('game:podium', (data) => {
      setStatus('PODIUM');
      setPodium(data.podium);
      soundManager.playFanfare();

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 120,
          origin: { y: 0.4 },
        });
      }, 700);
    });

    return () => {
      socket.off('lobby:update');
      socket.off('game:countdown');
      socket.off('question:start');
      socket.off('timer:tick');
      socket.off('host:answer_count');
      socket.off('question:reveal');
      socket.off('leaderboard:update');
      socket.off('game:podium');
    };
  }, [quizId]);

  // Atalhos de Teclado do Apresentador (Espaço/Enter para avançar, F para tela cheia, M para som)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita disparar atalhos se estiver em um input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (status === 'LOBBY') handleStartGame();
        else if (status === 'REVEAL') handleShowLeaderboard();
        else if (status === 'LEADERBOARD') handleNextQuestion();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        const muted = soundManager.toggleMute();
        setIsMuted(muted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, pin, players.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleStartGame = () => {
    if (players.length === 0) {
      if (!window.confirm('Nenhum aluno conectado. Deseja iniciar a demonstração mesmo assim?')) return;
    }
    soundManager.playClick();
    socket.emit('host:start_game', { pin });
  };

  const handleShowLeaderboard = () => {
    soundManager.playClick();
    socket.emit('host:show_leaderboard', { pin });
  };

  const handleNextQuestion = () => {
    soundManager.playClick();
    socket.emit('host:next_question', { pin });
  };

  // Cores de Alto Contraste Operative Selection
  const optionThemes = [
    { bg: 'choice-cyan', symbol: '▲', color: 'text-[#00E5FF]', label: 'A' },
    { bg: 'choice-red', symbol: '◆', color: 'text-[#E51C24]', label: 'B' },
    { bg: 'choice-amber', symbol: '●', color: 'text-amber-400', label: 'C' },
    { bg: 'choice-emerald', symbol: '■', color: 'text-emerald-400', label: 'D' },
  ];

  return (
    <div className="min-h-screen bg-[#03060A] text-white flex flex-col justify-between select-none relative overflow-hidden font-sans cyber-grid radial-ambient">
      {/* Barra de Comando Superior */}
      <header className="px-6 py-3.5 flex items-center justify-between border-b border-[#27272A] bg-[#18181B]/90 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-lg bg-[#03060A] border border-[#27272A] hover:border-[#00E5FF] text-[#A1A1AA] hover:text-white transition-all"
            title="Encerrar Sessão e Voltar"
          >
            <Home className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight uppercase">
              <span>{quizTitle || 'Operative Quiz Live'}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-bold">
                PIN: {pin}
              </span>
            </h2>
            <p className="text-[11px] font-mono text-[#A1A1AA]">
              {status === 'LOBBY' ? '/// AGUARDANDO CONEXÃO DE OPERATIVOS' : `FASE: PERGUNTA ${questionIndex} DE ${totalQuestions}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#03060A] border border-[#27272A] text-white">
            <Users className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>{players.length} CONECTADOS</span>
          </div>

          <button
            onClick={() => {
              const muted = soundManager.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 rounded-lg bg-[#03060A] border border-[#27272A] text-[#A1A1AA] hover:text-[#00E5FF] transition-colors"
            title={isMuted ? 'Ativar Som (M)' : 'Silenciar Som (M)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#E51C24]" /> : <Volume2 className="w-4 h-4 text-[#00E5FF]" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#03060A] border border-[#27272A] text-[#A1A1AA] hover:text-[#00E5FF] transition-colors"
            title={isFullscreen ? 'Sair da Tela Cheia (F)' : 'Tela Cheia / Projetor (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ==================================================== */}
      {/* 1. TELA DE LOBBY (QR CODE + PIN + OPERATIVOS) */}
      {/* ==================================================== */}
      {status === 'LOBBY' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
            {/* Moldura Tática com QR Code e PIN */}
            <div className="hud-panel p-8 space-y-6 flex flex-col items-center relative group">
              <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF] uppercase tracking-widest">
                <Crosshair className="w-4 h-4" /> SCANNER DIRETO DE CONEXÃO
              </div>

              {joinUrl && (
                <div className="p-4 bg-white rounded-lg shadow-[0_0_25px_rgba(0,229,255,0.25)] border-2 border-[#00E5FF] transition-transform">
                  <QRCodeSVG value={joinUrl} size={210} level="M" />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-mono text-[#A1A1AA] uppercase">OU DIGITE O PIN NO NAVEGADOR:</p>
                <div className="font-mono text-5xl font-black tracking-widest text-[#00E5FF] bg-[#03060A] px-6 py-2 rounded-lg border border-[#27272A] inline-block shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                  {pin}
                </div>
              </div>

              <p className="text-[11px] font-mono text-[#A1A1AA] break-all max-w-xs">
                {joinUrl}
              </p>
            </div>

            {/* Painel de Participantes Conectados */}
            <div className="hud-panel p-8 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-[#27272A] pb-3">
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#00E5FF]" /> OPERATIVOS REGISTRADOS
                  </h3>
                  <span className="font-mono text-xl font-bold text-[#00E5FF]">{players.length}</span>
                </div>

                {players.length === 0 ? (
                  <div className="py-14 text-[#A1A1AA] text-center space-y-3 font-mono text-xs">
                    <div className="w-10 h-10 rounded-full border border-dashed border-[#27272A] flex items-center justify-center mx-auto text-[#00E5FF] animate-spin">
                      +
                    </div>
                    <p>AGUARDANDO ENTRADA DE DISPOSITIVOS...</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[#03060A] border border-[#27272A] px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono text-white shadow-sm"
                      >
                        <span>{p.avatar}</span>
                        <span className="font-bold">{p.nickname}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Iniciar Jogo */}
              <div className="space-y-2">
                <button
                  onClick={handleStartGame}
                  className="w-full py-4 px-6 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all transform hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 fill-current" /> INICIAR SESSÃO TÁTICA [ESPAÇO]
                </button>
                <p className="text-[10px] font-mono text-[#A1A1AA] text-center">
                  ATALHO: PRESSIONE A BARRA DE ESPAÇO PARA INICIAR
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ==================================================== */}
      {/* 2. CONTAGEM REGRESSIVA 3..2..1 */}
      {/* ==================================================== */}
      {status === 'COUNTDOWN' && (
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="w-36 h-36 rounded-full border-2 border-[#00E5FF] flex items-center justify-center animate-pulse-cyan bg-[#18181B]">
            <span className="text-8xl font-black font-mono text-[#00E5FF]">
              {countdown}
            </span>
          </div>
          <p className="text-xl font-mono font-bold text-white mt-8 tracking-widest uppercase">
            SISTEMA INICIANDO... PREPAREM-SE
          </p>
        </main>
      )}

      {/* ==================================================== */}
      {/* 3. TELA DA PERGUNTA (ENUNCIADO + ALTERNATIVAS) */}
      {/* ==================================================== */}
      {status === 'QUESTION' && currentQuestion && (
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-6">
          {/* Topo da Pergunta */}
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="px-3 py-1 rounded bg-[#18181B] border border-[#27272A] text-[#00E5FF] font-bold">
                FASE {questionIndex} / {totalQuestions}
              </span>

              {/* Cronômetro */}
              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center font-mono font-black text-2xl border transition-all ${
                  timeRemaining <= 5
                    ? 'bg-[#E51C24] text-white border-[#E51C24] animate-pulse-red'
                    : 'bg-[#18181B] text-[#00E5FF] border-[#00E5FF]'
                }`}
              >
                {timeRemaining}
              </div>

              {/* Respostas já enviadas */}
              <div className="px-3 py-1 rounded bg-[#18181B] border border-[#27272A] text-white font-bold">
                {answeredCount} / {players.length} RESPONDERAM
              </div>
            </div>

            {/* Enunciado da Pergunta */}
            <div className="hud-panel p-8 sm:p-10 text-center">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed tracking-tight">
                {currentQuestion.text}
              </h1>
            </div>
          </div>

          {/* Grid com as 4 Alternativas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((opt, idx) => {
              const theme = optionThemes[idx % optionThemes.length];
              return (
                <div
                  key={opt.id}
                  className={`${theme.bg} p-5 rounded-lg flex items-center gap-4 transition-all`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-[#03060A] border border-white/20 flex items-center justify-center text-lg font-black ${theme.color}`}>
                    {theme.symbol}
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-white flex-1">
                    {opt.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Barra de Progresso do Tempo */}
          <div className="w-full bg-[#18181B] rounded-full h-2.5 overflow-hidden border border-[#27272A]">
            <div
              className={`h-full transition-all duration-1000 ${
                timeRemaining <= 5 ? 'bg-[#E51C24]' : 'bg-[#00E5FF]'
              }`}
              style={{ width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%` }}
            />
          </div>
        </main>
      )}

      {/* ==================================================== */}
      {/* 4. REVELAÇÃO DA RESPOSTA & GRÁFICO DE VOTOS */}
      {/* ==================================================== */}
      {status === 'REVEAL' && stats && (
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-widest">
              DIAGNÓSTICO DA RODADA /// VOTAÇÃO REGISTRADA
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.question.text}
            </h2>
          </div>

          {/* Gráficos de Barras com Votos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.question.options.map((opt, idx) => {
              const count = stats.optionCounts[opt.id] || 0;
              const percent = stats.totalAnswers > 0 ? Math.round((count / stats.totalAnswers) * 100) : 0;
              const isCorrect = opt.id === stats.correctOptionId;
              const theme = optionThemes[idx % optionThemes.length];

              return (
                <div
                  key={opt.id}
                  className={`p-5 rounded-lg border-2 flex flex-col justify-between transition-all ${
                    isCorrect
                      ? 'bg-[#18181B] border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                      : 'bg-[#18181B]/60 border-[#27272A] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 font-mono">
                    <span className={`w-7 h-7 rounded bg-[#03060A] flex items-center justify-center font-bold text-xs ${theme.color}`}>
                      {theme.symbol}
                    </span>
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> CORRETA
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-sm text-white mb-4 line-clamp-2">
                    {opt.text}
                  </p>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#A1A1AA]">{count} votos</span>
                      <span className="text-white font-bold">{percent}%</span>
                    </div>
                    <div className="w-full bg-[#03060A] rounded-full h-2 overflow-hidden border border-[#27272A]">
                      <div
                        className={`h-full ${isCorrect ? 'bg-[#00E5FF]' : 'bg-[#A1A1AA]'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicação Bíblica / Didática */}
          {stats.question.explanation && (
            <div className="hud-panel p-4 flex items-start gap-3 text-left border-[#00E5FF]/30">
              <BookOpen className="w-5 h-5 text-[#00E5FF] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold text-[#00E5FF] uppercase">
                  REFERÊNCIA DIDÁTICA:
                </h4>
                <p className="text-sm text-slate-200 mt-1">{stats.question.explanation}</p>
              </div>
            </div>
          )}

          {/* Botão de Avanço */}
          <div className="text-center pt-2">
            <button
              onClick={handleShowLeaderboard}
              className="py-3 px-8 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
            >
              EXIBIR PLACAR DA RODADA [ESPAÇO]
            </button>
          </div>
        </main>
      )}

      {/* ==================================================== */}
      {/* 5. PLACAR / LEADERBOARD DA RODADA */}
      {/* ==================================================== */}
      {status === 'LEADERBOARD' && (
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-widest">
              SISTEMA DE CLASSIFICAÇÃO AO VIVO
            </span>
            <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <Trophy className="w-7 h-7 text-[#00E5FF]" /> RANKING DOS OPERATIVOS
            </h2>
          </div>

          <div className="space-y-2.5">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className="hud-panel p-3.5 flex items-center justify-between hover:border-[#00E5FF]/50 transition-all font-mono"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-[#00E5FF] text-[#03060A] font-black'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950 font-bold'
                        : idx === 2
                        ? 'bg-[#E51C24] text-white'
                        : 'bg-[#03060A] text-[#A1A1AA] border border-[#27272A]'
                    }`}
                  >
                    #{entry.rank}
                  </span>

                  <span className="text-xl">{entry.avatar}</span>
                  <div>
                    <span className="font-bold text-white text-sm font-sans">{entry.nickname}</span>
                    {entry.streak > 1 && (
                      <span className="ml-2 text-xs text-[#E51C24] font-bold inline-flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-current" /> {entry.streak}x STREAK
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-lg text-[#00E5FF]">
                    {entry.score.toLocaleString()} PTS
                  </span>
                  {entry.lastPointsEarned > 0 && (
                    <span className="block text-[11px] text-emerald-400 font-bold">
                      +{entry.lastPointsEarned}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleNextQuestion}
              className="py-3.5 px-8 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all inline-flex items-center gap-2"
            >
              {isLastQuestion ? (
                <>
                  <Trophy className="w-4 h-4" /> REVELAR PÓDIO FINAL [ESPAÇO]
                </>
              ) : (
                <>
                  <span>PRÓXIMA PERGUNTA [ESPAÇO]</span> <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </main>
      )}

      {/* ==================================================== */}
      {/* 6. PÓDIO FINAL & RELATÓRIO CSV */}
      {/* ==================================================== */}
      {status === 'PODIUM' && (
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-5xl mx-auto w-full text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#00E5FF] bg-[#18181B] border border-[#00E5FF]/30 px-3 py-1 rounded-full uppercase">
              MISSÃO CONCLUÍDA /// PÓDIO FINAL
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
              CAMPEÕES DA SESSÃO
            </h1>
          </div>

          {/* Degraus do Pódio */}
          <div className="flex items-end justify-center gap-4 sm:gap-6 my-8 max-w-xl mx-auto w-full">
            {/* 2º Lugar */}
            {podium[1] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-4xl mb-1 animate-bounce">{podium[1].avatar}</div>
                <div className="font-bold text-xs text-white truncate max-w-[100px]">
                  {podium[1].nickname}
                </div>
                <div className="font-mono text-xs text-[#00E5FF] font-bold mb-2">
                  {podium[1].score.toLocaleString()} PTS
                </div>
                <div className="w-full h-36 bg-[#18181B] rounded-t-lg flex items-center justify-center font-mono font-black text-3xl text-slate-300 border-t-4 border-slate-300 shadow-lg">
                  2º
                </div>
              </div>
            )}

            {/* 1º Lugar */}
            {podium[0] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-5xl mb-1 animate-bounce">👑</div>
                <div className="text-4xl mb-1">{podium[0].avatar}</div>
                <div className="font-extrabold text-sm text-[#00E5FF] truncate max-w-[120px]">
                  {podium[0].nickname}
                </div>
                <div className="font-mono text-xs text-[#00E5FF] font-black mb-2">
                  {podium[0].score.toLocaleString()} PTS
                </div>
                <div className="w-full h-52 bg-[#18181B] rounded-t-lg flex items-center justify-center font-mono font-black text-4xl text-[#00E5FF] border-t-4 border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.3)]">
                  1º
                </div>
              </div>
            )}

            {/* 3º Lugar */}
            {podium[2] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-4xl mb-1 animate-bounce">{podium[2].avatar}</div>
                <div className="font-bold text-xs text-white truncate max-w-[100px]">
                  {podium[2].nickname}
                </div>
                <div className="font-mono text-xs text-[#E51C24] font-bold mb-2">
                  {podium[2].score.toLocaleString()} PTS
                </div>
                <div className="w-full h-28 bg-[#18181B] rounded-t-lg flex items-center justify-center font-mono font-black text-2xl text-[#E51C24] border-t-4 border-[#E51C24] shadow-lg">
                  3º
                </div>
              </div>
            )}
          </div>

          {/* Ações e Download de Relatório CSV */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <button
              onClick={onExit}
              className="py-2.5 px-5 rounded-lg bg-[#03060A] hover:bg-[#27272A] border border-[#27272A] text-white font-mono text-xs font-bold uppercase transition-all"
            >
              VOLTAR AO INÍCIO
            </button>

            {/* Download Relatório CSV */}
            <a
              href={`/api/sessions/${pin}/report`}
              download
              className="py-2.5 px-5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#00E5FF]/50 text-[#00E5FF] font-mono text-xs font-bold uppercase inline-flex items-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.2)] transition-all"
            >
              <Download className="w-3.5 h-3.5" /> BAIXAR RELATÓRIO (CSV)
            </a>

            <button
              onClick={() => {
                socket.emit('host:create_game', { quizId }, (res: any) => {
                  setPin(res.pin);
                  setStatus('LOBBY');
                });
              }}
              className="py-2.5 px-5 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              JOGAR NOVAMENTE
            </button>
          </div>
        </main>
      )}
    </div>
  );
};
