import { useState, useCallback } from 'react';
import { 
  Search, Plus, Trash2, X, User, Target, Activity, Scale, Ruler, Calendar,
  Globe, Loader2, AlertCircle
} from 'lucide-react';
import { commonFoods, foodCategories } from '../data/foodData';
import { useFoodLog, useLocalStorage } from '../hooks/useStorage';
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacroSplit, formatNumber } from '../utils/calculations';
import { searchFoods, parseNutritionFromDescription } from '../utils/fatsecret';

const mealTypes = [
  { id: 'breakfast', name: '早餐', emoji: '🌅', time: '07:00-09:00' },
  { id: 'lunch', name: '午餐', emoji: '☀️', time: '12:00-14:00' },
  { id: 'dinner', name: '晚餐', emoji: '🌙', time: '18:00-20:00' },
  { id: 'snack', name: '加餐', emoji: '🍎', time: '其他时间' },
];

const goalLabels = { lose: '减脂', maintain: '维持', gain: '增肌' };

export default function FoodPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [showProfile, setShowProfile] = useState(false);
  const [customAmounts, setCustomAmounts] = useState({});
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [searchMode, setSearchMode] = useState('local');
  const [apiResults, setApiResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedApiFood, setSelectedApiFood] = useState(null);
  const [apiFoodAmount, setApiFoodAmount] = useState('100');

  const [rawUserData, setRawUserData] = useLocalStorage('userData', null);
  const userData = rawUserData || { name: '', age: '', gender: 'male', height: '', weight: '', activityLevel: 'moderate', goal: 'lose' };
  const setUserData = (updater) => {
    const newVal = typeof updater === 'function' ? updater(rawUserData || {}) : updater;
    setRawUserData(newVal);
  };

  const { addFoodEntry, removeFoodEntry, getDayLog, getDayTotals } = useFoodLog();
  const today = new Date().toISOString().split('T')[0];
  const todayLog = getDayLog(today);
  const todayTotals = getDayTotals(today);

  let calorieTarget = 2000;
  let macroTargets = { protein: 150, carbs: 200, fat: 67 };
  
  if (userData?.weight && userData?.height && userData?.age) {
    const bmr = calculateBMR(parseFloat(userData.weight), parseFloat(userData.height), parseInt(userData.age), userData.gender);
    const tdee = calculateTDEE(bmr, userData.activityLevel);
    calorieTarget = calculateCalorieTarget(tdee, userData.goal);
    macroTargets = calculateMacroSplit(calorieTarget, userData.goal);
  }

  const filteredFoods = commonFoods.filter(food => {
    const matchesSearch = food.name.includes(searchTerm) || food.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '全部' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleApiSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchFoods(searchTerm);
      setApiResults(result.results || []);
      if (result.error) setSearchError(result.error);
    } catch (e) {
      setSearchError('搜索失败: ' + e.message);
      setApiResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm]);

  const handleAddApiFood = () => {
    if (!selectedApiFood) return;
    const nutrition = parseNutritionFromDescription(selectedApiFood.description);
    if (!nutrition) return;
    const amount = parseFloat(apiFoodAmount) || 100;
    const ratio = amount / 100;
    addFoodEntry(today, selectedMeal, {
      foodId: selectedApiFood.id, name: selectedApiFood.name, amount,
      calories: Math.round(nutrition.calories * ratio), protein: Math.round(nutrition.protein * ratio),
      carbs: Math.round(nutrition.carbs * ratio), fat: Math.round(nutrition.fat * ratio),
    });
    setSelectedApiFood(null);
    setApiFoodAmount('100');
    setApiResults([]);
    setSearchTerm('');
  };

  const handleAddFood = (food) => {
    const amount = parseFloat(customAmounts[food.id]) || 100;
    const ratio = amount / 100;
    addFoodEntry(today, selectedMeal, {
      foodId: food.id, name: food.name, amount,
      calories: Math.round(food.calories * ratio), protein: Math.round(food.protein * ratio),
      carbs: Math.round(food.carbs * ratio), fat: Math.round(food.fat * ratio),
    });
    setCustomAmounts(prev => ({ ...prev, [food.id]: '' }));
  };

  const handleAddCustomFood = () => {
    if (!customFood.name || !customFood.calories) return;
    addFoodEntry(today, selectedMeal, {
      foodId: 'custom-' + Date.now(), name: customFood.name, amount: 100,
      calories: parseFloat(customFood.calories) || 0, protein: parseFloat(customFood.protein) || 0,
      carbs: parseFloat(customFood.carbs) || 0, fat: parseFloat(customFood.fat) || 0,
    });
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setShowAddCustom(false);
  };

  const calorieProgress = Math.min((todayTotals.calories / calorieTarget) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">饮食记录</h1>
          <p className="text-sm text-slate-500 mt-1">追踪你的每日营养摄入</p>
        </div>
        <button onClick={() => setShowProfile(true)} className="btn-secondary">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">身体数据</span>
        </button>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-slate-500">今日摄入</p>
            <p className="text-3xl font-bold mt-1">{formatNumber(todayTotals.calories)}<span className="text-lg text-slate-500 ml-1">kcal</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">目标</p>
            <p className="text-lg font-medium">{formatNumber(calorieTarget)} kcal</p>
          </div>
        </div>
        <div className="progress-bar mb-4">
          <div className="progress-fill" style={{ width: `${calorieProgress}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '蛋白质', value: todayTotals.protein, target: macroTargets.protein, color: '#ef4444' },
            { label: '碳水', value: todayTotals.carbs, target: macroTargets.carbs, color: '#f59e0b' },
            { label: '脂肪', value: todayTotals.fat, target: macroTargets.fat, color: '#3b82f6' },
          ].map(macro => (
            <div key={macro.label} className="text-center p-3 rounded-xl" style={{ background: `${macro.color}08`, border: `1px solid ${macro.color}15` }}>
              <p className="text-xs text-slate-500 mb-1">{macro.label}</p>
              <p className="text-lg font-bold" style={{ color: macro.color }}>{macro.value}<span className="text-xs text-slate-500 ml-0.5">g</span></p>
              <div className="progress-bar mt-2 h-1">
                <div className="progress-fill" style={{ width: `${Math.min((macro.value / macro.target) * 100, 100)}%`, background: macro.color }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">/ {macro.target}g</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {mealTypes.map(meal => (
          <button
            key={meal.id}
            onClick={() => setSelectedMeal(meal.id)}
            className={`p-3.5 rounded-xl text-left transition-all duration-200 ${
              selectedMeal === meal.id
                ? 'bg-slate-900 text-white border-transparent'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-transparent'
            }`}
            style={{ border: '1px solid' }}
          >
            <span className="text-lg">{meal.emoji}</span>
            <p className="font-medium text-sm mt-1">{meal.name}</p>
            <p className="text-[11px] text-slate-500">{meal.time}</p>
          </button>
        ))}
      </div>

      {Object.entries(todayLog).map(([mealType, entries]) => {
        if (entries.length === 0) return null;
        const meal = mealTypes.find(m => m.id === mealType);
        const mealCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
        return (
          <div key={mealType} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{meal?.emoji}</span>
                <h3 className="font-semibold text-sm">{meal?.name}</h3>
              </div>
              <span className="text-sm text-slate-500">{mealCalories} kcal</span>
            </div>
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <p className="font-medium text-sm text-slate-900">{entry.name}</p>
                    <p className="text-xs text-slate-500">{entry.amount}g</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-500">{entry.calories} kcal</p>
                      <p className="text-[11px] text-slate-400">P:{entry.protein} C:{entry.carbs} F:{entry.fat}</p>
                    </div>
                    <button onClick={() => removeFoodEntry(today, mealType, entry.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">添加食物</h3>
          <button onClick={() => setShowAddCustom(!showAddCustom)} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            {showAddCustom ? '取消' : '+ 自定义'}
          </button>
        </div>

        {showAddCustom && (
          <div className="mb-4 p-4 rounded-xl animate-slide-up" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="text" placeholder="食物名称" value={customFood.name} onChange={e => setCustomFood(p => ({ ...p, name: e.target.value }))} className="input-field" />
              <input type="number" placeholder="热量 (kcal)" value={customFood.calories} onChange={e => setCustomFood(p => ({ ...p, calories: e.target.value }))} className="input-field" />
              <input type="number" placeholder="蛋白质 (g)" value={customFood.protein} onChange={e => setCustomFood(p => ({ ...p, protein: e.target.value }))} className="input-field" />
              <input type="number" placeholder="碳水 (g)" value={customFood.carbs} onChange={e => setCustomFood(p => ({ ...p, carbs: e.target.value }))} className="input-field" />
            </div>
            <button onClick={handleAddCustomFood} className="btn-primary w-full">添加</button>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <div className="flex p-1 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
            <button onClick={() => { setSearchMode('local'); setApiResults([]); setSelectedApiFood(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${searchMode === 'local' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-white'}`}>
              内置数据
            </button>
            <button onClick={() => setSearchMode('api')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${searchMode === 'api' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-white'}`}>
              <Globe className="w-3.5 h-3.5" />
              FatSecret
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder={searchMode === 'api' ? "搜索全球食物数据库..." : "搜索食物..."} value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchMode === 'api' && handleApiSearch()}
              className="input-field pl-10" />
          </div>
          {searchMode === 'api' && (
            <button onClick={handleApiSearch} disabled={isSearching || !searchTerm.trim()} className="btn-primary disabled:opacity-50">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>搜索</span>
            </button>
          )}
        </div>

        {searchError && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-500">{searchError}</p>
          </div>
        )}

        {searchMode === 'local' && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {foodCategories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === category ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                  {category}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {filteredFoods.map(food => (
                <div key={food.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900">{food.name}</p>
                    <p className="text-xs text-slate-500">{food.calories} kcal/{food.per} · P:{food.protein} C:{food.carbs} F:{food.fat}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <input type="number" placeholder="100" value={customAmounts[food.id] || ''}
                      onChange={e => setCustomAmounts(p => ({ ...p, [food.id]: e.target.value }))}
                      className="w-14 input-field text-center text-xs py-1.5" />
                    <span className="text-[11px] text-slate-400">g</span>
                    <button onClick={() => handleAddFood(food)} className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-all">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {searchMode === 'api' && (
          <div className="space-y-1.5">
            {apiResults.length > 0 && !selectedApiFood && (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {apiResults.map(food => {
                  const nutrition = parseNutritionFromDescription(food.description);
                  return (
                    <div key={food.id} onClick={() => setSelectedApiFood(food)}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900">{food.name}</p>
                        {nutrition && <p className="text-xs text-slate-500">{nutrition.calories} kcal · P:{nutrition.protein} C:{nutrition.carbs} F:{nutrition.fat}</p>}
                      </div>
                      <Plus className="w-4 h-4 text-slate-500" />
                    </div>
                  );
                })}
              </div>
            )}
            {selectedApiFood && (
              <div className="p-4 rounded-xl animate-slide-up" style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-slate-900">{selectedApiFood.name}</h4>
                  <button onClick={() => setSelectedApiFood(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                {(() => {
                  const n = parseNutritionFromDescription(selectedApiFood.description);
                  if (!n) return null;
                  const ratio = (parseFloat(apiFoodAmount) || 100) / 100;
                  return (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { label: '热量', val: Math.round(n.calories * ratio), unit: 'kcal', color: '#f59e0b' },
                        { label: '蛋白质', val: Math.round(n.protein * ratio), unit: 'g', color: '#ef4444' },
                        { label: '碳水', val: Math.round(n.carbs * ratio), unit: 'g', color: '#f59e0b' },
                        { label: '脂肪', val: Math.round(n.fat * ratio), unit: 'g', color: '#3b82f6' },
                      ].map(item => (
                        <div key={item.label} className="text-center p-2 rounded-lg" style={{ background: '#f8fafc' }}>
                          <p className="text-[11px] text-slate-500">{item.label}</p>
                          <p className="font-bold text-sm" style={{ color: item.color }}>{item.val}</p>
                          <p className="text-[10px] text-slate-400">{item.unit}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">份量 (g)</label>
                    <input type="number" value={apiFoodAmount} onChange={e => setApiFoodAmount(e.target.value)} className="input-field text-center" />
                  </div>
                  <button onClick={handleAddApiFood} className="btn-primary mt-5">
                    <Plus className="w-4 h-4" />
                    添加到{mealTypes.find(m => m.id === selectedMeal)?.name}
                  </button>
                </div>
              </div>
            )}
            {apiResults.length === 0 && !isSearching && !selectedApiFood && (
              <div className="text-center py-10">
                <Globe className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">搜索 FatSecret 全球食物数据库</p>
                <p className="text-xs text-slate-400 mt-1">输入食物名称后点击搜索</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
          <div className="relative stat-card w-full max-w-md max-h-[85vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">身体数据</h2>
              <button onClick={() => setShowProfile(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2"><User className="w-4 h-4 inline mr-2" />姓名</label>
                <input type="text" value={userData.name} onChange={e => setUserData(p => ({ ...p, name: e.target.value }))} placeholder="你的名字" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2"><Calendar className="w-4 h-4 inline mr-2" />年龄</label>
                  <input type="number" value={userData.age} onChange={e => setUserData(p => ({ ...p, age: e.target.value }))} placeholder="25" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">性别</label>
                  <select value={userData.gender} onChange={e => setUserData(p => ({ ...p, gender: e.target.value }))} className="input-field">
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2"><Ruler className="w-4 h-4 inline mr-2" />身高 (cm)</label>
                  <input type="number" value={userData.height} onChange={e => setUserData(p => ({ ...p, height: e.target.value }))} placeholder="175" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2"><Scale className="w-4 h-4 inline mr-2" />体重 (kg)</label>
                  <input type="number" value={userData.weight} onChange={e => setUserData(p => ({ ...p, weight: e.target.value }))} placeholder="70" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2"><Activity className="w-4 h-4 inline mr-2" />活动水平</label>
                <select value={userData.activityLevel} onChange={e => setUserData(p => ({ ...p, activityLevel: e.target.value }))} className="input-field">
                  <option value="sedentary">久坐不动</option>
                  <option value="light">轻度活动 (1-3天/周)</option>
                  <option value="moderate">中度活动 (3-5天/周)</option>
                  <option value="active">高度活动 (6-7天/周)</option>
                  <option value="veryActive">极高活动</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2"><Target className="w-4 h-4 inline mr-2" />目标</label>
                <select value={userData.goal} onChange={e => setUserData(p => ({ ...p, goal: e.target.value }))} className="input-field">
                  <option value="lose">减脂 (-500 kcal)</option>
                  <option value="maintain">维持体重</option>
                  <option value="gain">增肌 (+300 kcal)</option>
                </select>
              </div>
              {userData?.weight && userData?.height && userData?.age && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                  <p className="text-sm text-slate-400 mb-1">基础代谢 (BMR)</p>
                  <p className="text-lg font-bold">{formatNumber(Math.round(calculateBMR(parseFloat(userData.weight), parseFloat(userData.height), parseInt(userData.age), userData.gender)))} kcal</p>
                  <p className="text-sm text-slate-400 mt-2">建议每日摄入</p>
                  <p className="text-xl font-bold text-blue-500">{formatNumber(calorieTarget)} kcal</p>
                  <p className="text-xs text-slate-500 mt-1">{goalLabels[userData.goal]}模式</p>
                </div>
              )}
              <button onClick={() => { setUserData(userData); setShowProfile(false); }} className="btn-primary w-full">保存数据</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
