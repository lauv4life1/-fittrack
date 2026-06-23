import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, RefreshCw, Target, Zap, Check, Plus, Trash2 } from 'lucide-react';
import { useLocalStorage, useWorkoutHistory } from '../hooks/useStorage';
import { generateTrainingPlan } from '../utils/calculations';
import { muscleGroups, exerciseDatabase } from '../data/foodData';

export default function PlanPage() {
  const [userData] = useLocalStorage('userData', null);
  const [planSettings, setPlanSettings] = useLocalStorage('planSettings', { experience: 'beginner', goal: 'lose', daysPerWeek: 3 });
  const [feedback, setFeedback] = useState({ energy: 5, soreness: 5, sleep: 5, stress: 5, notes: '' });
  const [feedbackHistory, setFeedbackHistory] = useLocalStorage('feedbackHistory', []);
  const [currentPlan, setCurrentPlan] = useLocalStorage('currentPlan', null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [customExercise, setCustomExercise] = useState('');

  const { history } = useWorkoutHistory();

  const generatePlan = () => setCurrentPlan(generateTrainingPlan(planSettings));

  const saveFeedback = () => {
    setFeedbackHistory(prev => [{ ...feedback, date: new Date().toISOString(), id: Date.now() }, ...prev].slice(0, 30));
    setFeedback({ energy: 5, soreness: 5, sleep: 5, stress: 5, notes: '' });
  };

  const getAdjustedPlan = () => {
    if (!currentPlan) return null;
    const recent = feedbackHistory.slice(0, 3);
    if (recent.length === 0) return currentPlan;
    const avgEnergy = recent.reduce((s, f) => s + f.energy, 0) / recent.length;
    const avgSoreness = recent.reduce((s, f) => s + f.soreness, 0) / recent.length;
    return currentPlan.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => ({
        name: ex, sets: avgSoreness > 7 ? 3 : avgEnergy > 7 ? 5 : 4,
        reps: avgSoreness > 7 ? 12 : avgEnergy > 7 ? 8 : 10,
        note: avgSoreness > 7 ? '减轻强度' : avgEnergy > 7 ? '可增加强度' : '正常',
      })),
    }));
  };

  const adjustedPlan = getAdjustedPlan();

  const addCustomExercise = (dayIndex) => {
    if (!customExercise.trim()) return;
    const updated = [...(currentPlan || [])];
    if (updated[dayIndex]) { updated[dayIndex].exercises.push(customExercise.trim()); setCurrentPlan(updated); setCustomExercise(''); }
  };

  const removeExercise = (dayIndex, exIndex) => {
    const updated = [...(currentPlan || [])];
    if (updated[dayIndex]) { updated[dayIndex].exercises = updated[dayIndex].exercises.filter((_, i) => i !== exIndex); setCurrentPlan(updated); }
  };

  const getTrainingDaysThisWeek = () => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return history.filter(w => new Date(w.date) >= weekAgo).length;
  };

  const getMuscleFromExercise = (name) => {
    for (const [muscle, exs] of Object.entries(exerciseDatabase)) {
      if (exs.some(e => e.name === name)) return muscleGroups[muscle];
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">训练计划</h1>
          <p className="text-sm text-slate-500 mt-1">个性化训练方案，根据状态自动调整</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary">
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">设置</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Calendar, label: '本周训练', value: getTrainingDaysThisWeek(), color: '#3b82f6' },
          { icon: Target, label: '目标天数', value: planSettings.daysPerWeek, color: '#22c55e' },
          { icon: Zap, label: '水平', value: planSettings.experience === 'beginner' ? '新手' : planSettings.experience === 'intermediate' ? '中级' : '高级', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${s.color}15` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {showSettings && (
        <div className="stat-card animate-slide-up">
          <h3 className="font-semibold text-sm mb-4">计划设置</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">训练水平</label>
              <div className="grid grid-cols-3 gap-2">
                {[['beginner', '新手', '0-1年'], ['intermediate', '中级', '1-3年'], ['advanced', '高级', '3年+']].map(([id, name, desc]) => (
                  <button key={id} onClick={() => setPlanSettings(p => ({ ...p, experience: id }))}
                    className={`p-3 rounded-xl transition-all ${planSettings.experience === id ? 'bg-slate-900 text-white border-transparent' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-transparent'}`}
                    style={{ border: '1px solid' }}>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">训练目标</label>
              <div className="grid grid-cols-2 gap-2">
                {[['lose', '减脂塑形', '🔥'], ['gain', '增肌增重', '💪']].map(([id, name, emoji]) => (
                  <button key={id} onClick={() => setPlanSettings(p => ({ ...p, goal: id }))}
                    className={`p-3 rounded-xl transition-all ${planSettings.goal === id ? 'bg-slate-900 text-white border-transparent' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-transparent'}`}
                    style={{ border: '1px solid' }}>
                    <span className="text-lg">{emoji}</span>
                    <p className="font-medium text-sm mt-1">{name}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">每周天数</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map(d => (
                  <button key={d} onClick={() => setPlanSettings(p => ({ ...p, daysPerWeek: d }))}
                    className={`p-3 rounded-xl transition-all ${planSettings.daysPerWeek === d ? 'bg-slate-900 text-white border-transparent' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-transparent'}`}
                    style={{ border: '1px solid' }}>
                    <p className="text-xl font-bold">{d}</p>
                    <p className="text-xs text-slate-500">天/周</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { generatePlan(); setShowSettings(false); }} className="btn-primary w-full">
              <RefreshCw className="w-4 h-4" />
              生成训练计划
            </button>
          </div>
        </div>
      )}

      <div className="stat-card">
        <h3 className="font-semibold text-sm mb-4">每日状态反馈</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { key: 'energy', label: '精力', emoji: '⚡', color: '#3b82f6', min: '疲惫', max: '充沛' },
            { key: 'soreness', label: '酸痛', emoji: '💪', color: '#f59e0b', min: '无感', max: '剧痛' },
            { key: 'sleep', label: '睡眠', emoji: '😴', color: '#a855f7', min: '很差', max: '很好' },
            { key: 'stress', label: '压力', emoji: '😰', color: '#ef4444', min: '轻松', max: '高压' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-slate-500 mb-2 flex items-center justify-between">
                <span>{f.emoji} {f.label}</span>
                <span style={{ color: f.color }}>{feedback[f.key]}/10</span>
              </label>
              <input type="range" min="1" max="10" value={feedback[f.key]}
                onChange={e => setFeedback(p => ({ ...p, [f.key]: parseInt(e.target.value) }))}
                className="w-full accent-blue-500" style={{ accentColor: f.color }} />
              <div className="flex justify-between text-[10px] text-slate-400"><span>{f.min}</span><span>{f.max}</span></div>
            </div>
          ))}
        </div>
        <textarea value={feedback.notes} onChange={e => setFeedback(p => ({ ...p, notes: e.target.value }))}
          placeholder="今天的训练感受..." className="input-field mb-3" rows="2" />
        <button onClick={saveFeedback} className="btn-primary w-full">
          <Check className="w-4 h-4" />
          保存反馈
        </button>
      </div>

      {currentPlan ? (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">训练计划</h3>
            <button onClick={generatePlan} className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> 重新生成
            </button>
          </div>
          <div className="space-y-2">
            {adjustedPlan.map((day, di) => (
              <div key={di} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <button onClick={() => setExpandedDay(expandedDay === di ? null : di)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <Calendar className="w-4.5 h-4.5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{day.day}</p>
                      <p className="text-xs text-slate-500">{day.focus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{day.exercises.length}个动作</span>
                    {expandedDay === di ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {expandedDay === di && (
                  <div className="p-4 animate-slide-up" style={{ borderTop: '1px solid #e2e8f0' }}>
                    <div className="space-y-1.5 mb-3">
                      {day.exercises.map((ex, ei) => {
                        const name = typeof ex === 'string' ? ex : ex.name;
                        const sets = typeof ex === 'object' ? ex.sets : 4;
                        const reps = typeof ex === 'object' ? ex.reps : 10;
                        const note = typeof ex === 'object' ? ex.note : '';
                        const muscle = getMuscleFromExercise(name);
                        return (
                          <div key={ei} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{muscle?.emoji || '💪'}</span>
                              <div>
                                <p className="text-sm font-medium">{name}</p>
                                <p className="text-[11px] text-slate-500">{sets}组 × {reps}次 {note && `· ${note}`}</p>
                              </div>
                            </div>
                            <button onClick={() => removeExercise(di, ei)} className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {editingDay === di ? (
                      <div className="flex gap-2">
                        <input type="text" value={customExercise} onChange={e => setCustomExercise(e.target.value)}
                          placeholder="添加动作..." className="input-field flex-1"
                          onKeyDown={e => e.key === 'Enter' && (addCustomExercise(di), setEditingDay(null))} />
                        <button onClick={() => { addCustomExercise(di); setEditingDay(null); }} className="btn-primary px-3">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingDay(di)}
                        className="w-full p-2.5 rounded-xl text-slate-500 hover:text-slate-400 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 text-sm"
                        style={{ border: '1px dashed #cbd5e1' }}>
                        <Plus className="w-4 h-4" /> 添加动作
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="stat-card text-center py-12">
          <Calendar className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">还没有训练计划</h3>
          <p className="text-sm text-slate-500 mb-6">根据你的水平和目标生成个性化训练计划</p>
          <button onClick={generatePlan} className="btn-primary">
            <Zap className="w-4 h-4" />
            生成训练计划
          </button>
        </div>
      )}
    </div>
  );
}
