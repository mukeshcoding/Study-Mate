import React, { useEffect, useState, useCallback } from "react";
import { appApi } from "@/api/appClient";
import { useProfile } from "@/lib/profileContext";
import { dayStr, addDays } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Check, Repeat, Flame } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { COLOR_OPTIONS, colorClasses } from "@/lib/colors";
import EmptyState from "@/components/EmptyState";

function HabitDialog({ open, onClose, onSaved, habit }) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [color, setColor] = useState("indigo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(habit?.name || ""); setFrequency(habit?.frequency || "daily"); setColor(habit?.color || "indigo"); }
  }, [open, habit]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), frequency, color, active: true, target_per_week: frequency === "daily" ? 7 : 3 };
      const result = habit ? await appApi.entities.Habit.update(habit.id, payload) : await appApi.entities.Habit.create(payload);
      onSaved(result); onClose();
    } catch (e) {} finally { setSaving(false); }
  };

  const body = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="h-name">Habit name</Label>
        <Input id="h-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 10 pages" autoFocus />
      </div>
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${colorClasses(c).dot} ${color === c ? "ring-2 ring-offset-2 ring-offset-card " + colorClasses(c).ring : ""}`} />
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="text-left pb-2"><DrawerTitle className="font-heading">{habit ? "Edit habit" : "New habit"}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-2">{body}</div>
          <DrawerFooter className="px-4 pb-6 pt-2 flex-row gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-11" disabled={saving || !name.trim()} onClick={save}>{habit ? "Save" : "Add"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-[420px]">
        <DialogHeader><DialogTitle className="font-heading">{habit ? "Edit habit" : "New habit"}</DialogTitle></DialogHeader>
        {body}
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-11" disabled={saving || !name.trim()} onClick={save}>{habit ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Habits() {
  const { awardXp, recordActivity, syncAchievements } = useProfile();
  const [habits, setHabits] = useState([]);
  const [logsByHabit, setLogsByHabit] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const today = dayStr();

  const load = useCallback(async () => {
    try {
      const hs = await appApi.entities.Habit.list("-created_date", 100);
      setHabits(hs || []);
      if (hs?.length) {
        const ids = hs.map((h) => h.id);
        const allLogs = await appApi.entities.HabitLog.filter({ habit_id: { $in: ids } });
        const map = {};
        (allLogs || []).forEach((l) => { (map[l.habit_id] = map[l.habit_id] || []).push(l); });
        setLogsByHabit(map);
      }
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const last7 = Array.from({ length: 7 }, (_, i) => dayStr(addDays(new Date(), -6 + i)));

  const computeStreak = (logs) => {
    if (!logs?.length) return { current: 0, longest: 0 };
    const dates = new Set(logs.map((l) => l.date));
    let current = 0; let longest = 0; let cursor = new Date();
    while (dates.has(dayStr(cursor))) { current++; cursor = addDays(cursor, -1); }
    // longest: iterate through sorted dates
    const sorted = [...dates].sort();
    let run = 0; let prev = null;
    for (const d of sorted) {
      if (prev && dayStr(addDays(new Date(prev), 1)) === d) run++; else run = 1;
      longest = Math.max(longest, run); prev = d;
    }
    return { current, longest: Math.max(longest, current) };
  };

  const toggleToday = async (h) => {
    const logs = logsByHabit[h.id] || [];
    const todays = logs.find((l) => l.date === today);
    if (todays) {
      await appApi.entities.HabitLog.delete(todays.id);
      setLogsByHabit((p) => ({ ...p, [h.id]: logs.filter((l) => l.id !== todays.id) }));
    } else {
      const created = await appApi.entities.HabitLog.create({ habit_id: h.id, date: today, completed: true });
      setLogsByHabit((p) => ({ ...p, [h.id]: [...(p[h.id] || []), created] }));
      await awardXp(10);
      await recordActivity();
      const allToday = await appApi.entities.HabitLog.filter({ date: today });
      await syncAchievements({ habitsCompleted: (allToday || []).length, focusSessions: 0, tasksCompleted: 0 });
    }
  };

  const onDelete = async () => {
    await appApi.entities.Habit.delete(deleteId);
    setHabits((p) => p.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground">Habits</h1>
          <p className="text-sm text-muted-foreground">Build streaks, one day at a time</p>
        </div>
        <Button className="h-10 px-4" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[0,1].map((i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}</div>
      ) : habits.length === 0 ? (
        <EmptyState icon={Repeat} title="No habits yet" description="Create a daily habit to start building a streak and earning XP." action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add habit</Button>} />
      ) : (
        <div className="space-y-3">
          {habits.map((h) => {
            const c = colorClasses(h.color);
            const logs = logsByHabit[h.id] || [];
            const { current, longest } = computeStreak(logs);
            const doneToday = logs.some((l) => l.date === today);
            return (
              <div key={h.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleToday(h)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${doneToday ? "gradient-accent border-transparent" : "border-border hover:border-indigo-500"}`}>
                    {doneToday && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span className="text-sm font-semibold text-foreground">{h.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400" />{current} day streak</span>
                      <span>Best: {longest}</span>
                      <span className="capitalize">{h.frequency}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(h); setDialogOpen(true); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(h.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* last 7 days */}
                <div className="flex items-center gap-1.5 mt-3">
                  {last7.map((d) => {
                    const on = logs.some((l) => l.date === d);
                    const isToday = d === today;
                    const label = new Date(d).toLocaleDateString([], { weekday: "narrow" });
                    return (
                      <div key={d} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[0.6rem] text-muted-foreground">{label}</span>
                        <div className={`w-full h-7 rounded-md ${on ? "gradient-accent" : "bg-muted/60"} ${isToday ? "ring-1 ring-indigo-500/50" : ""}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HabitDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={(h) => { if (editing) setHabits((p) => p.map((x) => (x.id === h.id ? h : x))); else setHabits((p) => [...p, h]); }} habit={editing} />
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete habit?</AlertDialogTitle><AlertDialogDescription>This removes the habit and its history.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-rose-500 hover:bg-rose-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}