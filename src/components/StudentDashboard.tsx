import React from 'react';
import { motion } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { StudentProfile, Subject } from '../types';
import { Brain, Target, TrendingUp, Award, AlertCircle, Database, FileDown, BarChart2, CheckCircle } from 'lucide-react';
import { saveProgressReport, getTopicStatsFromNocoDB } from '../services/aiService';

interface Props { profile: StudentProfile; userId?: string; subjects?: Subject[]; }

const SUBJECT_COLORS: Record<string, string> = {
  math: '#7B7FFF', math_lit: '#818CF8', reading: '#60A0F0', history_kz: '#4FC3F7',
  physics: '#FFD600', chemistry: '#FF7043', biology: '#4CAF50', geography: '#1DE9B6',
  informatics: '#29B6F6', english: '#FF6B9D', russian: '#81C784', world_history: '#9575CD',
};

export const StudentDashboard: React.FC<Props> = ({ profile, userId = 'student-1', subjects = [] }) => {
  const [nocoStats, setNocoStats] = React.useState<Record<string, { correct: number; total: number }> | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = React.useState<'overview' | 'subjects'>('overview');

  const chartData = profile.learningHistory.slice(-12).map(h => ({ name: h.topic.slice(0, 6), score: h.score }));
  const allTopics = [...new Set([...profile.weakTopics, ...profile.strongTopics])];
  const radarTopics = allTopics.slice(0, 6).length > 0 ? allTopics.slice(0, 6) : ['Матем.', 'Физика', 'Химия', 'Биол.', 'Геогр.', 'История'];
  const radarData = radarTopics.map(t => ({
    subject: t.slice(0, 7),
    A: profile.strongTopics.includes(t) ? 85 : profile.weakTopics.includes(t) ? 25 : 50,
  }));
  const selectedSubjectObjects = subjects.filter(s => profile.selectedSubjects?.includes(s.id));

  const handleLoadStats = async () => { setLoadingStats(true); setNocoStats(await getTopicStatsFromNocoDB(userId)); setLoadingStats(false); };
  const handleSaveReport = async () => {
    setSaveStatus('saving');
    setSaveStatus((await saveProgressReport(userId, profile)) ? 'saved' : 'error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const card: React.CSSProperties = { background: '#111827', border: '1px solid #1E2A45', borderRadius: 16, padding: '16px' };
  const cardTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#8892A4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', height: '100%', paddingBottom: 8 }}>

      {/* Главные метрики */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <motion.div whileHover={{ scale: 1.02 }}
          style={{ background: 'linear-gradient(135deg, #1a3060, #0d1f50)', border: '1px solid #1a3f7a', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Target size={14} color="#4F8EF7" />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#8892A4', textTransform: 'uppercase', letterSpacing: .5 }}>Прогноз ЕНТ</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#4F8EF7', lineHeight: 1 }}>{Math.round(profile.predictedENT)}</div>
          <div style={{ fontSize: 10, color: '#8892A4', marginTop: 4, fontWeight: 600 }}>из 140 · Prediction</div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}
          style={{ background: 'linear-gradient(135deg, #0a2820, #0d3020)', border: '1px solid #1a5030', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <TrendingUp size={14} color="#00D4AA" />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#8892A4', textTransform: 'uppercase', letterSpacing: .5 }}>Точность</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#00D4AA', lineHeight: 1 }}>{profile.accuracy}%</div>
          <div style={{ fontSize: 10, color: '#8892A4', marginTop: 4, fontWeight: 600 }}>{profile.completedTasks} заданий</div>
        </motion.div>
      </div>

      {/* Вкладки */}
      <div style={{ display: 'flex', gap: 4, background: '#0d1424', borderRadius: 12, padding: 4 }}>
        {(['overview', 'subjects'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', transition: '.2s', background: activeTab === tab ? '#4F8EF7' : 'transparent', color: activeTab === tab ? '#fff' : '#8892A4' }}>
            {tab === 'overview' ? 'Обзор' : 'По предметам'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (<>
        {/* Радар */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Brain size={13} color="#9b8af5" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F0F4FF' }}>Когнитивный профиль</span>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#1E2A45" />
                <PolarAngleAxis dataKey="subject" fontSize={8} tick={{ fill: '#8892A4' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Уровень" dataKey="A" stroke="#4F8EF7" fill="#4F8EF7" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Сильные/слабые */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
              <Award size={12} color="#3dd68c" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3dd68c' }}>Сильные</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {profile.strongTopics.length > 0
                ? profile.strongTopics.slice(0, 4).map(t => (
                  <span key={t} style={{ padding: '3px 8px', background: '#0d2b1e', color: '#3dd68c', fontSize: 10, borderRadius: 6, border: '1px solid #1a5530', fontWeight: 600 }}>{t}</span>
                ))
                : <span style={{ fontSize: 10, color: '#8892A4', fontStyle: 'italic' }}>—</span>}
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
              <AlertCircle size={12} color="#f472a0" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f472a0' }}>Слабые</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {profile.weakTopics.length > 0
                ? profile.weakTopics.slice(0, 4).map(t => (
                  <span key={t} style={{ padding: '3px 8px', background: '#2b0a18', color: '#f472a0', fontSize: 10, borderRadius: 6, border: '1px solid #7a1f40', fontWeight: 600 }}>{t}</span>
                ))
                : <span style={{ fontSize: 10, color: '#8892A4', fontStyle: 'italic' }}>—</span>}
            </div>
          </div>
        </div>

        {/* График */}
        {chartData.length > 0 && (
          <div style={card}>
            <div style={cardTitle}>История прогресса · Redis</div>
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2A45" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1E2A45', borderRadius: 8, fontSize: 10, color: '#F0F4FF' }} />
                  <Line type="monotone" dataKey="score" stroke="#4F8EF7" strokeWidth={2} dot={{ r: 2, fill: '#4F8EF7' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </>)}

      {activeTab === 'subjects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedSubjectObjects.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: '#8892A4', fontSize: 12, padding: 24 }}>
              Пройдите диагностику для просмотра статистики
            </div>
          ) : selectedSubjectObjects.map(sub => {
            const stats = profile.subjectStats?.[sub.id];
            const acc = stats?.accuracy ?? 0;
            const color = SUBJECT_COLORS[sub.id] || '#4F8EF7';
            return (
              <div key={sub.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{sub.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#F0F4FF' }}>{sub.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{acc}%</span>
                    </div>
                    <div style={{ height: 5, background: '#1E2A45', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${acc}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .6s' }} />
                    </div>
                  </div>
                </div>
                {stats && (stats.weakTopics.length > 0 || stats.strongTopics.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {stats.strongTopics.map(t => (
                      <span key={t} style={{ fontSize: 9, background: '#0d2b1e', color: '#3dd68c', padding: '2px 6px', borderRadius: 4, border: '1px solid #1a5530' }}>✓ {t}</span>
                    ))}
                    {stats.weakTopics.map(t => (
                      <span key={t} style={{ fontSize: 9, background: '#2b0a18', color: '#f472a0', padding: '2px 6px', borderRadius: 4, border: '1px solid #7a1f40' }}>✗ {t}</span>
                    ))}
                  </div>
                )}
                {!stats && <p style={{ fontSize: 10, color: '#8892A4', fontStyle: 'italic' }}>Нет данных — пройдите диагностику</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* NocoDB */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={12} color="#818CF8" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: .5 }}>Статистика · NocoDB</span>
          </div>
          <button onClick={handleLoadStats} disabled={loadingStats}
            style={{ fontSize: 10, fontWeight: 700, color: '#4F8EF7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', opacity: loadingStats ? .4 : 1 }}>
            {loadingStats ? '...' : '↻ Загрузить'}
          </button>
        </div>
        {nocoStats ? (
          Object.keys(nocoStats).length === 0
            ? <p style={{ fontSize: 10, color: '#8892A4', fontStyle: 'italic' }}>Данных пока нет</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(nocoStats).map(([topic, stat]) => (
                <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#8892A4', width: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</span>
                  <div style={{ flex: 1, height: 4, background: '#1E2A45', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((stat.correct / stat.total) * 100)}%`, height: '100%', background: '#818CF8', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#8892A4' }}>{stat.correct}/{stat.total}</span>
                </div>
              ))}
            </div>
        ) : <p style={{ fontSize: 10, color: '#8892A4', fontStyle: 'italic' }}>Нажми «Загрузить» для данных</p>}
      </div>

      {/* Redis статус */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0d1424', border: '1px solid #1E2A45', borderRadius: 10 }}>
        <Database size={11} color="#8892A4" />
        <span style={{ fontSize: 10, color: '#8892A4', flex: 1 }}>Профиль синхронизирован · Redis</span>
        <span style={{ width: 6, height: 6, background: '#00D4AA', borderRadius: '50%', display: 'inline-block' }} />
      </div>

      {/* MinIO отчёт */}
      <button onClick={handleSaveReport} disabled={saveStatus === 'saving'}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px', borderRadius: 12, border: 'none', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
          background: saveStatus === 'saved' ? 'linear-gradient(135deg, #0d2b1e, #0d3a20)' : saveStatus === 'error' ? '#2b0a18' : saveStatus === 'saving' ? '#1a2030' : 'linear-gradient(135deg, #1a2a40, #1a2060)',
          color: saveStatus === 'saved' ? '#3dd68c' : saveStatus === 'error' ? '#f472a0' : '#F0F4FF',
          border: `1px solid ${saveStatus === 'saved' ? '#1a6644' : saveStatus === 'error' ? '#7a1f40' : '#2a3a60'}` as any,
        }}>
        {saveStatus === 'saved' ? <><CheckCircle size={13} /> Сохранено в MinIO!</> :
         saveStatus === 'error' ? <>❌ Ошибка MinIO</> :
         saveStatus === 'saving' ? <>⏳ Сохраняю...</> :
         <><FileDown size={13} /> Сохранить отчёт в MinIO</>}
      </button>
    </div>
  );
};
