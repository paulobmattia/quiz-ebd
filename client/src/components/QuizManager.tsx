import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Copy, 
  Download, 
  Upload, 
  Check, 
  Award, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  Search,
  BookMarked
} from 'lucide-react';
import type { Quiz, Question, GameMode } from '../types.js';
import { soundManager } from '../utils/audio.js';

interface QuizManagerProps {
  onStartQuiz: (quizId: string) => void;
}

interface QuestionBankItem {
  id: string;
  category: string;
  question: Question;
}

export const QuizManager: React.FC<QuizManagerProps> = ({ onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Banco de Questões
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error('Erro ao carregar quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionBank = async () => {
    try {
      const res = await fetch('/api/question-bank');
      if (res.ok) {
        const data = await res.json();
        setQuestionBank(data);
      }
    } catch (err) {
      console.error('Erro ao carregar banco de questões:', err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchQuestionBank();
  }, []);

  const handleStartCreate = () => {
    soundManager.playClick();
    const newQuiz: Quiz = {
      id: '',
      title: 'Novo Quiz Tático',
      description: 'Questionário formatado para dinâmica ao vivo.',
      category: 'EBD / Estudo',
      gameMode: 'speed_bonus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: `q-${Date.now()}-1`,
          text: 'Qual é a primeira pergunta do seu quiz?',
          timeLimit: 20,
          points: 1000,
          explanation: 'Explicação didática da resposta correta.',
          options: [
            { id: 'opt-1', text: 'Alternativa 1', isCorrect: true },
            { id: 'opt-2', text: 'Alternativa 2', isCorrect: false },
            { id: 'opt-3', text: 'Alternativa 3', isCorrect: false },
            { id: 'opt-4', text: 'Alternativa 4', isCorrect: false },
          ],
        },
      ],
    };
    setEditingQuiz(newQuiz);
    setIsCreating(true);
  };

  const handleEdit = (quiz: Quiz) => {
    soundManager.playClick();
    setEditingQuiz(JSON.parse(JSON.stringify(quiz)));
    setIsCreating(false);
  };

  const handleDuplicate = async (quiz: Quiz) => {
    soundManager.playClick();
    const duplicated: Partial<Quiz> = {
      ...JSON.parse(JSON.stringify(quiz)),
      id: undefined,
      title: `${quiz.title} (Cópia)`,
    };
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated),
      });
      if (res.ok) {
        await fetchQuizzes();
      }
    } catch (err) {
      console.error('Erro ao duplicar:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este quiz?')) return;
    soundManager.playClick();
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchQuizzes();
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz) return;
    soundManager.playClick();

    if (!editingQuiz.title.trim()) {
      alert('Por favor, informe um título para o quiz.');
      return;
    }

    if (editingQuiz.questions.length === 0) {
      alert('O quiz precisa ter pelo menos 1 pergunta.');
      return;
    }

    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const q = editingQuiz.questions[i];
      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        alert(`A pergunta #${i + 1} precisa ter pelo menos uma alternativa marcada como correta!`);
        return;
      }
    }

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuiz),
      });

      if (res.ok) {
        setEditingQuiz(null);
        await fetchQuizzes();
      } else {
        alert('Erro ao salvar quiz.');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quizzes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `quizzes-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const toImport = Array.isArray(json) ? json : [json];
        const res = await fetch('/api/quizzes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toImport),
        });
        if (res.ok) {
          alert('Quizzes importados com sucesso!');
          await fetchQuizzes();
        } else {
          alert('Falha ao importar o arquivo.');
        }
      } catch (err) {
        alert('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  // Funções de Pergunta
  const addQuestion = () => {
    if (!editingQuiz) return;
    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: `Pergunta ${editingQuiz.questions.length + 1}`,
      timeLimit: 20,
      points: 1000,
      explanation: '',
      options: [
        { id: `opt-${Date.now()}-1`, text: 'Alternativa 1', isCorrect: true },
        { id: `opt-${Date.now()}-2`, text: 'Alternativa 2', isCorrect: false },
        { id: `opt-${Date.now()}-3`, text: 'Alternativa 3', isCorrect: false },
        { id: `opt-${Date.now()}-4`, text: 'Alternativa 4', isCorrect: false },
      ],
    };
    setEditingQuiz({
      ...editingQuiz,
      questions: [...editingQuiz.questions, newQ],
    });
  };

  // Inserir pergunta do banco de questões
  const handleInsertFromBank = (bankItem: QuestionBankItem) => {
    if (!editingQuiz) return;
    const clonedQuestion: Question = {
      ...JSON.parse(JSON.stringify(bankItem.question)),
      id: `q-${Date.now()}`,
    };
    setEditingQuiz({
      ...editingQuiz,
      questions: [...editingQuiz.questions, clonedQuestion],
    });
    soundManager.playClick();
    setShowBankModal(false);
  };

  const removeQuestion = (idx: number) => {
    if (!editingQuiz || editingQuiz.questions.length <= 1) {
      alert('O quiz precisa ter pelo menos 1 pergunta.');
      return;
    }
    const updated = [...editingQuiz.questions];
    updated.splice(idx, 1);
    setEditingQuiz({ ...editingQuiz, questions: updated });
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!editingQuiz) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= editingQuiz.questions.length) return;

    const list = [...editingQuiz.questions];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    setEditingQuiz({ ...editingQuiz, questions: list });
  };

  const setCorrectOption = (qIdx: number, optId: string) => {
    if (!editingQuiz) return;
    const questions = [...editingQuiz.questions];
    const q = { ...questions[qIdx] };
    q.options = q.options.map((opt) => ({
      ...opt,
      isCorrect: opt.id === optId,
    }));
    questions[qIdx] = q;
    setEditingQuiz({ ...editingQuiz, questions });
  };

  const filteredQuizzes = quizzes.filter((q) => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans space-y-8">
      {/* Header & Ações de Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#00E5FF] uppercase tracking-wider mb-1">
            <BookMarked className="w-4 h-4" /> ESTÚDIO DE CRIAÇÃO /// OPERATIVE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            Gerenciador de Quizzes
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1 font-mono">
            BANCO DE QUESTÕES ILIMITADO // SUPORTE OFFLINE E NUVEM
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <label className="cursor-pointer px-3 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] transition-all flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-[#00E5FF]" /> IMPORTAR JSON
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleExportAll}
            className="px-3 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#00E5FF]" /> BACKUP JSON
          </button>

          <button
            onClick={handleStartCreate}
            className="px-4 py-2 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(0,229,255,0.3)] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> NOVO QUIZ
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-[#A1A1AA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar quizzes por título ou categoria..."
          className="w-full bg-transparent text-xs text-white placeholder-[#A1A1AA] focus:outline-none font-sans"
        />
      </div>

      {/* Lista de Quizzes */}
      {loading ? (
        <div className="text-center py-20 text-[#A1A1AA] font-mono text-xs">CARREGANDO QUESTIONÁRIOS...</div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="hud-panel p-10 text-center space-y-4">
          <Sparkles className="w-8 h-8 text-[#00E5FF] mx-auto" />
          <h3 className="text-base font-bold text-white uppercase font-mono">Nenhum quiz encontrado</h3>
          <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
            Crie um novo quiz ou importe um arquivo de backup para começar.
          </p>
          <button
            onClick={handleStartCreate}
            className="px-5 py-2 rounded-lg bg-[#00E5FF] text-[#03060A] font-mono font-bold text-xs uppercase"
          >
            CRIAR NOVO QUIZ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="hud-panel p-5 flex flex-col justify-between hover:border-[#00E5FF]/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 uppercase">
                    {quiz.category || 'Geral'}
                  </span>
                  <span className="font-mono text-[11px] text-[#A1A1AA]">
                    {quiz.questions.length} FASES
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1 group-hover:text-[#00E5FF] transition-colors font-sans uppercase tracking-tight">
                  {quiz.title}
                </h3>
                <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-4">
                  {quiz.description || 'Sem descrição.'}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-[#A1A1AA] mb-5 bg-[#03060A] p-2 rounded border border-[#27272A] font-mono">
                  <Award className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>
                    MODO:{' '}
                    <strong className="text-white">
                      {quiz.gameMode === 'speed_bonus'
                        ? 'BÔNUS VELOCIDADE'
                        : quiz.gameMode === 'traditional'
                        ? 'TRADICIONAL'
                        : 'ELIMINATÓRIO'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-3 border-t border-[#27272A]">
                <button
                  onClick={() => onStartQuiz(quiz.id)}
                  className="w-full py-2.5 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.25)] transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> ABRIR NO TELÃO
                </button>

                <div className="flex items-center justify-between gap-2 font-mono text-xs">
                  <button
                    onClick={() => handleEdit(quiz)}
                    className="flex-1 py-1.5 rounded bg-[#03060A] hover:bg-[#27272A] text-white border border-[#27272A] flex items-center justify-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3 h-3 text-[#00E5FF]" /> EDITAR
                  </button>
                  <button
                    onClick={() => handleDuplicate(quiz)}
                    title="Duplicar Quiz"
                    className="p-1.5 rounded bg-[#03060A] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    title="Excluir Quiz"
                    className="p-1.5 rounded bg-[#03060A] hover:bg-[#E51C24]/20 text-[#A1A1AA] hover:text-[#E51C24] border border-[#27272A] hover:border-[#E51C24]/50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Painel de Edição de Quiz */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto p-4 sm:p-6 flex justify-center">
          <div className="hud-panel max-w-4xl w-full p-6 sm:p-8 my-auto space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-wider block">
                  EDITOR DE MISSÃO /// OPERATIVE
                </span>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight font-sans">
                  {isCreating ? 'Criar Novo Quiz' : 'Editar Questionário'}
                </h2>
              </div>
              <button
                onClick={() => setEditingQuiz(null)}
                className="text-[#A1A1AA] hover:text-white font-mono text-sm"
              >
                [FECHAR]
              </button>
            </div>

            {/* Configurações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[#A1A1AA] uppercase">TÍTULO DO QUIZ *</label>
                <input
                  type="text"
                  value={editingQuiz.title}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  className="w-full bg-[#03060A] border border-[#27272A] rounded-lg px-3 py-2 text-white font-sans text-sm focus:border-[#00E5FF] focus:outline-none"
                  placeholder="Ex: Super Quiz de Gênesis"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#A1A1AA] uppercase">CATEGORIA</label>
                <input
                  type="text"
                  value={editingQuiz.category}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, category: e.target.value })}
                  className="w-full bg-[#03060A] border border-[#27272A] rounded-lg px-3 py-2 text-white font-sans text-sm focus:border-[#00E5FF] focus:outline-none"
                  placeholder="Ex: EBD Jovens"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[#A1A1AA] uppercase">DESCRIÇÃO</label>
                <input
                  type="text"
                  value={editingQuiz.description}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                  className="w-full bg-[#03060A] border border-[#27272A] rounded-lg px-3 py-2 text-white font-sans text-xs focus:border-[#00E5FF] focus:outline-none"
                  placeholder="Breve resumo da dinâmica..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#A1A1AA] uppercase">MODO DE JOGO</label>
                <select
                  value={editingQuiz.gameMode}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, gameMode: e.target.value as GameMode })}
                  className="w-full bg-[#03060A] border border-[#27272A] rounded-lg px-3 py-2 text-white text-xs focus:border-[#00E5FF] focus:outline-none"
                >
                  <option value="speed_bonus">⚡ Bônus por Velocidade (Mentimeter)</option>
                  <option value="traditional">🎯 Tradicional (Pontos Fixos)</option>
                  <option value="elimination">⚔️ Eliminatório (Sobrevivência)</option>
                </select>
              </div>
            </div>

            {/* Perguntas */}
            <div className="space-y-5 pt-4 border-t border-[#27272A]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  QUESTÕES CADASTRADAS ({editingQuiz.questions.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBankModal(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1"
                  >
                    <BookMarked className="w-3.5 h-3.5" /> BANCO DE QUESTÕES
                  </button>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-2.5 py-1.5 rounded-lg bg-[#18181B] text-white border border-[#27272A] hover:border-[#00E5FF] text-xs font-mono font-bold uppercase transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#00E5FF]" /> ADICIONAR
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {editingQuiz.questions.map((question, qIdx) => (
                  <div
                    key={question.id}
                    className="bg-[#03060A] border border-[#27272A] rounded-lg p-4 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-[#27272A] pb-2 font-mono text-xs">
                      <span className="font-bold text-[#00E5FF]">
                        /// FASE {qIdx + 1} DE {editingQuiz.questions.length}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={qIdx === 0}
                          onClick={() => moveQuestion(qIdx, 'up')}
                          className="p-1 text-[#A1A1AA] hover:text-white disabled:opacity-20"
                          title="Subir"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={qIdx === editingQuiz.questions.length - 1}
                          onClick={() => moveQuestion(qIdx, 'down')}
                          className="p-1 text-[#A1A1AA] hover:text-white disabled:opacity-20"
                          title="Descer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeQuestion(qIdx)}
                          className="p-1 text-[#A1A1AA] hover:text-[#E51C24] ml-2"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Enunciado */}
                    <div>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => {
                          const list = [...editingQuiz.questions];
                          list[qIdx].text = e.target.value;
                          setEditingQuiz({ ...editingQuiz, questions: list });
                        }}
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-white font-sans text-sm focus:border-[#00E5FF] focus:outline-none"
                        placeholder="Digite o enunciado da questão..."
                      />
                    </div>

                    {/* Tempo, Pontos, Explicação e Imagem */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                      <div>
                        <label className="text-[#A1A1AA] block mb-1">TEMPO LIMITE</label>
                        <select
                          value={question.timeLimit}
                          onChange={(e) => {
                            const list = [...editingQuiz.questions];
                            list[qIdx].timeLimit = parseInt(e.target.value, 10);
                            setEditingQuiz({ ...editingQuiz, questions: list });
                          }}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded px-2 py-1.5 text-white"
                        >
                          <option value={10}>10 SEGUNDOS</option>
                          <option value={15}>15 SEGUNDOS</option>
                          <option value={20}>20 SEGUNDOS</option>
                          <option value={30}>30 SEGUNDOS</option>
                          <option value={60}>60 SEGUNDOS</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[#A1A1AA] block mb-1">PONTOS BASE</label>
                        <select
                          value={question.points}
                          onChange={(e) => {
                            const list = [...editingQuiz.questions];
                            list[qIdx].points = parseInt(e.target.value, 10);
                            setEditingQuiz({ ...editingQuiz, questions: list });
                          }}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded px-2 py-1.5 text-white"
                        >
                          <option value={500}>500 PTS</option>
                          <option value={1000}>1000 PTS</option>
                          <option value={2000}>2000 PTS</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[#A1A1AA] block mb-1">REFERÊNCIA / EXPLICAÇÃO DIDÁTICA</label>
                        <input
                          type="text"
                          value={question.explanation || ''}
                          onChange={(e) => {
                            const list = [...editingQuiz.questions];
                            list[qIdx].explanation = e.target.value;
                            setEditingQuiz({ ...editingQuiz, questions: list });
                          }}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded px-2 py-1.5 text-white text-xs font-sans"
                          placeholder="Ex: Gênesis 6:14 - A arca foi construída..."
                        />
                      </div>
                    </div>

                    {/* Alternativas */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-[#A1A1AA] uppercase block">
                        ALTERNATIVAS (CLIQUE NO SÍMBOLO PARA DEFINIR A CORRETA):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {question.options.map((opt, optIdx) => {
                          const symbols = ['▲', '◆', '●', '■'];
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 p-2 rounded-lg bg-[#18181B] border transition-all ${
                                opt.isCorrect
                                  ? 'border-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                                  : 'border-[#27272A]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setCorrectOption(qIdx, opt.id)}
                                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all ${
                                  opt.isCorrect
                                    ? 'bg-[#00E5FF] text-[#03060A]'
                                    : 'bg-[#03060A] text-[#A1A1AA] hover:text-white border border-[#27272A]'
                                }`}
                                title={opt.isCorrect ? 'Resposta Correta' : 'Marcar como Correta'}
                              >
                                {opt.isCorrect ? <Check className="w-3.5 h-3.5" /> : symbols[optIdx]}
                              </button>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const list = [...editingQuiz.questions];
                                  list[qIdx].options[optIdx].text = e.target.value;
                                  setEditingQuiz({ ...editingQuiz, questions: list });
                                }}
                                className="flex-1 bg-transparent text-white text-xs focus:outline-none font-sans"
                                placeholder={`Alternativa ${optIdx + 1}...`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé do Editor */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272A] font-mono text-xs">
              <button
                onClick={() => setEditingQuiz(null)}
                className="px-4 py-2 rounded-lg bg-[#03060A] hover:bg-[#27272A] text-white border border-[#27272A] uppercase"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSaveQuiz}
                className="px-5 py-2 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-bold uppercase shadow-[0_0_12px_rgba(0,229,255,0.3)]"
              >
                SALVAR ALTERAÇÕES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Banco de Questões Prontas */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="hud-panel max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-wider block">
                  BIBLIOTECA TÁTICA /// QUESTÕES CURADAS
                </span>
                <h3 className="text-base font-bold text-white uppercase">
                  Inserir Pergunta do Banco
                </h3>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-[#A1A1AA] hover:text-white font-mono text-xs"
              >
                [X]
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {questionBank.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#03060A] border border-[#27272A] hover:border-[#00E5FF]/40 p-4 rounded-lg flex items-start justify-between gap-4 transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-mono text-[#00E5FF] uppercase bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">{item.question.text}</h4>
                    <p className="text-[11px] text-[#A1A1AA]">{item.question.explanation}</p>
                  </div>
                  <button
                    onClick={() => handleInsertFromBank(item)}
                    className="px-3 py-1.5 rounded bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono font-bold text-[11px] uppercase tracking-wider shrink-0"
                  >
                    + INSERIR
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBankModal(false)}
              className="w-full py-2 bg-[#18181B] hover:bg-[#27272A] text-white font-mono text-xs font-bold uppercase rounded-lg border border-[#27272A]"
            >
              FECHAR BIBLIOTECA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
