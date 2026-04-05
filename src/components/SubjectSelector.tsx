import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Info } from 'lucide-react';
import { Subject } from '../types';
import { cn } from '../lib/utils';

interface Props {
  subjects: Subject[];
  selectedSubjects: string[];
  onConfirm: (subjects: string[]) => void;
  onSkip: () => void;
}

// SVG иконки из дизайна
const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  math: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <text x="14" y="38" fontSize="34" fontFamily="serif" fill="#7B7FFF" fontWeight="400" fontStyle="italic">π</text>
      <line x1="8" y1="44" x2="44" y2="44" stroke="#7B7FFF" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="10" x2="44" y2="10" stroke="#7B7FFF" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  math_lit: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="16" stroke="#818CF8" strokeWidth="2" fill="none"/>
      <text x="18" y="31" fontSize="16" fontFamily="serif" fill="#818CF8" fontWeight="700">∑</text>
    </svg>
  ),
  reading: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect x="10" y="10" width="32" height="38" rx="4" stroke="#60A0F0" strokeWidth="2" fill="none"/>
      <line x1="16" y1="20" x2="36" y2="20" stroke="#60A0F0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="27" x2="36" y2="27" stroke="#60A0F0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="34" x2="28" y2="34" stroke="#60A0F0" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  history_kz: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path d="M26 8 L30 20 L44 20 L33 28 L37 42 L26 34 L15 42 L19 28 L8 20 L22 20 Z" stroke="#4FC3F7" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  physics: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="8" stroke="#FFD600" strokeWidth="2" fill="none"/>
      <circle cx="26" cy="26" r="3" fill="#FFD600"/>
      <ellipse cx="26" cy="26" rx="20" ry="8" stroke="#FFD600" strokeWidth="1.5" fill="none" transform="rotate(-30 26 26)"/>
      <ellipse cx="26" cy="26" rx="20" ry="8" stroke="#FFD600" strokeWidth="1.5" fill="none" transform="rotate(30 26 26)"/>
      <ellipse cx="26" cy="26" rx="20" ry="8" stroke="#FFD600" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  chemistry: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path d="M18 6 L18 20 L10 36 Q10 46 26 46 Q42 46 42 36 L34 20 L34 6" stroke="#FF7043" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="14" y1="6" x2="38" y2="6" stroke="#FF7043" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M15 30 Q20 26 26 28 Q32 30 37 26" stroke="#FF7043" strokeWidth="1.5" fill="none"/>
      <circle cx="26" cy="38" r="4" fill="#FF7043" fillOpacity="0.5"/>
      <circle cx="26" cy="38" r="2" fill="#FF7043"/>
    </svg>
  ),
  biology: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path d="M20 8 L20 22 L10 38 Q10 44 16 44 L36 44 Q42 44 42 38 L32 22 L32 8 Z" stroke="#4CAF50" strokeWidth="2" fill="none"/>
      <line x1="16" y1="8" x2="36" y2="8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 28 Q26 22 36 28" stroke="#4CAF50" strokeWidth="1.5" fill="none"/>
      <circle cx="22" cy="36" r="2.5" fill="#4CAF50" fillOpacity="0.8"/>
      <circle cx="30" cy="38" r="2" fill="#4CAF50" fillOpacity="0.6"/>
    </svg>
  ),
  geography: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="22" stroke="#1DE9B6" strokeWidth="2" fill="none"/>
      <ellipse cx="26" cy="26" rx="22" ry="10" stroke="#1DE9B6" strokeWidth="1.5" fill="none"/>
      <line x1="4" y1="26" x2="48" y2="26" stroke="#1DE9B6" strokeWidth="1.5"/>
      <line x1="26" y1="4" x2="26" y2="48" stroke="#1DE9B6" strokeWidth="1.5"/>
      <circle cx="26" cy="26" r="3" fill="#1DE9B6"/>
    </svg>
  ),
  informatics: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect x="8" y="14" width="36" height="24" rx="4" stroke="#29B6F6" strokeWidth="2" fill="none"/>
      <line x1="20" y1="38" x2="20" y2="44" stroke="#29B6F6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="38" x2="32" y2="44" stroke="#29B6F6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="44" x2="38" y2="44" stroke="#29B6F6" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 26 L22 22 L26 28 L30 24 L34 26" stroke="#29B6F6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  english: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <text x="8" y="34" fontSize="28" fontFamily="serif" fill="#FF6B9D" fontWeight="700">A</text>
      <text x="26" y="26" fontSize="20" fontFamily="serif" fill="#FF6B9D" fontWeight="700" opacity="0.7">A</text>
      <path d="M36 14 L44 14 M40 10 L40 18" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round"/>
      <path d="M34 32 Q38 28 42 32 Q38 36 34 32Z" fill="#FF6B9D" fillOpacity="0.6"/>
    </svg>
  ),
  russian: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="20" r="10" stroke="#81C784" strokeWidth="2" fill="none"/>
      <path d="M14 44 C14 34 38 34 38 44" stroke="#81C784" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M20 16 L24 20 L32 14" stroke="#81C784" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  world_history: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect x="10" y="10" width="32" height="38" rx="4" stroke="#9575CD" strokeWidth="2" fill="none"/>
      <line x1="16" y1="20" x2="36" y2="20" stroke="#9575CD" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="27" x2="36" y2="27" stroke="#9575CD" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="34" x2="28" y2="34" stroke="#9575CD" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

