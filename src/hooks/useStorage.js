import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export const useSupplementReminders = () => {
  const [reminders, setReminders] = useLocalStorage('supplementReminders', {});
  const [lastReminderTime, setLastReminderTime] = useLocalStorage('lastReminderTime', null);

  const markAsTaken = (supplementId) => {
    const today = new Date().toISOString().split('T')[0];
    setReminders(prev => ({
      ...prev,
      [supplementId]: {
        taken: true,
        time: new Date().toISOString(),
        date: today,
      },
    }));
  };

  const isTakenToday = (supplementId) => {
    const today = new Date().toISOString().split('T')[0];
    const record = reminders[supplementId];
    return record?.date === today && record?.taken;
  };

  const shouldRemind = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (lastReminderTime) {
      const lastTime = new Date(lastReminderTime);
      const diffHours = (now - lastTime) / (1000 * 60 * 60);
      if (diffHours < 2) return false;
    }

    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
  };

  const updateLastReminderTime = () => {
    setLastReminderTime(new Date().toISOString());
  };

  return {
    reminders,
    markAsTaken,
    isTakenToday,
    shouldRemind,
    updateLastReminderTime,
  };
};

export const useWorkoutHistory = () => {
  const [history, setHistory] = useLocalStorage('workoutHistory', []);

  const addWorkout = (workout) => {
    const newWorkout = {
      ...workout,
      id: Date.now(),
      date: new Date().toISOString(),
    };
    setHistory(prev => [...prev, newWorkout]);
    return newWorkout;
  };

  const getExerciseHistory = (exerciseId) => {
    return history.filter(w => w.exerciseId === exerciseId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getRecentWorkouts = (count = 10) => {
    return [...history]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, count);
  };

  const getWorkoutByDate = (date) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return history.filter(w => w.date.split('T')[0] === dateStr);
  };

  const getWeeklyVolume = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return history
      .filter(w => new Date(w.date) >= oneWeekAgo)
      .reduce((sum, w) => sum + (w.weight * w.reps * w.sets), 0);
  };

  return {
    history,
    addWorkout,
    getExerciseHistory,
    getRecentWorkouts,
    getWorkoutByDate,
    getWeeklyVolume,
  };
};

export const useFoodLog = () => {
  const [foodLog, setFoodLog] = useLocalStorage('foodLog', {});

  const addFoodEntry = (date, meal, entry) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    setFoodLog(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [meal]: [...(prev[dateStr]?.[meal] || []), { ...entry, id: Date.now() }],
      },
    }));
  };

  const removeFoodEntry = (date, meal, entryId) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    setFoodLog(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [meal]: (prev[dateStr]?.[meal] || []).filter(e => e.id !== entryId),
      },
    }));
  };

  const getDayLog = (date) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return foodLog[dateStr] || {};
  };

  const getDayTotals = (date) => {
    const dayLog = getDayLog(date);
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    Object.values(dayLog).forEach(meal => {
      meal.forEach(entry => {
        totalCalories += entry.calories || 0;
        totalProtein += entry.protein || 0;
        totalCarbs += entry.carbs || 0;
        totalFat += entry.fat || 0;
      });
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    };
  };

  return {
    foodLog,
    addFoodEntry,
    removeFoodEntry,
    getDayLog,
    getDayTotals,
  };
};
