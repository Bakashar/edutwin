import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, LayoutDashboard, MessageSquare, Settings, ChevronRight, GraduationCap } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { StudentDashboard } from './components/StudentDashboard';
import { SubjectSelector } from './components/SubjectSelector';
import { Message, StudentProfile, AgentType, Question } from './types';
import { ALL_SUBJECTS, getDiagnosticQuestions, REQUIRED_SUBJECTS } from './constants';
import { getAgentResponse, saveProfileToMemory, loadProfileFromRedis, logProgressToNocoDB, saveProgressReport } from './services/aiService';
import { cn } from './lib/utils';

const USER_ID = 'student-1';
const SUBJECT_LABEL: Record<string, string> = Object.fromEntries(ALL_SUBJECTS.map(s => [s.id, s.label]));

const AGENT_COLORS_NAV: Record<string, { bg: string; color: string; border: string }> = {
  Diagnostic:    { bg: '#1a1045', color: '#9b8af5', border: '#4f3aaa' },
  CognitiveModel:{ bg: '#0d1f35', color: '#60a0f0', border: '#1a4070' },
  Tutor:         { bg: '#0d2b1e', color: '#3dd68c', border: '#1a6644' },
  Assessment:    { bg: '#2b1a08', color: '#fbbf24', border: '#5a3810' },
  Prediction:    { bg: '#2b0a18', color: '#f472a0', border: '#7a1f40' },
  Analytics:     { bg: '#1a2030', color: '#60a0f0', border: '#2a3a60' },
};