const QUESTION_COUNTS: Record<string, number> = {
  math: 2180, math_lit: 1950, reading: 1820, history_kz: 2200,
  physics: 2100, chemistry: 2053, biology: 2054, geography: 2139,
  informatics: 2048, english: 2036, russian: 2180, world_history: 2566,
};

export const SubjectSelector: React.FC<Props> = ({ subjects, selectedSubjects, onConfirm, onSkip }) => {
  const [selected, setSelected] = React.useState<string[]>(selectedSubjects);
  const required = subjects.filter(s => s.required);
  const optional = subjects.filter(s => !s.required);

  const toggle = (id: string, isRequired: boolean) => {
    if (isRequired) return;
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div style={{ height: '100%', background: '#111827', borderRadius: 20, border: '1px solid #1E2A45', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Шапка */}
      <div style={{ background: 'linear-gradient(135deg, #1a2a4f, #1a1f40)', padding: '24px 28px', borderBottom: '1px solid #1E2A45' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F0F4FF', marginBottom: 6, letterSpacing: -0.5 }}>Выбери предметы ЕНТ</h2>
        <p style={{ fontSize: 13, color: '#8892A4' }}>4 обязательных + профильные предметы по выбору</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <div style={{ background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#4F8EF7', fontWeight: 700 }}>
            {selected.length} предметов
          </div>
          <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#00D4AA', fontWeight: 700 }}>
            ~{Math.ceil(selected.length * 2 / 60)} мин диагностика
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* Обязательные */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Info size={13} color="#4F8EF7" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8892A4', textTransform: 'uppercase', letterSpacing: 1 }}>Обязательные</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {required.map(s => (
              <motion.div key={s.id} whileHover={{ scale: 1.02 }}
                style={{ background: 'rgba(79,142,247,0.1)', border: '2px solid rgba(79,142,247,0.4)', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {SUBJECT_ICONS[s.id]}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', textAlign: 'center' }}>{s.label}</span>
                <span style={{ fontSize: 11, color: '#4F8EF7', fontWeight: 600 }}>Обязательный ✓</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Профильные */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8892A4', textTransform: 'uppercase', letterSpacing: 1 }}>Профильные</span>
            <span style={{ fontSize: 10, background: '#1E2A45', color: '#8892A4', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>выбери нужные</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {optional.map(s => {
              const isSelected = selected.includes(s.id);
              return (
                <motion.button key={s.id} onClick={() => toggle(s.id, false)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    background: isSelected ? 'rgba(79,142,247,0.12)' : '#0d1424',
                    border: `2px solid ${isSelected ? 'rgba(79,142,247,0.5)' : '#1E2A45'}`,
                    borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all .2s'
                  }}
                >
                  <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {SUBJECT_ICONS[s.id]}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', textAlign: 'center' }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: isSelected ? '#4F8EF7' : '#5A6A88', fontWeight: 600 }}>
                    {QUESTION_COUNTS[s.id]?.toLocaleString() || '2000+'} вопросов {isSelected ? '✓' : ''}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #1E2A45', display: 'flex', gap: 12 }}>
        <button onClick={onSkip}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #1E2A45', background: 'transparent', color: '#8892A4', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
          Пропустить
        </button>
        <motion.button onClick={() => onConfirm(selected)}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4F8EF7, #6C63FF)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Начать диагностику ({selected.length * 2} вопр.) <ChevronRight size={15} />
        </motion.button>
      </div>
    </div>
  );
};
