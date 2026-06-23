export const calculateBMR = (weight, height, age, gender) => {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
};

export const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
};

export const calculateCalorieTarget = (tdee, goal) => {
  switch (goal) {
    case 'lose':
      return Math.round(tdee - 500);
    case 'maintain':
      return Math.round(tdee);
    case 'gain':
      return Math.round(tdee + 300);
    default:
      return Math.round(tdee);
  }
};

export const calculateMacroSplit = (calories, goal) => {
  let proteinRatio, carbRatio, fatRatio;
  
  switch (goal) {
    case 'lose':
      proteinRatio = 0.4;
      carbRatio = 0.3;
      fatRatio = 0.3;
      break;
    case 'maintain':
      proteinRatio = 0.3;
      carbRatio = 0.4;
      fatRatio = 0.3;
      break;
    case 'gain':
      proteinRatio = 0.3;
      carbRatio = 0.45;
      fatRatio = 0.25;
      break;
    default:
      proteinRatio = 0.3;
      carbRatio = 0.4;
      fatRatio = 0.3;
  }

  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
  };
};

export const calculateProgressiveOverload = (exerciseHistory) => {
  if (!exerciseHistory || exerciseHistory.length < 2) {
    return null;
  }

  const recent = exerciseHistory.slice(-5);
  const avgWeight = recent.reduce((sum, e) => sum + e.weight, 0) / recent.length;
  const avgReps = recent.reduce((sum, e) => sum + e.reps, 0) / recent.length;
  const avgSets = recent.reduce((sum, e) => sum + e.sets, 0) / recent.length;

  const lastSession = recent[recent.length - 1];
  const isReadyForProgress = lastSession.reps >= lastSession.targetReps;

  if (isReadyForProgress) {
    const weightIncrement = lastSession.weight < 50 ? 2.5 : 5;
    return {
      suggestion: 'increase_weight',
      newWeight: lastSession.weight + weightIncrement,
      newReps: Math.max(6, lastSession.reps - 2),
      newSets: lastSession.sets,
      message: `太棒了！你已经完成目标次数，建议增加重量到 ${lastSession.weight + weightIncrement}kg`,
    };
  } else if (lastSession.reps < lastSession.targetReps - 2) {
    return {
      suggestion: 'maintain_or_decrease',
      newWeight: lastSession.weight,
      newReps: lastSession.targetReps,
      newSets: lastSession.sets,
      message: `继续努力！保持当前重量 ${lastSession.weight}kg，争取完成 ${lastSession.targetReps} 次`,
    };
  } else {
    return {
      suggestion: 'increase_reps',
      newWeight: lastSession.weight,
      newReps: lastSession.reps + 1,
      newSets: lastSession.sets,
      message: `接近目标！尝试多做 1 次，达到 ${lastSession.reps + 1} 次`,
    };
  }
};

