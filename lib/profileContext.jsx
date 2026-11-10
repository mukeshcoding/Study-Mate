import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  levelFromXp, levelProgress, computeStreak, dayStr, yesterdayStr,
  evaluateAchievements, ACHIEVEMENT_MAP, XP_REWARDS,
} from "@/lib/gamification";
import { toast } from "@/components/ui/use-toast";

const DEFAULT_PROFILE = {
  xp: 0,
  level: 1,
  current_streak: 0,
  longest_streak: 0,
  last_study_day: null,
  daily_goal_minutes: 120,
  daily_study_minutes: 0,
  daily_study_day: null,
  goal_met_day: null,
  education_level: "",
  full_name: "",
  avatar_url: "",
  theme: "dark",
  notifications_enabled: true,
  focus_preset: "25/5",
  onboarding_complete: false,
  earned_achievements: [],
};

const ProfileContext = createContext(null);

function readProfile(me) {
  if (!me) return { ...DEFAULT_PROFILE };
  const src = { ...(me.data || {}), ...me };
  const p = {};
  for (const k of Object.keys(DEFAULT_PROFILE)) {
    if (src[k] !== undefined && src[k] !== null) p[k] = src[k];
  }
  return { ...DEFAULT_PROFILE, ...p };
}

function applyTheme(theme) {
  const root = document.documentElement;
  const apply = (dark) => {
    if (dark) root.classList.remove("light");
    else root.classList.add("light");
  };
  if (theme === "light") apply(false);
  else if (theme === "dark") apply(true);
  else {
    // system
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches);
  }
}

export function ProfileProvider({ children }) {
  const { user, isAuthenticated, authChecked } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const meRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      meRef.current = me;
      const p = readProfile(me);
      setProfile(p);
      applyTheme(p.theme);
      return p;
    } catch (e) {
      setProfile({ ...DEFAULT_PROFILE });
      return DEFAULT_PROFILE;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked && isAuthenticated) refresh();
    else if (authChecked && !isAuthenticated) { setProfile(null); setLoading(false); }
  }, [authChecked, isAuthenticated, refresh]);

  // React to system theme changes when in system mode
  useEffect(() => {
    if (!profile || profile.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [profile?.theme]);

  const persist = useCallback(async (partial) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      try { base44.auth.updateMe(partial); } catch (e) { /* ignore */ }
      return next;
    });
  }, []);

  const updateProfile = useCallback(async (partial) => {
    if (partial.theme) applyTheme(partial.theme);
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      if (next.xp !== prev?.xp) next.level = levelFromXp(next.xp);
      try { base44.auth.updateMe({ ...partial, level: next.level }); } catch (e) {}
      return next;
    });
  }, []);

  const awardXp = useCallback(async (amount) => {
    if (!amount) return;
    setProfile((prev) => {
      if (!prev) return prev;
      const xp = (prev.xp || 0) + amount;
      const level = levelFromXp(xp);
      const leveledUp = level > (prev.level || 1);
      try { base44.auth.updateMe({ xp, level }); } catch (e) {}
      if (leveledUp) {
        toast({ title: `Level ${level} reached!`, description: "Keep up the great work." });
      }
      return { ...prev, xp, level };
    });
  }, []);

  const recordActivity = useCallback(async () => {
    const today = dayStr();
    let result = { streak: 1, changed: false };
    setProfile((prev) => {
      if (!prev) return prev;
      const { streak, changed } = computeStreak({
        currentStreak: prev.current_streak || 0,
        lastDay: prev.last_study_day,
        today,
      });
      result = { streak, changed };
      const longest = Math.max(prev.longest_streak || 0, streak);
      const partial = { current_streak: streak, longest_streak: longest, last_study_day: today };
      try { base44.auth.updateMe(partial); } catch (e) {}
      return { ...prev, ...partial };
    });
    return result;
  }, []);

  const addDailyStudy = useCallback(async (minutes) => {
    const today = dayStr();
    let result = { dailyMinutes: minutes, goalMet: false };
    setProfile((prev) => {
      if (!prev) return prev;
      const sameDay = prev.daily_study_day === today;
      const dailyMinutes = (sameDay ? prev.daily_study_minutes || 0 : 0) + minutes;
      const goal = prev.daily_goal_minutes || 120;
      const wasMet = prev.goal_met_day === today;
      const goalMet = !wasMet && dailyMinutes >= goal;
      result = { dailyMinutes, goalMet };
      const partial = { daily_study_minutes: dailyMinutes, daily_study_day: today };
      if (goalMet) partial.goal_met_day = today;
      try { base44.auth.updateMe(partial); } catch (e) {}
      return { ...prev, ...partial };
    });
    return result;
  }, []);

  const syncAchievements = useCallback(async (stats) => {
    let newly = [];
    setProfile((prev) => {
      if (!prev) return prev;
      const ctx = {
        xp: prev.xp || 0,
        currentStreak: prev.current_streak || 0,
        earned: prev.earned_achievements || [],
        tasksCompleted: stats.tasksCompleted || 0,
        focusSessions: stats.focusSessions || 0,
        habitsCompleted: stats.habitsCompleted || 0,
        goalMetToday: prev.goal_met_day === dayStr(),
      };
      newly = evaluateAchievements(ctx);
      if (!newly.length) return prev;
      const earned = [...(prev.earned_achievements || []), ...newly];
      try { base44.auth.updateMe({ earned_achievements: earned }); } catch (e) {}
      return { ...prev, earned_achievements: earned };
    });
    newly.forEach((id) => {
      const a = ACHIEVEMENT_MAP[id];
      if (a) toast({ title: `Achievement unlocked: ${a.name}`, description: a.description });
    });
    return newly;
  }, []);

  const value = {
    profile,
    loading,
    refresh,
    updateProfile,
    awardXp,
    recordActivity,
    addDailyStudy,
    syncAchievements,
    levelProgress: profile ? levelProgress(profile.xp || 0) : null,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

export { XP_REWARDS };