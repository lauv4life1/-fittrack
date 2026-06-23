import { useState } from 'react';
import { 
  Dumbbell, Plus, Trash2, Check, ChevronDown, ChevronUp, Clock, Flame, TrendingUp, Target, Zap
} from 'lucide-react';
import { exerciseDatabase, muscleGroups } from '../data/foodData';
import { useWorkoutHistory, useLocalStorage } from '../hooks/useStorage';
import { calculateProgressiveOverload, formatNumber } from '../utils/calculations';

export default function WorkoutPage() {
  const [selectedMuscle, setSelectedMuscle] = useState('chest');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workoutData, setWorkoutData] = useState({ sets: 3, reps: 10, weight: '', notes: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);

  const { addWorkout, getExerciseHistory, getRecentWorkouts, getWeeklyVolume } = useWorkoutHistory();
  const recentWorkouts = getRecentWorkouts(20);
  const weeklyVolume = getWeeklyVolume();
  const exercises = exerciseDatabase[selectedMuscle] || [];

  const handleAddWorkout = () => {
    if (!selectedExercise || !workoutData.weight) return;
    const exercise = exercises.find(e => e.id === selectedExercise);
    addWorkout({
      exerciseId: selectedExercise, exerciseName: exercise.name, muscleGroup: selectedMuscle,
      sets: parseInt(workoutData.sets), reps: parseInt(workoutData.reps),
      weight: parseFloat(workoutData.weight), targetReps: workoutData.reps, notes: workoutData.notes,
    });
    setWorkoutData({ sets: 3, reps: 10, weight: '', notes: '' });
    setSelectedExercise(null);
  };

  const getProgressSuggestion = (exerciseId) => calculateProgressiveOverload(getExerciseHistory(exerciseId));

  const getExerciseStats = (exerciseId) => {
    const history = getExerciseHistory(exerciseId);
    if (history.length === 0) return null;
    const recent = history.slice(-5);
    return {
      totalSessions: history.length,
      maxWeight: Math.max(...history.map(h => h.weight)),
      avgVolume: Math.round(recent.reduce((sum, h) => sum + (h.weight * h.reps * h.sets), 0) / recent.length),
      lastWorkout: history[history.length - 1],
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">训练记录</h1>
          <p className="text-sm text-slate-500 mt-1">记录每次训练，追踪你的进步</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">{showHistory ? '返回' : '历史'}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: '近期训练', value: recentWorkouts.length, color: '#f59e0b' },
          { icon: TrendingUp, label: '周训练量', value: formatNumber(weeklyVolume), color: '#22c55e' },
          { icon: Target, label: '训练部位', value: new Set(recentWorkouts.map(w => w.muscleGroup)).size, color: '#a855f7' },
        ].map((stat, i) => (
          <div key={i} className="stat-card text-center">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${stat.color}15` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {!showHistory ? (
        <>
          <div className="stat-card">
            <h3 className="font-semibold text-sm mb-4">选择训练部位</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(muscleGroups).map(([key, group]) => (
                <button key={key} onClick={() => { setSelectedMuscle(key); setSelectedExercise(null); }}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    selectedMuscle === key
                      ? 'bg-slate-900 border-transparent text-white'
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                  }`} style={{ border: '1px solid' }}>
                  <span className="text-xl">{group.emoji}</span>
                  <p className="text-xs mt-1 font-medium">{group.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <h3 className="font-semibold text-sm mb-4">
              {muscleGroups[selectedMuscle]?.emoji} {muscleGroups[selectedMuscle]?.name}训练
            </h3>
            <div className="space-y-2">
              {exercises.map(exercise => {
                const stats = getExerciseStats(exercise.id);
                const progress = getProgressSuggestion(exercise.id);
                const isExpanded = expandedExercise === exercise.id;
                return (
                  <div key={exercise.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                    <button onClick={() => { setExpandedExercise(isExpanded ? null : exercise.id); setSelectedExercise(exercise.id); }}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: exercise.type === 'compound' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)' }}>
                          <Dumbbell className="w-4.5 h-4.5" style={{ color: exercise.type === 'compound' ? '#3b82f6' : '#a855f7' }} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">{exercise.name}</p>
                          <p className="text-xs text-slate-500">{exercise.type === 'compound' ? '复合动作' : '孤立动作'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stats && <span className="text-xs text-slate-400">{stats.totalSessions}次</span>}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-4 animate-slide-up" style={{ borderTop: '1px solid #e2e8f0' }}>
                        {stats && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="text-center p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                              <p className="text-lg font-bold text-blue-600">{stats.maxWeight}kg</p>
                              <p className="text-[11px] text-slate-500">最大重量</p>
                            </div>
                            <div className="text-center p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                              <p className="text-lg font-bold text-green-600">{stats.totalSessions}</p>
                              <p className="text-[11px] text-slate-500">训练次数</p>
                            </div>
                            <div className="text-center p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                              <p className="text-lg font-bold text-purple-600">{formatNumber(stats.avgVolume)}</p>
                              <p className="text-[11px] text-slate-500">平均训练量</p>
                            </div>
                          </div>
                        )}
                        {progress && (
                          <div className="mb-4 p-3 rounded-xl" style={{ 
                            background: progress.suggestion === 'increase_weight' ? '#f0fdf4' : progress.suggestion === 'increase_reps' ? '#eff6ff' : '#fffbeb',
                            border: `1px solid ${progress.suggestion === 'increase_weight' ? '#bbf7d0' : progress.suggestion === 'increase_reps' ? '#bfdbfe' : '#fde68a'}`
                          }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="w-4 h-4" style={{ color: progress.suggestion === 'increase_weight' ? '#22c55e' : progress.suggestion === 'increase_reps' ? '#3b82f6' : '#f59e0b' }} />
                              <span className="text-sm font-medium">进步建议</span>
                            </div>
                            <p className="text-xs text-slate-400">{progress.message}</p>
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: '组数', key: 'sets' },
                              { label: '次数', key: 'reps' },
                              { label: '重量(kg)', key: 'weight' },
                            ].map(field => (
                              <div key={field.key}>
                                <label className="text-xs text-slate-500 mb-1 block">{field.label}</label>
                                <input type="number" value={workoutData[field.key]}
                                  onChange={e => setWorkoutData(p => ({ ...p, [field.key]: e.target.value }))}
                                  placeholder="0" className="input-field text-center" />
                              </div>
                            ))}
                          </div>
                          <input type="text" value={workoutData.notes} onChange={e => setWorkoutData(p => ({ ...p, notes: e.target.value }))}
                            placeholder="训练感受..." className="input-field" />
                          <button onClick={handleAddWorkout} disabled={!workoutData.weight}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                            <Check className="w-4 h-4" />
                            记录训练
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">训练历史</h3>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">还没有训练记录</p>
              <p className="text-xs text-slate-400 mt-1">开始你的第一次训练吧</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((workout, index) => {
                const muscle = muscleGroups[workout.muscleGroup];
                return (
                  <div key={index} className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <span className="text-lg">{muscle?.emoji || '💪'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{workout.exerciseName}</p>
                        <p className="text-xs text-slate-500">{workout.weight}kg × {workout.reps}次 × {workout.sets}组</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{new Date(workout.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs font-medium text-slate-400">{formatNumber(workout.weight * workout.reps * workout.sets)} kg</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
