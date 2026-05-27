import { useState, FormEvent } from 'react';
import { LaravelModel, ChatMessage } from '../types';
import { LARAVEL_LESSONS, LARAVEL_QUIZ } from '../data/laravelLessons';
import { BookOpen, HelpCircle, GraduationCap, Send, Sparkles, MessageCircleCode, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

interface TutorProps {
  model: LaravelModel;
}

export default function LaravelTutor({ model }: TutorProps) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz' | 'aichat'>('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('mvc');

  // Quiz states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      content: "Hello! I am your AI Laravel Coach. 🎓 I can explain any Laravel architectural concept, write custom PHP code patterns for you, or help you debug PHP errors. \n\nWhat would you like to master today?\n\n*   How do Eloquent relationships handle JOINs?\n*   Why is validation handled inside Form Requests instead of Controllers?\n*   How do database Migrations track version controls?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quiz controls
  const handleAnswerSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswerIdx(idx);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswerIdx === null || isAnswered) return;
    
    setIsAnswered(true);
    const qu = LARAVEL_QUIZ[currentQuestionIdx];
    if (selectedAnswerIdx === qu.correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    if (currentQuestionIdx + 1 < LARAVEL_QUIZ.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswerIdx(null);
      setIsAnswered(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setIsAnswered(false);
    setQuizScore(0);
    setQuizComplete(false);
  };

  // Chat submit to backend Express server proxy
  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const txt = userInput.trim();
    if (!txt || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: txt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/laravel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          currentModel: model
        })
      });
      
      const resData = await response.json();
      if (resData.reply) {
        setChatMessages(prev => [...prev, {
          id: 'model_' + Math.random().toString(36).substring(2, 9),
          role: 'model',
          content: resData.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error("Invalid server reply format");
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: 'err_' + Math.random().toString(36).substring(2, 9),
        role: 'model',
        content: "I encountered a transient loading error. Please check your network connection and retry. *Note: You can configure an active GEMINI_API_KEY inside the Secrets panel to fully enable dynamic AI queries.*",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedLesson = LARAVEL_LESSONS.find(l => l.id === selectedLessonId) || LARAVEL_LESSONS[0];

  return (
    <div className="bg-white border-2 border-zinc-900 overflow-hidden flex flex-col h-[580px] shadow-md" id="laravel-tutor-hub">
      {/* Tab Buttons selection bar */}
      <div className="px-4 py-3 bg-zinc-900 border-b-2 border-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-white font-sans">
        <div className="flex items-center space-x-2">
          <GraduationCap className="text-[#FF2D20] w-5 h-5 animate-bounce shrink-0" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF2D20] font-sans">Laravel Theoretical & Practice Academy</h3>
        </div>
        
        <div className="flex space-x-1.5 flex-wrap gap-y-1">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${
              activeTab === 'lessons' ? 'bg-[#FF2D20] text-white border border-[#FF2D20]' : 'text-zinc-350 bg-zinc-805 hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3 h-3 inline mr-1" />
            <span>Curriculum</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${
              activeTab === 'quiz' ? 'bg-[#FF2D20] text-white border border-[#FF2D20]' : 'text-zinc-350 bg-zinc-805 hover:bg-zinc-800'
            }`}
          >
            <HelpCircle className="w-3 h-3 inline mr-1" />
            <span>Quiz Test</span>
          </button>
          <button
            onClick={() => setActiveTab('aichat')}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${
              activeTab === 'aichat' ? 'bg-[#FF2D20] text-white border border-[#FF2D20]' : 'text-zinc-350 bg-zinc-805 hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            <span>AI Coach Chat</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Panel */}
      <div className="flex-grow overflow-y-auto p-5">
        
        {/* LESSON CURRICULUM TAB */}
        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
            {/* Chapters sidebar selector - 4 Cols */}
            <div className="md:col-span-4 space-y-2.5">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wide mb-2 font-black">// LESSONS DIRECTORY:</span>
              <div className="space-y-1.5">
                {LARAVEL_LESSONS.map((ls) => (
                  <button
                    key={ls.id}
                    onClick={() => setSelectedLessonId(ls.id)}
                    className={`w-full text-left p-3 border-2 transition-all flex items-start space-x-2.5 cursor-pointer ${
                      selectedLessonId === ls.id
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-white border-zinc-200 hover:border-zinc-900 text-zinc-650'
                    }`}
                  >
                    <span className="bg-[#FF2D20] text-white w-5 h-5 rounded-none flex items-center justify-center font-black text-[10px] shrink-0 font-mono">
                      {ls.number}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate leading-tight uppercase tracking-wide">{ls.title}</div>
                      <div className={`text-[10px] truncate mt-0.5 font-bold ${selectedLessonId === ls.id ? 'text-zinc-350' : 'text-zinc-450'}`}>
                        {ls.shortDesc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Lesson display page - 8 Cols */}
            <div className="md:col-span-8 bg-slate-50 rounded-xl p-5 border border-slate-100 overflow-y-auto space-y-5 flex flex-col justify-between">
              <div>
                <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Lesson Chapter {selectedLesson.number}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2 tracking-tight">{selectedLesson.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{selectedLesson.shortDesc}</p>

                {/* Lesson Detailed text panel */}
                <div className="mt-5 text-xs text-slate-700 leading-relaxed space-y-4 font-sans bg-white border border-slate-200/60 p-4 rounded-xl">
                  {selectedLesson.detailedContent.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para.replace(/###\s*(.*)/g, '$1')}</p>
                  ))}
                </div>
              </div>

              {/* Analogy mapping comparisons list */}
              <div className="mt-5 border-t border-slate-200 pt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 font-mono">Analogies mapping comparison (PHP vs JavaScript/Node):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedLesson.concepts.map((conc, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs text-xs">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>{conc.term}</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[9px] text-slate-400">Concept</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1 pr-1.5">{conc.definition}</div>
                      <div className="text-[10px] text-blue-600 bg-blue-50/50 p-1.5 rounded mt-2.5 font-mono">
                        Node counterpart: <code className="font-bold">{conc.expressAnalogy}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MULTIPLE CHOICE QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div className="max-w-xl mx-auto h-full flex flex-col justify-center">
            {quizComplete ? (
              <div className="p-8 text-center bg-red-50/40 rounded-xl border border-red-100 max-w-md mx-auto space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Quiz Completed!</h4>
                <p className="text-xs text-slate-600">
                  Great job exploring Laravel concepts. You scored <strong className="text-red-500 text-sm font-extrabold">{quizScore} / {LARAVEL_QUIZ.length}</strong> parameters correct!
                </p>
                <div className="border-t border-red-100/60 pt-4 flex justify-center">
                  <button
                    onClick={handleResetQuiz}
                    className="flex items-center space-x-1 text-xs text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 font-semibold rounded-lg transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Quiz Again</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 space-y-4 relative">
                {/* Score bar */}
                <div className="flex justify-between items-center text-xs font-mono text-slate-550 border-b border-slate-200 pb-2">
                  <span>Question {currentQuestionIdx + 1} of {LARAVEL_QUIZ.length}</span>
                  <span>Accuracy Score: {quizScore} correct</span>
                </div>

                {/* Question */}
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {LARAVEL_QUIZ[currentQuestionIdx].question}
                </h4>

                {/* Answers block */}
                <div className="space-y-2">
                  {LARAVEL_QUIZ[currentQuestionIdx].options.map((opt, i) => {
                    const isSelected = selectedAnswerIdx === i;
                    const isCorrect = LARAVEL_QUIZ[currentQuestionIdx].correctAnswer === i;
                    
                    let bgStyle = 'bg-white border-slate-200 hover:border-slate-300';
                    if (isSelected) {
                      bgStyle = 'bg-slate-900 text-white border-slate-900';
                    }
                    if (isAnswered) {
                      if (isCorrect) bgStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800';
                      else if (isSelected) bgStyle = 'bg-rose-50 border-rose-400 text-rose-800';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswerSelect(i)}
                        disabled={isAnswered}
                        className={`w-full p-3.5 rounded-lg border text-left text-xs transition flex items-center justify-between cursor-pointer ${bgStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isCorrect && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">Correct</span>}
                        {isAnswered && isSelected && !isCorrect && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold uppercase">Incorrect</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Action panel */}
                <div className="border-t border-slate-200 pt-4 flex flex-col items-center">
                  {!isAnswered ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={selectedAnswerIdx === null}
                      className={`w-3/4 py-2 rounded-lg text-xs font-bold transition flex justify-center items-center ${
                        selectedAnswerIdx === null
                          ? 'bg-slate-250 text-slate-400 cursor-not-allowed border'
                          : 'bg-red-650 text-white hover:bg-black cursor-pointer'
                      }`}
                    >
                      Verify Choice
                    </button>
                  ) : (
                    <div className="w-full text-center space-y-4">
                      {/* Detailed explanation markup */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] text-slate-550 text-left flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-theme-500 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>Explanation:</strong> {LARAVEL_QUIZ[currentQuestionIdx].explanation}
                        </div>
                      </div>

                      <button
                        onClick={handleNextQuiz}
                        className="w-1/2 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                      >
                        {currentQuestionIdx + 1 === LARAVEL_QUIZ.length ? 'View Score' : 'Next Question &rarr;'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI PRIVATE TUTOR CHAT TAB */}
        {activeTab === 'aichat' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Conversations list scroll wrapper */}
            <div className="flex-grow overflow-y-auto mb-4 space-y-4 max-h-[360px] pr-1.5 custom-scrollbar font-sans">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-4 rounded-xl text-xs max-w-sm sm:max-w-md ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-700 rounded-tl-none leading-relaxed'
                  }`}>
                    {/* Render Chat Markdown */}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <span className="block text-[8px] text-right mt-2 text-slate-400">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              
              {/* Spinner loader indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl rounded-tl-none flex items-center space-x-2 text-xs text-slate-500">
                    <div className="flex space-x-1 shrink-0">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                    </div>
                    <span>Tutor is formulating detailed response logs...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input submission box Form */}
            <form onSubmit={handleChatSubmit} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center space-x-2 shrink-0">
              <MessageCircleCode className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask e.g. 'How is Route model binding structured?'"
                className="flex-grow bg-white border border-slate-200 p-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400"
              />
              <button
                type="submit"
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shrink-0 cursor-pointer"
                disabled={isLoading || !userInput.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
