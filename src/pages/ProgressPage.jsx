import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Dumbbell, Target, ChevronDown, ChevronUp, Zap, Award, Flame, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useWorkoutHistory, useLocalStorage } from '../hooks/useStorage';
import { exerciseDatabase, muscleGroups } from '../data/foodData';
import { calculateProgressiveOverload, formatNumber } from '../utils/calculations';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="stat-card !p-3 !rounded-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>{p.name}: {p.value}{p.name === '重量' ? 'kg' : p.name === '训练量' ? 'kg' : '次'}</p>
      ))}
    </div>
  );
};

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState('bench-press');
  const [selectedMuscle, setSelectedMuscle] = useState('chest');
  const [timeRange, setTimeRange] = useState('month');
  const [expandedExercise, setExpandedExercise] = useState(null);

  const { history, getExerciseHistory } = useWorkoutHistory();
  const exercises = exerciseDatabase[selectedMuscle] || [];
  const exerciseHistory = getExerciseHistory(selectedExercise);

  const allExercises = useMemo(() => {
    const result = [];
    Object.entries(exerciseDatabase).forEach(([muscle, exs]) => {
      exs.forEach(ex => {
        const hist = getExerciseHistory(ex.id);
        if (hist.length > 0) result.push({ ...ex, muscle, history: hist });
      });
    });
    return result;
  }, [history]);

  const chartData = useMemo(() => {
    if (exerciseHistory.length === 0) return [];
    const now = new Date();
    const ranges = { week: 7, month: 30, '3months': 90, all: 999999 };
    const startDate = new Date(now.getTime() - (ranges[timeRange] || 30) * 24 * 60 * 60 * 1000);
    return exerciseHistory.filter(w => new Date(w.date) >= startDate).map(w => ({
      date: new Date(w.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      weight: w.weight, volume: w.weight * w.reps * w.sets, reps: w.reps,
    }));
  }, [exerciseHistory, timeRange]);

  const volumeByMuscle = useMemo(() => {
    const volumes = {};
    Object.entries(muscleGroups).forEach(([key, group]) => {
      const muscleWorkouts = history.filter(w => w.muscleGroup === key);
      volumes[key] = { name: group.name, emoji: group.emoji, volume: muscleWorkouts.reduce((s, w) => s + w.weight * w.reps * w.sets, 0), count: muscleWorkouts.length };
    });
    return Object.values(volumes).sort((a, b) => b.volume - a.volume);
  }, [history]);

  const weeklyData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - (i * 7 + now.getDay()));
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const w = history.filter(h => { const d = new Date(h.date); return d >= start && d <= end; });
      weeks.push({ name: `第${4 - i}周`, volume: Math.round(w.reduce((s, h) => s + h.weight * h.reps * h.sets, 0)), sessions: w.length });
    }
    return weeks;
  }, [history]);

  const progressStats = useMemo(() => {
    if (exerciseHistory.length < 2) return null;
    const first = exerciseHistory[0], last = exerciseHistory[exerciseHistory.length - 1];
    const maxWeight = Math.max(...exerciseHistory.map(h => h.weight));
    const totalVolume = exerciseHistory.reduce((s, h) => s + h.weight * h.reps * h.sets, 0);
    const change = last.weight - first.weight;
    return { totalSessions: exerciseHistory.length, maxWeight, totalVolume, weightChange: Math.abs(change), weightTrend: change > 0 ? 'up' : change < 0 ? 'down' : 'same', avgVolume: Math.round(totalVolume / exerciseHistory.length) };
  }, [exerciseHistory]);

  const progressSuggestion = calculateProgressiveOverload(exerciseHistory);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">进步追踪</h1>
        <p className="text-sm text-slate-500 mt-1">可视化你的训练成果</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Award, label: '训练动作', value: allExercises.length, color: '#f59e0b' },
          { icon: Flame, label: '总训练', value: history.length, color: '#ef4444' },
          { icon: BarChart3, label: '总训练量', value: formatNumber(history.reduce((s, w) => s + w.weight * w.reps * w.sets, 0)), color: '#3b82f6' },
        ].map((stat, i) => (
          <div key={i} className="stat-card text-center">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${stat.color}15` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-sm mb-4">周训练趋势</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" name="训练量" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-sm mb-4">部位训练量</h3>
        <div className="space-y-3">
          {volumeByMuscle.map(muscle => (
            <div key={muscle.name} className="flex items-center gap-3">
              <span className="text-lg w-8">{muscle.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{muscle.name}</span>
                  <span className="text-xs text-slate-500">{formatNumber(muscle.volume)} kg · {muscle.count}次</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill" style={{ width: `${Math.min((muscle.volume / (volumeByMuscle[0]?.volume || 1)) * 100, 100)}%`, background: 'linear-gradient(90deg, #3b82f6, #a855f7)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">动作详情</h3>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            {[['week', '周'], ['month', '月'], ['3months', '3月'], ['all', '全部']].map(([key, label]) => (
              <button key={key} onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === key ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(muscleGroups).map(([key, group]) => (
            <button key={key} onClick={() => { setSelectedMuscle(key); setSelectedExercise(exerciseDatabase[key]?.[0]?.id || ''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedMuscle === key ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
              {group.emoji} {group.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {exercises.map(ex => (
            <button key={ex.id} onClick={() => setSelectedExercise(ex.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedExercise === ex.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
              {ex.name}
            </button>
          ))}
        </div>

        {chartData.length > 0 ? (
          <>
            <div className="h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="weight" name="重量" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="volume" name="训练量" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">暂无训练数据</p>
          </div>
        )}
      </div>

      {progressStats && (
        <div className="stat-card">
          <h3 className="font-semibold text-sm mb-4">训练统计</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '最大重量', value: `${progressStats.maxWeight}kg`, color: '#2563eb' },
              { label: '总训练量', value: `${formatNumber(progressStats.totalVolume)}kg`, color: '#16a34a' },
              { label: '平均训练量', value: `${formatNumber(progressStats.avgVolume)}kg`, color: '#9333ea' },
              { label: '重量变化', value: `${progressStats.weightChange}kg`, icon: progressStats.weightTrend === 'up' ? TrendingUp : progressStats.weightTrend === 'down' ? TrendingDown : Minus, color: progressStats.weightTrend === 'up' ? '#16a34a' : progressStats.weightTrend === 'down' ? '#ef4444' : '#94a3b8' },
            ].map((stat, i) => (
              <div key={i} className="p-3.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                <div className="flex items-center gap-1.5">
                  {stat.icon && <stat.icon className="w-4 h-4" style={{ color: stat.color }} />}
                  <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {progressSuggestion && (
        <div className="stat-card" style={{
          background: progressSuggestion.suggestion === 'increase_weight' ? 'rgba(34, 197, 94, 0.06)' : progressSuggestion.suggestion === 'increase_reps' ? 'rgba(59, 130, 246, 0.06)' : 'rgba(245, 158, 11, 0.06)',
          borderColor: progressSuggestion.suggestion === 'increase_weight' ? 'rgba(34, 197, 94, 0.25)' : progressSuggestion.suggestion === 'increase_reps' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" style={{ color: progressSuggestion.suggestion === 'increase_weight' ? '#16a34a' : progressSuggestion.suggestion === 'increase_reps' ? '#2563eb' : '#f59e0b' }} />
            <h3 className="font-semibold text-sm">下次训练建议</h3>
          </div>
          <p className="text-sm text-slate-500">{progressSuggestion.message}</p>
        </div>
      )}

      {allExercises.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold text-sm mb-4">所有动作</h3>
          <div className="space-y-1.5">
            {allExercises.map(ex => {
              const progress = calculateProgressiveOverload(ex.history);
              const last = ex.history[ex.history.length - 1];
              return (
                <div key={ex.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <button onClick={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{muscleGroups[ex.muscle]?.emoji}</span>
                      <div className="text-left">
                        <p className="font-medium text-sm">{ex.name}</p>
                        <p className="text-xs text-slate-500">{ex.history.length}次 · 最大{Math.max(...ex.history.map(h => h.weight))}kg</p>
                      </div>
                    </div>
                    {progress && (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{
                        background: progress.suggestion === 'increase_weight' ? 'rgba(34, 197, 94, 0.1)' : progress.suggestion === 'increase_reps' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: progress.suggestion === 'increase_weight' ? '#16a34a' : progress.suggestion === 'increase_reps' ? '#2563eb' : '#f59e0b'
                      }}>
                        {progress.suggestion === 'increase_weight' ? '↑加重' : progress.suggestion === 'increase_reps' ? '↑次数' : '保持'}
                      </span>
                    )}
                  </button>
                  {expandedExercise === ex.id && (
                    <div className="p-3.5 animate-slide-up" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="text-center p-2 rounded-lg" style={{ background: '#f8fafc' }}>
                          <p className="text-sm font-bold text-blue-600">{last.weight}kg</p>
                          <p className="text-[10px] text-slate-500">上次重量</p>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: '#f8fafc' }}>
                          <p className="text-sm font-bold text-green-600">{last.reps}次</p>
                          <p className="text-[10px] text-slate-500">上次次数</p>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: '#f8fafc' }}>
                          <p className="text-sm font-bold text-purple-600">{last.sets}组</p>
                          <p className="text-[10px] text-slate-500">上次组数</p>
                        </div>
                      </div>
                      {progress && <p className="text-xs text-slate-500 mt-2">{progress.message}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