export default function App() {
  const [phase, setPhase] = React.useState<'welcome' | 'subject-select' | 'diagnostic' | 'learning' | 'analytics'>('welcome');
  const [messages, setMessages] = React.useState<Message[]>([{
    id: '1', role: 'assistant',
    content: 'Привет! Я твой цифровой двойник EduTwin 🎓\nРаботаю на Qwen3 + AlemLLM.\nВыбери предметы ЕНТ — начнём диагностику и создадим твой персональный профиль!',
    agent: 'Diagnostic', timestamp: Date.now(),
  }]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [currentAgent, setCurrentAgent] = React.useState<AgentType>('Diagnostic');
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(REQUIRED_SUBJECTS);
  const [profile, setProfile] = React.useState<StudentProfile>({
    name: 'Ученик', level: 'Beginner', selectedSubjects: REQUIRED_SUBJECTS,
    weakTopics: [], strongTopics: [], completedTasks: 0, accuracy: 0,
    predictedENT: 70, subjectStats: {}, learningHistory: [],
  });
  const [diagnosticQuestions, setDiagnosticQuestions] = React.useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [quizAnswers, setQuizAnswers] = React.useState<{ questionId: string; isCorrect: boolean; topic: string; subject: string }[]>([]);

  React.useEffect(() => {
    loadProfileFromRedis(USER_ID).then(saved => {
      if (saved) { setProfile(saved); setSelectedSubjects(saved.selectedSubjects || REQUIRED_SUBJECTS); }
    });
  }, []);

  const addMessage = (content: string, role: 'user' | 'assistant', agent?: AgentType) => {
    setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), role, content, agent, timestamp: Date.now() }]);
  };

  const startDiagnostic = (subjects: string[]) => {
    const questions = getDiagnosticQuestions(subjects);
    setDiagnosticQuestions(questions); setCurrentQuestionIndex(0); setQuizAnswers([]); setPhase('diagnostic');
    const subjectNames = subjects.map(id => ALL_SUBJECTS.find(s => s.id === id)?.label || id).join(', ');
    const q = questions[0];
    addMessage(`🔍 Начинаем диагностику!\nПредметы: ${subjectNames}\nВсего вопросов: ${questions.length}\n\n📚 **${SUBJECT_LABEL[q.subject] || q.subject}** — ${q.topic}\n\n${q.text}\n\nВарианты: ${q.options.join(' | ')}`, 'assistant', 'Diagnostic');
  };

  const handleSubjectConfirm = (subjects: string[]) => {
    setSelectedSubjects(subjects);
    setProfile(prev => ({ ...prev, selectedSubjects: subjects }));
    startDiagnostic(subjects);
  };

  const handleSendMessage = async (text: string) => {
    addMessage(text, 'user'); setIsTyping(true);
    if (phase === 'diagnostic') {
      const q = diagnosticQuestions[currentQuestionIndex];
      const isCorrect = text.trim().toLowerCase() === q.correctAnswer.toLowerCase() || text.trim() === q.correctAnswer;
      const newAnswers = [...quizAnswers, { questionId: q.id, isCorrect, topic: q.topic, subject: q.subject }];
      setQuizAnswers(newAnswers);
      logProgressToNocoDB(USER_ID, q.topic, isCorrect, 'Diagnostic').catch(() => {});
      if (currentQuestionIndex < diagnosticQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        const nextQ = diagnosticQuestions[currentQuestionIndex + 1];
        setTimeout(() => {
          setIsTyping(false);
          addMessage(`${isCorrect ? '✅ Верно!' : `❌ Нет. Правильный ответ: **${q.correctAnswer}**\n💡 ${q.explanation}`}\n\nВопрос ${currentQuestionIndex + 2}/${diagnosticQuestions.length}:\n📚 **${SUBJECT_LABEL[nextQ.subject] || nextQ.subject}** — ${nextQ.topic}\n\n${nextQ.text}\n\nВарианты: ${nextQ.options.join(' | ')}`, 'assistant', 'Diagnostic');
        }, 800);
      } else {
        setCurrentAgent('CognitiveModel');
        const weak = [...new Set(newAnswers.filter(a => !a.isCorrect).map(a => a.topic))];
        const strong = [...new Set(newAnswers.filter(a => a.isCorrect).map(a => a.topic))];
        const accuracy = Math.round((newAnswers.filter(a => a.isCorrect).length / newAnswers.length) * 100);
        const subjectStats: Record<string, { correct: number; total: number; topics: { weak: string[]; strong: string[] } }> = {};
        for (const ans of newAnswers) {
          if (!subjectStats[ans.subject]) subjectStats[ans.subject] = { correct: 0, total: 0, topics: { weak: [], strong: [] } };
          subjectStats[ans.subject].total++;
          if (ans.isCorrect) { subjectStats[ans.subject].correct++; subjectStats[ans.subject].topics.strong.push(ans.topic); }
          else subjectStats[ans.subject].topics.weak.push(ans.topic);
        }
        const newProfile: StudentProfile = {
          ...profile, weakTopics: weak, strongTopics: strong, accuracy,
          completedTasks: profile.completedTasks + newAnswers.length,
          predictedENT: Math.min(140, Math.round(70 + accuracy * 0.7)),
          level: accuracy >= 80 ? 'Advanced' : accuracy >= 50 ? 'Intermediate' : 'Beginner',
          selectedSubjects,
          subjectStats: Object.fromEntries(Object.entries(subjectStats).map(([sid, st]) => [sid, { accuracy: Math.round((st.correct / st.total) * 100), completed: st.total, weakTopics: st.topics.weak, strongTopics: st.topics.strong }])),
          learningHistory: [...profile.learningHistory, ...newAnswers.map(a => ({ topic: a.topic, subject: a.subject, score: a.isCorrect ? 100 : 0, timestamp: Date.now() }))],
        };
        setProfile(newProfile); saveProfileToMemory(USER_ID, newProfile); saveProgressReport(USER_ID, newProfile).catch(() => {});
        const analysis = await getAgentResponse('CognitiveModel', `Диагностика завершена. Предметы: ${selectedSubjects.join(', ')}. Результаты: ${JSON.stringify(newAnswers)}. Краткий анализ.`, newProfile);
        setIsTyping(false); addMessage(analysis, 'assistant', 'CognitiveModel');
        setTimeout(() => {
          addMessage(`🎯 Цифровой двойник создан!\n${weak.length > 0 ? `📌 Слабые темы: **${weak.join(', ')}**. С чего начнём?` : '💪 Отличный результат! Все темы усвоены хорошо.'}`, 'assistant', 'Tutor');
          setPhase('learning'); setCurrentAgent('Tutor');
        }, 600);
      }
    } else {
      let agentToUse = currentAgent;
      const lower = text.toLowerCase();
      if (lower.includes('прогноз') || lower.includes('ент') || lower.includes('балл')) agentToUse = 'Prediction';
      else if (lower.includes('отчёт') || lower.includes('статистик') || lower.includes('прогресс')) agentToUse = 'Analytics';
      else if (lower.includes('провер') || lower.includes('правильно') || lower.includes('ответ')) agentToUse = 'Assessment';
      setCurrentAgent(agentToUse);
      const response = await getAgentResponse(agentToUse, text, profile);
      setIsTyping(false); addMessage(response, 'assistant', agentToUse);
      const updatedProfile = { ...profile, completedTasks: profile.completedTasks + 1 };
      setProfile(updatedProfile); saveProfileToMemory(USER_ID, updatedProfile);
      logProgressToNocoDB(USER_ID, text.slice(0, 30), true, agentToUse).catch(() => {});
    }
  };

  const agentC = currentAgent ? AGENT_COLORS_NAV[currentAgent] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', fontFamily: 'Sora, sans-serif', color: '#F0F4FF', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 62, borderBottom: '1px solid #1E2A45', background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>E</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>EDUTWIN<span style={{ color: '#4F8EF7' }}>.KZ</span></span>
          <span style={{ display: 'none', fontSize: 10, color: '#8892A4', background: '#0F1525', border: '1px solid #1E2A45', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}
            className="sm:inline-block ml-2">Qwen3 · AlemLLM · Redis · NocoDB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { key: 'subject-select', icon: <Settings size={14} />, label: 'Предметы' },
            { key: 'learning', icon: <BookOpen size={14} />, label: 'Обучение' },
            { key: 'analytics', icon: <LayoutDashboard size={14} />, label: 'Дашборд' },
          ].map(item => (
            <button key={item.key} onClick={() => setPhase(item.key as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all .2s', background: phase === item.key ? '#1E2A45' : 'transparent', color: phase === item.key ? '#4F8EF7' : '#8892A4' }}>
              {item.icon} {item.label}
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: '#1E2A45', margin: '0 4px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F4FF' }}>{profile.name}</p>
              <p style={{ fontSize: 10, color: '#8892A4', textTransform: 'uppercase', letterSpacing: 1 }}>{profile.level}</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={17} color="#fff" />
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>

        {/* Левая колонка */}
        <div style={{ height: 'calc(100vh - 110px)' }}>
          <AnimatePresence mode="wait">
            {phase === 'welcome' && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: 480, background: '#111827', border: '1px solid #1E2A45', borderRadius: 24, padding: 48 }}>
                  <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>🎓</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a2540', border: '1px solid #2a3a5c', borderRadius: 20, padding: '5px 14px', fontSize: 11, color: '#4F8EF7', fontWeight: 600, marginBottom: 20 }}>
                    <span style={{ width: 5, height: 5, background: '#00D4AA', borderRadius: '50%' }} /> Платформа #1 для подготовки к ЕНТ
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F0F4FF', marginBottom: 14, letterSpacing: -1 }}>EduTwin.kz</h2>
                  <p style={{ fontSize: 14, color: '#8892A4', marginBottom: 12, lineHeight: 1.7 }}>Персональный AI-тьютор для подготовки к ЕНТ. Многоагентная система — диагностика по всем предметам.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
                    {['Qwen3', 'AlemLLM', 'Redis', 'NocoDB', 'MinIO'].map(t => (
                      <span key={t} style={{ fontSize: 11, background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)', color: '#4F8EF7', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 32 }}>
                    {[['12', 'предметов ЕНТ'], ['75+', 'вопросов'], ['6', 'AI-агентов']].map(([n, l]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#F0F4FF' }}>{n}</div>
                        <div style={{ fontSize: 11, color: '#8892A4', marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <motion.button onClick={() => setPhase('subject-select')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Выбрать предметы и начать <ChevronRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {phase === 'subject-select' && (
              <motion.div key="subject-select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                <SubjectSelector subjects={ALL_SUBJECTS} selectedSubjects={selectedSubjects} onConfirm={handleSubjectConfirm} onSkip={() => setPhase('learning')} />
              </motion.div>
            )}

            {(phase === 'diagnostic' || phase === 'learning') && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%' }}>
                <ChatWindow messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} currentAgent={currentAgent} userId={USER_ID} phase={phase}
                  diagnosticProgress={phase === 'diagnostic' ? { current: currentQuestionIndex + 1, total: diagnosticQuestions.length } : undefined} />
              </motion.div>
            )}

            {phase === 'analytics' && (
              <motion.div key="analytics-mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%', overflowY: 'auto' }} className="lg:hidden">
                <div style={{ background: '#111827', border: '1px solid #1E2A45', borderRadius: 20, padding: 20, height: '100%' }}>
                  <StudentDashboard profile={profile} userId={USER_ID} subjects={ALL_SUBJECTS} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Правая колонка — дашборд */}
        <div style={{ height: 'calc(100vh - 110px)', background: '#0F1525', border: '1px solid #1E2A45', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LayoutDashboard size={15} color="#4F8EF7" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#F0F4FF', textTransform: 'uppercase', letterSpacing: 1 }}>Цифровой двойник</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#0d2b1e', border: '1px solid #1a5530', borderRadius: 20, fontSize: 9, fontWeight: 700, color: '#00D4AA' }}>
              <span style={{ width: 5, height: 5, background: '#00D4AA', borderRadius: '50%' }} />LIVE · Redis
            </div>
          </div>

          {/* Агент-бейджи */}
          {agentC && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {Object.entries(AGENT_COLORS_NAV).map(([name, c]) => (
                <span key={name} style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                  {name === currentAgent ? '▶ ' : ''}{name}
                </span>
              ))}
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <StudentDashboard profile={profile} userId={USER_ID} subjects={ALL_SUBJECTS} />
          </div>
        </div>
      </main>

      {/* Мобильная кнопка */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }} className="lg:hidden">
        <button onClick={() => setPhase(phase === 'analytics' ? 'learning' : 'analytics')}
          style={{ width: 54, height: 54, background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 32px rgba(79,142,247,0.4)' }}>
          {phase === 'analytics' ? <MessageSquare size={20} color="#fff" /> : <LayoutDashboard size={20} color="#fff" />}
        </button>
      </div>
    </div>
  );
}
