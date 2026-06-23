import { useState, useEffect } from 'react';
import { Pill, Check, Clock, Bell, BellOff, ChevronDown, ChevronUp, Info, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supplementReminders } from '../data/foodData';
import { useSupplementReminders } from '../hooks/useStorage';

const timeSlots = [
  { id: 'morning', name: '早上', time: '07:00-09:00', emoji: '🌅' },
  { id: 'pre-workout', name: '训练前', time: '训练前30分钟', emoji: '⚡' },
  { id: 'post-workout', name: '训练后', time: '训练后30分钟内', emoji: '💪' },
  { id: 'evening', name: '晚上', time: '18:00-20:00', emoji: '🌙' },
];

export default function SupplementsPage() {
  const { markAsTaken, isTakenToday, shouldRemind, updateLastReminderTime } = useSupplementReminders();
  const [expandedSupplement, setExpandedSupplement] = useState(null);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(null);

  const takenToday = supplementReminders.filter(s => isTakenToday(s.id));
  const pendingToday = supplementReminders.filter(s => !isTakenToday(s.id));
  const completionRate = Math.round((takenToday.length / supplementReminders.length) * 100);

  const getStatus = (supplement) => {
    if (isTakenToday(supplement.id)) return { label: '已服用', color: '#22c55e', bg: '#dcfce7' };
    return { label: '待服用', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  };

  const getStreakDays = () => {
    const stored = localStorage.getItem('supplementStreak');
    if (!stored) return 0;
    const streak = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    if (streak.lastDate === today) return streak.days;
    return 0;
  };

  useEffect(() => {
    if (completionRate === 100) {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem('supplementStreak');
      let streak = stored ? JSON.parse(stored) : { days: 0, lastDate: '' };
      if (streak.lastDate !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        streak.days = streak.lastDate === yesterday.toISOString().split('T')[0] ? streak.days + 1 : 1;
        streak.lastDate = today;
        localStorage.setItem('supplementStreak', JSON.stringify(streak));
      }
    }
  }, [completionRate]);

  const streakDays = getStreakDays();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">补剂提醒</h1>
          <p className="text-sm text-slate-500 mt-1">追踪每日补剂摄入</p>
        </div>
        <button onClick={() => setRemindersEnabled(!remindersEnabled)}
          className={`p-2.5 rounded-xl transition-all ${remindersEnabled ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
          {remindersEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-slate-500">今日进度</p>
            <p className="text-3xl font-bold mt-1">{completionRate}<span className="text-lg text-slate-500 ml-0.5">%</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">已服用</p>
            <p className="text-lg font-medium">{takenToday.length}/{supplementReminders.length}</p>
            {streakDays > 0 && (
              <p className="text-xs text-amber-400 flex items-center justify-end gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> 连续 {streakDays} 天
              </p>
            )}
          </div>
        </div>
        <div className="progress-bar mb-4">
          <div className="progress-fill" style={{ width: `${completionRate}%`, background: completionRate === 100 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
        </div>
        <div className="flex gap-1">
          {supplementReminders.map(s => (
            <div key={s.id} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: isTakenToday(s.id) ? '#22c55e' : '#e2e8f0' }} />
          ))}
        </div>
      </div>

      {pendingToday.length > 0 && (
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm">待服用</h3>
          </div>
          <div className="space-y-1.5">
            {pendingToday.map(supplement => {
              const status = getStatus(supplement);
              const isExpanded = expandedSupplement === supplement.id;
              return (
                <div key={supplement.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                  <button onClick={() => setExpandedSupplement(isExpanded ? null : supplement.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{supplement.icon}</span>
                      <div className="text-left">
                        <p className="font-medium text-sm">{supplement.name}</p>
                        <p className="text-xs text-slate-500">{supplement.dosage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-4 animate-slide-up" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <p className="text-xs text-slate-400 mb-3">{supplement.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {supplement.times.map(t => {
                          const slot = timeSlots.find(s => s.id === t);
                          return <span key={t} className="text-[11px] px-2 py-1 rounded-lg text-slate-400" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>{slot?.emoji} {slot?.name}</span>;
                        })}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500"><Clock className="w-3 h-3 inline mr-1" />{supplement.timing}</p>
                        <button onClick={() => markAsTaken(supplement.id)} className="btn-primary text-xs py-2 px-4">
                          <Check className="w-3.5 h-3.5" /> 标记服用
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {takenToday.length > 0 && (
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-sm">已服用</h3>
          </div>
          <div className="space-y-1.5">
            {takenToday.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.dosage}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stat-card">
        <h3 className="font-semibold text-sm mb-4">补剂指南</h3>
        <div className="space-y-1.5">
          {supplementReminders.map(s => (
            <div key={s.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <button onClick={() => setShowInfo(showInfo === s.id ? null : s.id)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
              </button>
              {showInfo === s.id && (
                <div className="p-3.5 animate-slide-up" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <p className="text-xs text-slate-400 mb-3">{s.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                      <p className="text-[11px] text-slate-500">推荐剂量</p>
                      <p className="text-sm font-medium">{s.dosage}</p>
                    </div>
                    <div className="p-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                      <p className="text-[11px] text-slate-500">服用时间</p>
                      <p className="text-sm font-medium">{s.timing}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {completionRate === 100 && (
        <div className="stat-card text-center py-8" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-green-400 mb-1">今日补剂已全部服用！</h3>
          <p className="text-sm text-slate-400">{streakDays > 1 ? `连续 ${streakDays} 天完成计划` : '继续保持！'}</p>
        </div>
      )}

      {remindersEnabled && (
        <div className="stat-card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-400 mb-1">提醒设置</h4>
              <p className="text-xs text-slate-400 mb-3">补剂提醒已开启，系统会在适当时间提醒你</p>
              <div className="flex flex-wrap gap-1.5">
                {timeSlots.map(s => (
                  <span key={s.id} className="text-[11px] px-2 py-1 rounded-lg text-slate-400" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {s.emoji} {s.name} · {s.time}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
