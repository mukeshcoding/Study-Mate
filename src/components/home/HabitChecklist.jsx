import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Repeat } from "lucide-react";
import { useProfile } from "@/lib/profileContext";
import { useSubjects } from "@/lib/useSubjects";
import { colorClasses } from "@/lib/colors";
import { dayStr } from "@/lib/gamification";

export default function HabitChecklist() {
  const { profile, awardXp, recordActivity, syncAchievements } = useProfile();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const today = dayStr();

  const load = async () => {
    try {
      const hs = await base44.entities.Habit.filter({ active: true });
      setHabits(hs || []);
      if (hs?.length) {
        const ids = hs.map((h) => h.id);
        const allLogs = await base44.entities.HabitLog.filter({ habit_id: { $in: ids }, date: today });
        const map = {};
        (allLogs || []).forEach((l) => { map[l.habit_id] = l; });
        setLogs(map);
      }
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (h) => {
    const existing = logs[h.id];
    if (existing) {
      setLogs((p) => { const n = { ...p }; delete n[h.id]; return n; });
      await base44.entities.HabitLog.delete(existing.id);
    } else {
      const created = await base44.entities.HabitLog.create({ habit_id: h.id, date: today, completed: true });
      setLogs((p) => ({ ...p, [h.id]: created }));
      await awardXp(10);
      await recordActivity();
      const completed = Object.values({ ...logs, [h.id]: created }).length;
      await syncAchievements({ habitsCompleted: completed, focusSessions: 0, tasksCompleted: 0 });
    }
  };

  const done = Object.keys(logs).length;

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-emerald-400" />
          <h3 className="font-heading font-bold text-foreground">Today's habits</h3>
        </div>
        <span className="text-xs text-muted-foreground">{done}/{habits.length || 0}</span>
      </div>
      {loading ? (
        <div className="space-y-2">{[0,1,2].map((i) => <div key={i} className="h-10 rounded-xl animate-shimmer" />)}</div>
      ) : habits.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No habits yet. Build a streak in the Habits tab.</p>
      ) : (
        <div className="space-y-1.5">
          {habits.map((h) => {
            const on = !!logs[h.id];
            const c = colorClasses(h.color);
            return (
              <button key={h.id} onClick={() => toggle(h)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition text-left">
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${on ? "gradient-accent border-transparent" : "border-border"}`}>
                  {on && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                <span className={`text-sm font-medium ${on ? "text-muted-foreground line-through" : "text-foreground"}`}>{h.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}