export const generateTrainingPlan = (userData) => {
  const { experience, goal, daysPerWeek, feedback } = userData;

  const plans = {
    beginner: {
      lose: {
        3: [
          { day: '周一', focus: '全身训练A', exercises: ['深蹲', '卧推', '划船', '推举', '平板支撑'] },
          { day: '周三', focus: '全身训练B', exercises: ['硬拉', '上斜卧推', '高位下拉', '侧平举', '卷腹'] },
          { day: '周五', focus: '全身训练C', exercises: ['腿举', '哑铃卧推', '坐姿划船', '推举', '悬垂举腿'] },
        ],
        4: [
          { day: '周一', focus: '上肢推', exercises: ['卧推', '上斜卧推', '推举', '侧平举', '三头下压'] },
          { day: '周二', focus: '下肢', exercises: ['深蹲', '腿举', '腿弯举', '腿屈伸', '提踵'] },
          { day: '周四', focus: '上肢拉', exercises: ['划船', '高位下拉', '面拉', '弯举', '锤式弯举'] },
          { day: '周五', focus: '下肢+核心', exercises: ['硬拉', '弓步蹲', '腿举', '平板支撑', '卷腹'] },
        ],
      },
      gain: {
        3: [
          { day: '周一', focus: '胸部+三头', exercises: ['卧推', '上斜卧推', '哑铃飞鸟', '窄距卧推', '三头下压'] },
          { day: '周三', focus: '背部+二头', exercises: ['硬拉', '划船', '高位下拉', '杠铃弯举', '锤式弯举'] },
          { day: '周五', focus: '腿部+肩部', exercises: ['深蹲', '腿举', '推举', '侧平举', '提踵'] },
        ],
        4: [
          { day: '周一', focus: '胸部+二头', exercises: ['卧推', '上斜卧推', '哑铃飞鸟', '杠铃弯举', '锤式弯举'] },
          { day: '周二', focus: '背部+三头', exercises: ['硬拉', '划船', '高位下拉', '窄距卧推', '三头下压'] },
          { day: '周四', focus: '腿部', exercises: ['深蹲', '腿举', '腿弯举', '腿屈伸', '提踵'] },
          { day: '周五', focus: '肩部+核心', exercises: ['推举', '侧平举', '前平举', '反向飞鸟', '平板支撑'] },
        ],
      },
    },
    intermediate: {
      lose: {
        4: [
          { day: '周一', focus: '胸部+肩部', exercises: ['卧推', '上斜卧推', '哑铃飞鸟', '推举', '侧平举'] },
          { day: '周二', focus: '背部', exercises: ['硬拉', '划船', '高位下拉', '坐姿划船', '面拉'] },
          { day: '周四', focus: '腿部', exercises: ['深蹲', '腿举', '腿弯举', '腿屈伸', '提踵'] },
          { day: '周五', focus: '手臂+核心', exercises: ['杠铃弯举', '锤式弯举', '窄距卧推', '三头下压', '悬垂举腿'] },
        ],
        5: [
          { day: '周一', focus: '胸部', exercises: ['卧推', '上斜卧推', '哑铃飞鸟', '龙门架夹胸', '俯卧撑'] },
          { day: '周二', focus: '背部', exercises: ['硬拉', '划船', '高位下拉', '坐姿划船', '面拉'] },
          { day: '周三', focus: '腿部', exercises: ['深蹲', '前蹲', '腿举', '腿弯举', '提踵'] },
          { day: '周四', focus: '肩部', exercises: ['推举', '哑铃推举', '侧平举', '前平举', '反向飞鸟'] },
          { day: '周五', focus: '手臂+核心', exercises: ['杠铃弯举', '锤式弯举', '窄距卧推', '三头下压', '悬垂举腿'] },
        ],
      },
      gain: {
        4: [
          { day: '周一', focus: '胸部+三头', exercises: ['卧推', '上斜卧推', '哑铃飞鸟', '窄距卧推', '三头下压'] },
          { day: '周二', focus: '背部+二头', exercises: ['硬拉', '划船', '高位下拉', '杠铃弯举', '锤式弯举'] },
          { day: '周四', focus: '腿部', exercises: ['深蹲', '腿举', '腿弯举', '腿屈伸', '提踵'] },
          { day: '周五', focus: '肩部+核心', exercises: ['推举', '哑铃推举', '侧平举', '反向飞鸟', '平板支撑'] },
        ],
        5: [
          { day: '周一', focus: '胸部', exercises: ['卧推', '上斜卧推', '哑铃飞鸟', '龙门架夹胸', '双杠臂屈伸'] },
          { day: '周二', focus: '背部', exercises: ['硬拉', '划船', '高位下拉', '坐姿划船', '面拉'] },
          { day: '周三', focus: '腿部', exercises: ['深蹲', '前蹲', '腿举', '腿弯举', '提踵'] },
          { day: '周四', focus: '肩部', exercises: ['推举', '哑铃推举', '侧平举', '前平举', '反向飞鸟'] },
          { day: '周五', focus: '手臂+核心', exercises: ['杠铃弯举', '锤式弯举', '窄距卧推', '三头下压', '悬垂举腿'] },
        ],
      },
    },
  };

  const experienceLevel = experience === 'beginner' ? 'beginner' : 'intermediate';
  const goalType = goal === 'gain' ? 'gain' : 'lose';
  const days = Math.min(Math.max(daysPerWeek, 3), 5);

  return plans[experienceLevel]?.[goalType]?.[days] || plans[experienceLevel]?.[goalType]?.[3] || plans.beginner.lose[3];
};

export const formatNumber = (num) => {
  return num?.toLocaleString() || '0';
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了，注意休息';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

export const getDaysSince = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getNextSupplementTime = (supplement) => {
  const now = new Date();
  const hour = now.getHours();

  if (supplement.times.includes('morning') && hour < 10) {
    return '早餐时';
  }
  if (supplement.times.includes('pre-workout')) {
    return '训练前30分钟';
  }
  if (supplement.times.includes('post-workout')) {
    return '训练后30分钟内';
  }
  if (supplement.times.includes('evening') && hour < 22) {
    return '晚餐时';
  }
  return '明天';
};
