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
  Sparkles
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

      // Constrói URL amigável para celular (funciona tanto na nuvem quanto no Wi-Fi local)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocalhost) {
        // Na nuvem (ex: Render, Railway), usa o domínio público com HTTPS
        setJoinUrl(`${window.location.origin}/?pin=${res.pin}`);
      } else {
        // Em rede local, usa o IP do Wi-Fi detectado pelo servidor
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

    // Contagem regressiva antes da pergunta
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

    // Contagem em tempo real de quem já respondeu
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

      // Dispara chuva de confetes no telão
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
      if (!window.confirm('Ainda não há participantes na sala. Deseja iniciar mesmo assim para testar?')) {
        return;
      }
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

  // Cores das alternativas estilo Mentimeter / Kahoot
  const optionThemes = [
    { bg: 'from-rose-600 to-red-700', border: 'border-red-500', symbol: '▲' },
    { bg: 'from-blue-600 to-indigo-700', border: 'border-blue-500', symbol: '◆' },
    { bg: 'from-amber-500 to-yellow-600', border: 'border-amber-400', symbol: '●' },
    { bg: 'from-emerald-600 to-green-700', border: 'border-emerald-500', symbol: '■' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none relative overflow-hidden">
      {/* Barra Superior do Apresentador */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Encerrar e Voltar"
          >
            <Home className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <span>{quizTitle || 'Quiz ao Vivo'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PIN: {pin}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {status === 'LOBBY' ? 'Aguardando participantes' : `Pergunta ${questionIndex} de ${totalQuestions}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{players.length} conectados</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Projetor / Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ==================================================== */}
      {/* 1. TELA DE LOBBY (QR CODE + PIN + AVATARES) */}
      {/* ==================================================== */}
      {status === 'LOBBY' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center w-full">
            {/* Bloco do QR Code e PIN */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 flex flex-col items-center">
              <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Aponte a Câmera do Celular
              </span>

              {/* QR Code com Link Direto */}
              {joinUrl && (
                <div className="p-4 bg-white rounded-2xl shadow-xl hover:scale-105 transition-transform">
                  <QRCodeSVG value={joinUrl} size={220} level="M" />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-slate-400">Ou acesse no navegador e digite o PIN:</p>
                <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-widest text-indigo-400 bg-slate-950 px-6 py-2 rounded-2xl border border-slate-800 inline-block shadow-inner">
                  {pin}
                </div>
              </div>

              <p className="text-xs text-slate-400 font-mono break-all max-w-xs">
                {joinUrl}
              </p>
            </div>

            {/* Bloco de Participantes Conectados */}
            <div className="flex flex-col justify-between h-full space-y-6 bg-slate-900/50 border border-slate-800/80 p-8 rounded-3xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-emerald-400" /> Participantes na Sala
                  </h3>
                  <span className="text-2xl font-black text-emerald-400">{players.length}</span>
                </div>

                {players.length === 0 ? (
                  <div className="py-12 text-slate-500 text-center space-y-3">
                    <Sparkles className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                    <p className="text-sm">Escaneie o QR Code ou digite o PIN para entrar...</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto p-1">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="animate-pulse-subtle bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow-md"
                      >
                        <span className="text-lg">{p.avatar}</span>
                        <span className="text-white">{p.nickname}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Iniciar Jogo */}
              <button
                onClick={handleStartGame}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02]"
              >
                <Play className="w-6 h-6 fill-white" /> Iniciar Quiz Agora
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ==================================================== */}
      {/* 2. CONTAGEM REGRESSIVA 3..2..1 */}
      {/* ==================================================== */}
      {status === 'COUNTDOWN' && (
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-bounce">
            <span className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
              {countdown}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-300 mt-6 tracking-wide">
            Preparem-se...
          </p>
        </main>
      )}

      {/* ==================================================== */}
      {/* 3. TELA DA PERGUNTA (CRONÔMETRO + TELÃO) */}
      {/* ==================================================== */}
      {status === 'QUESTION' && currentQuestion && (
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-6xl mx-auto w-full">
          {/* Topo da Pergunta: Enunciado e Cronômetro */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-4 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm font-bold">
                Pergunta {questionIndex} de {totalQuestions}
              </span>

              {/* Cronômetro */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-black text-2xl shadow-xl transition-all ${
                  timeRemaining <= 5
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {timeRemaining}
              </div>

              {/* Respostas já enviadas */}
              <div className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold flex items-center gap-2">
                <span>{answeredCount} de {players.length} responderam</span>
              </div>
            </div>

            {/* Texto Enunciado da Pergunta */}
            <div className="bg-slate-900/90 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl text-center">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed">
                {currentQuestion.text}
              </h1>
            </div>
          </div>

          {/* Grid com as 4 Alternativas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-8">
            {currentQuestion.options.map((opt, idx) => {
              const theme = optionThemes[idx % optionThemes.length];
              return (
                <div
                  key={opt.id}
                  className={`bg-gradient-to-r ${theme.bg} p-6 rounded-2xl shadow-lg border ${theme.border} flex items-center gap-4`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center text-2xl font-black">
                    {theme.symbol}
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-white flex-1">
                    {opt.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Barra de Progresso do Tempo */}
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-1000 ${
                timeRemaining <= 5 ? 'bg-rose-500' : 'bg-indigo-500'
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
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-6xl mx-auto w-full">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.question.text}
            </h2>
            <p className="text-sm text-slate-400">Distribuição das respostas dos participantes:</p>
          </div>

          {/* Gráfico de Barras com Votos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            {stats.question.options.map((opt, idx) => {
              const count = stats.optionCounts[opt.id] || 0;
              const percent = stats.totalAnswers > 0 ? Math.round((count / stats.totalAnswers) * 100) : 0;
              const isCorrect = opt.id === stats.correctOptionId;
              const theme = optionThemes[idx % optionThemes.length];

              return (
                <div
                  key={opt.id}
                  className={`relative p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/70 border-emerald-400 shadow-xl shadow-emerald-500/20'
                      : 'bg-slate-900/90 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sm">
                      {theme.symbol}
                    </span>
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> CORRETA
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-base text-white mb-4 line-clamp-2">
                    {opt.text}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">{count} votos</span>
                      <span className="text-white">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${isCorrect ? 'bg-emerald-400' : 'bg-slate-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicação Bíblica / Didática (Se houver) */}
          {stats.question.explanation && (
            <div className="bg-indigo-950/40 border border-indigo-800/60 p-5 rounded-2xl flex items-start gap-3 text-left">
              <BookOpen className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-indigo-300">Explicação & Referência:</h4>
                <p className="text-sm text-slate-200 mt-1">{stats.question.explanation}</p>
              </div>
            </div>
          )}

          {/* Botão para Exibir Placar */}
          <div className="text-center pt-4">
            <button
              onClick={handleShowLeaderboard}
              className="py-3.5 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base inline-flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all"
            >
              <Trophy className="w-5 h-5 text-amber-300" /> Ver Placar da Rodada
            </button>
          </div>
        </main>
      )}

      {/* ==================================================== */}
      {/* 5. PLACAR / LEADERBOARD DA RODADA */}
      {/* ==================================================== */}
      {status === 'LEADERBOARD' && (
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-amber-400" /> Placar ao Vivo
            </h2>
            <p className="text-sm text-slate-400">Classificação dos melhores colocados</p>
          </div>

          {/* Tabela de Classificação dos Melhores */}
          <div className="space-y-3 my-6">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950 ring-2 ring-slate-200'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {entry.rank}
                  </span>

                  <span className="text-2xl">{entry.avatar}</span>
                  <div>
                    <span className="font-bold text-white text-base">{entry.nickname}</span>
                    {entry.streak > 1 && (
                      <span className="ml-2 text-xs text-amber-400 font-bold inline-flex items-center gap-0.5">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" /> {entry.streak} seguidas!
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-xl text-indigo-400">
                    {entry.score.toLocaleString()} pts
                  </span>
                  {entry.lastPointsEarned > 0 && (
                    <span className="block text-xs text-emerald-400 font-semibold">
                      +{entry.lastPointsEarned}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botão de Avanço */}
          <div className="text-center pt-4">
            <button
              onClick={handleNextQuestion}
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-lg inline-flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all"
            >
              {isLastQuestion ? (
                <>
                  <Trophy className="w-5 h-5 text-amber-300" /> Revelar Pódio dos Vencedores!
                </>
              ) : (
                <>
                  <span>Próxima Pergunta</span> <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </main>
      )}

      {/* ==================================================== */}
      {/* 6. PÓDIO FINAL / VITÓRIA (1º, 2º e 3º LUGARES) */}
      {/* ==================================================== */}
      {status === 'PODIUM' && (
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-5xl mx-auto w-full text-center">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              Fim de Jogo!
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              🎉 Pódio dos Campeões
            </h1>
          </div>

          {/* Degraus do Pódio Olímpico */}
          <div className="flex items-end justify-center gap-4 sm:gap-6 my-10 max-w-xl mx-auto w-full">
            {/* 2º Lugar */}
            {podium[1] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-4xl mb-2 animate-bounce">{podium[1].avatar}</div>
                <div className="font-bold text-sm text-slate-200 truncate max-w-[100px]">
                  {podium[1].nickname}
                </div>
                <div className="font-mono text-xs text-indigo-300 font-bold mb-2">
                  {podium[1].score.toLocaleString()} pts
                </div>
                <div className="w-full h-36 bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-2xl flex items-center justify-center font-black text-3xl text-slate-300 shadow-xl border-t-4 border-slate-300">
                  2º
                </div>
              </div>
            )}

            {/* 1º Lugar (Centro e mais alto) */}
            {podium[0] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-6xl mb-2 animate-bounce">👑</div>
                <div className="text-5xl mb-2">{podium[0].avatar}</div>
                <div className="font-extrabold text-base text-amber-300 truncate max-w-[120px]">
                  {podium[0].nickname}
                </div>
                <div className="font-mono text-sm text-amber-400 font-black mb-2">
                  {podium[0].score.toLocaleString()} pts
                </div>
                <div className="w-full h-52 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl flex items-center justify-center font-black text-4xl text-slate-950 shadow-2xl border-t-4 border-amber-300">
                  1º
                </div>
              </div>
            )}

            {/* 3º Lugar */}
            {podium[2] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-4xl mb-2 animate-bounce">{podium[2].avatar}</div>
                <div className="font-bold text-sm text-slate-200 truncate max-w-[100px]">
                  {podium[2].nickname}
                </div>
                <div className="font-mono text-xs text-indigo-300 font-bold mb-2">
                  {podium[2].score.toLocaleString()} pts
                </div>
                <div className="w-full h-28 bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-2xl flex items-center justify-center font-black text-2xl text-amber-300 shadow-xl border-t-4 border-amber-600">
                  3º
                </div>
              </div>
            )}
          </div>

          {/* Ações Finais */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onExit}
              className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => {
                socket.emit('host:create_game', { quizId }, (res: any) => {
                  setPin(res.pin);
                  setStatus('LOBBY');
                });
              }}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/25"
            >
              Jogar Novamente
            </button>
          </div>
        </main>
      )}
    </div>
  );
};
