// Gamification engine — pure helpers for XP, levels, streaks, achievements.

// Cumulative XP required to REACH a given level (level starts at 1).
// Level 1 = 0 XP, Level 2 = 100, Level 3 = 300, Level 4 = 600, Level 5 = 1000...
export const cumulativeForLevel = (level) => 50 * level * (level - 1);

export function levelFromXp(xp) {
  if (!xp || xp < 0) return 1;
  // solve 50*L*(L-1) <= xp  =>  L = (1 + sqrt(1 + xp/12.5)) / 2
  const level = Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
  return Math.max(1, level);
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const base = cumulativeForLevel(level);
  const next = cumulativeForLevel(level + 1);
  const span = next - base;
  const into = xp - base;
  return {
    level,
    intoLevel: into,
    span,
    progress: span > 0 ? into / span : 0,
    toNext: Math.max(0, next - xp),
    currentLevelStart: base,
    nextLevelTotal: next,
  };
}

export const XP_REWARDS = {
  task: 10,
  focus: 20,
  habit: 10,
  dailyGoal: 50,
  exam: 0,
};

// Date helpers (local time, YYYY-MM-DD)
export const dayStr = (d = new Date()) => {
  const x = new Date(d);
  const off = x.getTimezoneOffset();
  const local = new Date(x.getTime() - off * 60000);
  return local.toISOString().split("T")[0];
};

export const yesterdayStr = (d = new Date()) => {
  const x = new Date(d);
  x.setDate(x.getDate() - 1);
  return dayStr(x);
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Given current streak + last active day, compute new streak after activity today.
export function computeStreak({ currentStreak, lastDay, today = dayStr() }) {
  if (lastDay === today) {
    return { streak: currentStreak || 1, changed: false };
  }
  if (lastDay === yesterdayStr(today)) {
    return { streak: (currentStreak || 0) + 1, changed: true };
  }
  return { streak: 1, changed: true };
}

export const ACHIEVEMENTS = [
  { id: "first_task", name: "First Step", description: "Complete your first task", icon: "CheckCircle2" },
  { id: "first_focus", name: "In the Zone", description: "Finish your first focus session", icon: "Timer" },
  { id: "first_habit", name: "Habit Starter", description: "Complete a habit for the first time", icon: "Repeat" },
  { id: "streak_3", name: "On a Roll", description: "Reach a 3-day streak", icon: "Flame" },
  { id: "streak_7", name: "Week Warrior", description: "Reach a 7-day streak", icon: "Flame" },
  { id: "streak_30", name: "Unstoppable", description: "Reach a 30-day streak", icon: "Flame" },
  { id: "tasks_25", name: "Task Slayer", description: "Complete 25 tasks", icon: "ListTodo" },
  { id: "tasks_100", name: "Productivity Pro", description: "Complete 100 tasks", icon: "ListTodo" },
  { id: "focus_10", name: "Focus Master", description: "Finish 10 focus sessions", icon: "Timer" },
  { id: "focus_50", name: "Deep Diver", description: "Finish 50 focus sessions", icon: "Timer" },
  { id: "level_5", name: "Rising Scholar", description: "Reach level 5", icon: "TrendingUp" },
  { id: "level_10", name: "Academic Legend", description: "Reach level 10", icon: "TrendingUp" },
  { id: "xp_1000", name: "Century Club", description: "Earn 1000 total XP", icon: "Sparkles" },
  { id: "goal_met", name: "Goal Getter", description: "Hit your daily study goal", icon: "Target" },
];

// Returns array of achievement ids newly earned given a stats context.
export function evaluateAchievements(ctx) {
  const earned = new Set(ctx.earned || []);
  const newly = [];
  const has = (id) => { if (!earned.has(id) && check(id)) { earned.add(id); newly.push(id); } };

  const check = (id) => {
    switch (id) {
      case "first_task": return ctx.tasksCompleted >= 1;
      case "first_focus": return ctx.focusSessions >= 1;
      case "first_habit": return ctx.habitsCompleted >= 1;
      case "streak_3": return ctx.currentStreak >= 3;
      case "streak_7": return ctx.currentStreak >= 7;
      case "streak_30": return ctx.currentStreak >= 30;
      case "tasks_25": return ctx.tasksCompleted >= 25;
      case "tasks_100": return ctx.tasksCompleted >= 100;
      case "focus_10": return ctx.focusSessions >= 10;
      case "focus_50": return ctx.focusSessions >= 50;
      case "level_5": return levelFromXp(ctx.xp) >= 5;
      case "level_10": return levelFromXp(ctx.xp) >= 10;
      case "xp_1000": return ctx.xp >= 1000;
      case "goal_met": return !!ctx.goalMetToday;
      default: return false;
    }
  };

  ACHIEVEMENTS.forEach((a) => has(a.id));
  return newly;
}

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));