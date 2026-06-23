import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, Dumbbell, Utensils, Pill, ChevronRight, Zap, Beef, Wheat, Droplets, ArrowUpRight, Clock, Calendar } from 'lucide-react';
import { useLocalStorage, useFoodLog, useWorkoutHistory, useSupplementReminders } from '../hooks/useStorage';
import { calculateBMR, calculateTDEE, calculateCalorieTarget, getGreeting, formatNumber } from '../utils/calculations';
import { supplementReminders } from '../data/foodData';

function CircularProgress({ value, max, size = 120, strokeWidth = 8, color = '#3b82f6' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min((value / max) * 100, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="ring-progress" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{formatNumber(value)}</span>
        <span className="text-xs text-slate-400">/ {formatNumber(max)}</span>
      </div>
    </div>
  );
}

function MacroCard({ icon: Icon, label, value, target, unit, color }) {
  const progress = Math.min((value / target) * 100, 100);
  return (
    <div className="p-4 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}10` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-900 mb-1">{value}<span className="text-sm text-slate-400 ml-1">{unit}</span></p>
      <div className="progress-bar mt-2">
        <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
      </div>
      <p className="text-xs text-slate-400 mt-1.5">目标 {target}{unit}</p>
    </div>
  );
}

export default function Dashboard() {
  const [userData] = useLocalStorage('userData', null);
  const { getDayTotals, getDayLog } = useFoodLog();
  const { getRecentWorkouts, getWeeklyVolume } = useWorkoutHistory();
  const { isTakenToday } = useSupplementReminders();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayTotals = getDayTotals(today);
  const todayLog = getDayLog(today);
  const recentWorkouts = getRecentWorkouts(5);
  const weeklyVolume = getWeeklyVolume();

  let calorieTarget = 2000;
  let macroTargets = { protein: 150, carbs: 200, fat: 67 };

  if (userData) {
    const bmr = calculateBMR(userData.weight, userData.height, userData.age, userData.gender);
    const tdee = calculateTDEE(bmr, userData.activityLevel);
    calorieTarget = calculateCalorieTarget(tdee, userData.goal);
    const proteinTarget = Math.round(userData.weight * 2);
    const fatTarget = Math.round(calorieTarget * 0.25 / 9);
    const carbTarget = Math.round((calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4);
    macroTargets = { protein: proteinTarget, carbs: carbTarget, fat: fatTarget };
  }

  const mealCount = Object.keys(todayLog).filter(k => todayLog[k]?.length > 0).length;
  const supplementsTaken = supplementReminders.filter(s => isTakenToday(s.id)).length;
  const greeting = getGreeting();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">
            {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}，{userData?.name || '健身达人'}
          </h1>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-slate-900">今日热量</h3>
            </div>
            <p className="text-sm text-slate-500">
              剩余 <span className="text-slate-900 font-medium">{formatNumber(Math.max(0, calorieTarget - todayTotals.calories))}</span> kcal 可摄入
            </p>
          </div>
          <CircularProgress value={todayTotals.calories} max={calorieTarget} color="#f59e0b" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MacroCard icon={Beef} label="蛋白质" value={todayTotals.protein} target={macroTargets.protein} unit="g" color="#ef4444" />
          <MacroCard icon={Wheat} label="碳水" value={todayTotals.carbs} target={macroTargets.carbs} unit="g" color="#f59e0b" />
          <MacroCard icon={Droplets} label="脂肪" value={todayTotals.fat} target={macroTargets.fat} unit="g" color="#3b82f6" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/food" className="stat-card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Utensils className="w-5 h-5 text-blue-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{mealCount}</p>
          <p className="text-sm text-slate-500">今日餐数</p>
        </Link>

        <Link to="/workout" className="stat-card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <Dumbbell className="w-5 h-5 text-green-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{recentWorkouts.length}</p>
          <p className="text-sm text-slate-500">近期训练</p>
        </Link>

        <Link to="/progress" className="stat-card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#faf5ff' }}>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(weeklyVolume)}</p>
          <p className="text-sm text-slate-500">周训练量</p>
        </Link>

        <Link to="/supplements" className="stat-card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#fffbeb' }}>
              <Pill className="w-5 h-5 text-amber-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{supplementsTaken}/{supplementReminders.length}</p>
          <p className="text-sm text-slate-500">今日补剂</p>
        </Link>
      </div>

      {recentWorkouts.length > 0 && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">近期训练</h3>
            </div>
            <Link to="/workout" className="text-sm text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1">
              查看全部 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentWorkouts.slice(0, 3).map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50">
                    <Dumbbell className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">{workout.exerciseName}</p>
                    <p className="text-xs text-slate-500">{workout.weight}kg × {workout.reps}次 × {workout.sets}组</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{new Date(workout.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-xs font-medium text-slate-600">{formatNumber(workout.weight * workout.reps * workout.sets)} kg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!userData && (
        <div className="stat-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-100">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">开始你的健身之旅</h3>
              <p className="text-sm text-slate-600 mb-4">
                填写身体数据，获取个性化的热量目标和训练计划
              </p>
              <Link to="/food" className="btn-primary inline-flex">
                立即设置
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
