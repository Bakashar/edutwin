import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, Loader2, Star, Globe } from 'lucide-react';
import { Message, AgentType } from '../types';
import { cn } from '../lib/utils';
import { getKazakhExplanation, submitFeedbackToFormbricks } from '../services/aiService';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  currentAgent?: AgentType;
  userId?: string;
  phase?: string;
  diagnosticProgress?: { current: number; total: number };
}

const AGENT_COLORS: Record<AgentType, { bg: string; color: string; border: string }> = {
  Diagnostic:    { bg: '#1a1045', color: '#9b8af5', border: '#4f3aaa' },
  CognitiveModel:{ bg: '#0d1f35', color: '#60a0f0', border: '#1a4070' },
  Tutor:         { bg: '#0d2b1e', color: '#3dd68c', border: '#1a6644' },
  Assessment:    { bg: '#2b1a08', color: '#fbbf24', border: '#5a3810' },
  Prediction:    { bg: '#2b0a18', color: '#f472a0', border: '#7a1f40' },
  Analytics:     { bg: '#1a2030', color: '#60a0f0', border: '#2a3a60' },
};

const AGENT_EMOJI: Record<AgentType, string> = {
  Diagnostic: '🔍', CognitiveModel: '🧠', Tutor: '📚',
  Assessment: '✅', Prediction: '📈', Analytics: '📊',
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages, onSendMessage, isTyping, currentAgent,
  userId = 'student-1', phase, diagnosticProgress,
}) => {
  const [input, setInput] = React.useState('');
  const [lang, setLang] = React.useState<'ru' | 'kz'>('ru');
  const [kazakhText, setKazakhText] = React.useState<string | null>(null);
  const [kazakhLoading, setKazakhLoading] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [feedbackRating, setFeedbackRating] = React.useState(0);
  const [feedbackComment, setFeedbackComment] = React.useState('');
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const showFeedbackButton = messages.filter(m => m.role === 'assistant').length >= 3 && !feedbackSent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) { onSendMessage(input); setInput(''); setKazakhText(null); }
  };

  const handleKazakhToggle = async () => {
    if (lang === 'kz') { setLang('ru'); setKazakhText(null); return; }
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    setLang('kz'); setKazakhLoading(true);
    const kz = await getKazakhExplanation(last.agent || 'Tutor', last.content);
    setKazakhText(kz); setKazakhLoading(false);
  };

  const handleFeedbackSubmit = async () => {
    const topic = messages.findLast(m => m.agent === 'Tutor')?.content?.slice(0, 40) || 'Урок';
    await submitFeedbackToFormbricks(userId, feedbackRating, feedbackComment, topic);
    setFeedbackSent(true); setShowFeedback(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827', borderRadius: 20, border: '1px solid #1E2A45', overflow: 'hidden' }}>

      {/* Шапка */}
      <div style={{ background: '#0F1525', padding: '14px 18px', borderBottom: '1px solid #1E2A45', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🎓
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>EduTwin — Цифровой Двойник</div>
            <div style={{ fontSize: 11, color: '#8892A4', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isTyping ? (
                <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> {currentAgent || 'Обработка...'}</>
              ) : (
                <><span style={{ width: 6, height: 6, background: '#00D4AA', borderRadius: '50%', display: 'inline-block' }} />Qwen3 · AlemLLM · Online</>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {diagnosticProgress && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9b8af5', background: '#1a1045', border: '1px solid #4f3aaa', borderRadius: 20, padding: '5px 12px' }}>
              🔍 {diagnosticProgress.current}/{diagnosticProgress.total}
            </div>
          )}
          <button onClick={handleKazakhToggle} disabled={kazakhLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${lang === 'kz' ? '#4F8EF7' : '#1E2A45'}`, background: lang === 'kz' ? '#4F8EF7' : 'transparent', color: lang === 'kz' ? '#fff' : '#8892A4', transition: 'all .2s', fontFamily: 'Sora, sans-serif' }}>
            {kazakhLoading ? <Loader2 size={10} /> : <Globe size={10} />}
            {lang === 'kz' ? 'ҚАЗ' : 'KZ'}
          </button>
        </div>
      </div>

      {/* Казахская версия */}
      <AnimatePresence>
        {lang === 'kz' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ background: '#0d1828', borderBottom: '1px solid #1a3050', padding: '12px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4F8EF7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>AlemLLM · Қазақша</div>
              {kazakhLoading ? <p style={{ fontSize: 12, color: '#8892A4', fontStyle: 'italic' }}>Аударылуда...</p>
                : <p style={{ fontSize: 13, color: '#c0d0f0', lineHeight: 1.6 }}>{kazakhText}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Сообщения */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '12px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #4F8EF7, #6C63FF)' : '#0F1525',
                border: msg.role === 'user' ? 'none' : '1px solid #1E2A45',
              }}>
                {msg.agent && msg.role === 'assistant' && (() => {
                  const c = AGENT_COLORS[msg.agent];
                  return (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 6, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                      {AGENT_EMOJI[msg.agent]} {msg.agent}
                    </span>
                  );
                })()}
                <p style={{ fontSize: 13, lineHeight: 1.65, color: msg.role === 'user' ? '#fff' : '#D0DCF0', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                <span style={{ fontSize: 10, opacity: .4, display: 'block', textAlign: 'right', marginTop: 6, color: msg.role === 'user' ? '#fff' : '#8892A4' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#0F1525', border: '1px solid #1E2A45', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={13} color="#4F8EF7" />
              <span className="animate-bounce-dot" style={{ width: 6, height: 6, background: '#4F8EF7', borderRadius: '50%', display: 'inline-block' }} />
              <span className="animate-bounce-dot delay-100" style={{ width: 6, height: 6, background: '#6C63FF', borderRadius: '50%', display: 'inline-block' }} />
              <span className="animate-bounce-dot delay-200" style={{ width: 6, height: 6, background: '#00D4AA', borderRadius: '50%', display: 'inline-block' }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Formbricks фидбэк */}
      <AnimatePresence>
        {showFeedbackButton && !showFeedback && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '8px 16px', background: '#1a1808', borderTop: '1px solid #2a2510', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#a07830' }}>Как прошёл урок?</span>
            <button onClick={() => setShowFeedback(true)}
              style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Sora, sans-serif' }}>
              <Star size={11} /> Оценить
            </button>
          </motion.div>
        )}
        {showFeedback && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', padding: '14px 16px', background: '#1a1808', borderTop: '1px solid #2a2510' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>⭐ Оцени урок (Formbricks)</p>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setFeedbackRating(n)} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: feedbackRating >= n ? '#fbbf24' : '#2a2510' }}>★</button>
              ))}
            </div>
            <input value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} placeholder="Комментарий (необязательно)"
              style={{ width: '100%', fontSize: 12, background: '#0d1424', border: '1px solid #1E2A45', borderRadius: 8, padding: '8px 12px', color: '#F0F4FF', fontFamily: 'Sora, sans-serif', outline: 'none', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleFeedbackSubmit} disabled={feedbackRating === 0}
                style={{ flex: 1, padding: '8px', background: '#fbbf24', border: 'none', borderRadius: 8, color: '#0a0e1a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif', opacity: feedbackRating === 0 ? .4 : 1 }}>
                Отправить
              </button>
              <button onClick={() => setShowFeedback(false)} style={{ padding: '8px 12px', fontSize: 12, color: '#8892A4', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>Отмена</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {feedbackSent && (
        <div style={{ padding: '8px 16px', background: '#0d2b1e', borderTop: '1px solid #1a6644', fontSize: 12, color: '#3dd68c', fontWeight: 600, textAlign: 'center' }}>
          ✅ Спасибо! Данные отправлены в Formbricks.
        </div>
      )}

      {/* Поле ввода */}
      <form onSubmit={handleSubmit} style={{ padding: '12px 14px', background: '#0F1525', borderTop: '1px solid #1E2A45', display: 'flex', gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Введите ответ или вопрос..." disabled={isTyping}
          style={{ flex: 1, background: '#0d1424', border: '1px solid #1E2A45', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#F0F4FF', fontFamily: 'Sora, sans-serif', outline: 'none', transition: '.2s' }} />
        <button type="submit" disabled={!input.trim() || isTyping}
          style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || isTyping) ? .4 : 1, transition: '.2s' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
