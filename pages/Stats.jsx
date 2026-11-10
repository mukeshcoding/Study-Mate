import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profileContext";
import { useSubjects } from "@/lib/useSubjects";
import { dayStr, addDays } from "@/lib/gamification";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Timer, CheckCircle2, ListTodo, Flame, TrendingUp, BookOpen, Award } from "lucide-react";
import { colorClasses } from "@/lib/colors";
import EmptyState from "@/components/EmptyState";

const CHART_COLORS = ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#F97316", "#14B8A6", "#3B82F6"];

export default function Stats() {
  const { profile } = useProfile();
  const { subjects } = useSubjects();
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("week"); // week | month

  useEffect(() => {
    Promise.all([
      base44.entities.StudySession.list("-created_date", 1000),
      base44.entities.Task.list("-created_date", 1000),
      base44.entities.HabitLog.list("-created_date", 1000),
      base44.entities.Habit.list("-created_date", 200),
    ]).then(([s, t, l, h]) => {
      setSessions(s || []); setTasks(t || []); setLogs(l || []); setHabits(h || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const days = range === "week" ? 7 : 30;
  const dayLabels = Array.from({ length: days }, (_, i) => dayStr(addDays(new Date(), -(days - 1 - i))));

  const dailyData = useMemo(() => dayLabels.map((d) => {
    const mins = sessions.filter((s) => dayStr(s.completed_at || s.started_at) === d).reduce((a, s) => a + (s.duration_minutes || 0), 0);
    return { day: new Date(d).toLocaleDateString([], { weekday: range === "week" ? "narrow" : "short", day: range === "month" ? "numeric" : undefined }), minutes: mins };
  }), [dayLabels, sessions, range]);

  const totalMinutes = dailyData.reduce((a, d) => a + d.minutes, 0);
  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const focusSessions = sessions.length;

  const bySubject = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = s.subject_name || "No subject";
      map[key] = (map[key] || 0) + (s.duration_minutes || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [sessions]);

  const habitCompletion = useMemo(() => {
    if (!habits.length) return 0;
    const totalPossible = habits.length * days;
    const done = logs.filter((l) => dayLabels.includes(l.date)).length;
    return totalPossible > 0 ? Math.round((done / totalPossible) * 100) : 0;
  }, [habits, logs, dayLabels, days]);

  if (loading) {
    return <div className="p-6 space-y-4"><div className="h-40 rounded-2xl animate-shimmer" /><div className="h-64 rounded-2xl animate-shimmer" /></div>;
  }

  const hasData = totalMinutes > 0 || tasksCompleted > 0 || focusSessions > 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground">Statistics</h1>
          <p className="text-sm text-muted-foreground">Your real study progress</p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-card border border-border">
          {["week", "month"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${range === r ? "gradient-accent text-white" : "text-muted-foreground"}`}>{r === "week" ? "7 days" : "30 days"}</button>
          ))}
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Timer, label: "Study time", value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, color: "text-indigo-300 bg-indigo-500/15" },
          { icon: CheckCircle2, label: "Tasks done", value: tasksCompleted, color: "text-emerald-300 bg-emerald-500/15" },
          { icon: BookOpen, label: "Focus sessions", value: focusSessions, color: "text-violet-300 bg-violet-500/15" },
          { icon: Flame, label: "Day streak", value: profile?.current_streak || 0, color: "text-amber-300 bg-amber-500/15" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <div className="font-heading font-extrabold text-xl text-foreground tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {!hasData ? (
        <EmptyState icon={TrendingUp} title="No data yet" description="Start a focus session or complete a task to see your stats come to life." />
      ) : (
        <>
          {/* Daily study time chart */}
          <div className="rounded-2xl border border-border bg-card p-5 mb-5">
            <h2 className="font-heading font-bold text-foreground mb-1">Study time</h2>
            <p className="text-xs text-muted-foreground mb-4">Minutes studied per day</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* By subject */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading font-bold text-foreground mb-1">By subject</h2>
              <p className="text-xs text-muted-foreground mb-4">Study time distribution</p>
              {bySubject.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No subject data yet.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={bySubject} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {bySubject.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-3">
                    {bySubject.slice(0, 5).map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{s.name}</span>
                        <span className="text-foreground font-medium">{Math.floor(s.value / 60)}h {s.value % 60}m</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-heading font-bold text-foreground">Overview</h2>
              <div className="space-y-3">
                <Row icon={Flame} label="Current streak" value={`${profile?.current_streak || 0} days`} />
                <Row icon={TrendingUp} label="Longest streak" value={`${profile?.longest_streak || 0} days`} />
                <Row icon={Award} label="Level" value={`LVL ${profile?.level || 1}`} />
                <Row icon={ListTodo} label="Habit completion" value={`${habitCompletion}%`} />
                <Row icon={CheckCircle2} label="Total XP" value={`${profile?.xp || 0}`} />
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Daily goal</span>
                  <span className="text-foreground font-medium">{Math.min(100, Math.round(((profile?.daily_study_day === dayStr() ? profile?.daily_study_minutes || 0 : 0) / (profile?.daily_goal_minutes || 120)) * 100))}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-accent rounded-full" style={{ width: `${Math.min(100, Math.round(((profile?.daily_study_day === dayStr() ? profile?.daily_study_minutes || 0 : 0) / (profile?.daily_goal_minutes || 120)) * 100))}%` }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="w-4 h-4" />{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}