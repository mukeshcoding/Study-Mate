import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { appApi } from "@/api/appClient";
import { useProfile } from "@/lib/profileContext";
import { useSubjects } from "@/lib/useSubjects";
import { dayStr } from "@/lib/gamification";
import { PRIORITY_META } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, ListTodo, Check } from "lucide-react";
import TaskDialog from "@/components/TaskDialog";
import EmptyState from "@/components/EmptyState";
import SubjectBadge from "@/components/SubjectBadge";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

const startOfDay = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const endOfDay = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };

export default function Tasks() {
  const [params, setParams] = useSearchParams();
  const { awardXp, recordActivity, syncAchievements } = useProfile();
  const { subjects } = useSubjects();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("priority");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const subjectColor = (id) => subjects.find((s) => s.id === id)?.color;

  const load = useCallback(async () => {
    try {
      const ts = await appApi.entities.Task.list("-created_date", 500);
      setTasks(ts || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.get("new") === "1") { setEditing(null); setDialogOpen(true); params.delete("new"); setParams(params, { replace: true }); }
  }, [params]);

  const counts = useMemo(() => {
    const today = dayStr();
    const sod = startOfDay(), eod = endOfDay();
    return {
      all: tasks.filter((t) => !t.completed).length,
      today: tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) >= sod && new Date(t.due_date) <= eod).length,
      upcoming: tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) > eod).length,
      overdue: tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < sod).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    const sod = startOfDay(), eod = endOfDay();
    let list = [];
    if (filter === "all") list = tasks.filter((t) => !t.completed);
    else if (filter === "today") list = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) >= sod && new Date(t.due_date) <= eod);
    else if (filter === "upcoming") list = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) > eod);
    else if (filter === "overdue") list = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < sod);
    else if (filter === "completed") list = tasks.filter((t) => t.completed);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q) || (t.subject_name || "").toLowerCase().includes(q));
    }
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    list = [...list].sort((a, b) => {
      if (sort === "priority") return (order[a.priority] ?? 2) - (order[b.priority] ?? 2) || (a.due_date ? new Date(a.due_date) - new Date(b.due_date || "9999") : 0);
      if (sort === "due") return a.due_date ? new Date(a.due_date) - new Date(b.due_date || "9999") : 1;
      if (sort === "created") return new Date(b.created_date) - new Date(a.created_date);
      return 0;
    });
    return list;
  }, [tasks, filter, search, sort]);

  const toggleComplete = async (t) => {
    if (t.completed) {
      const updated = await appApi.entities.Task.update(t.id, { completed: false, completed_date: null });
      setTasks((p) => p.map((x) => (x.id === t.id ? updated : x)));
    } else {
      const updated = await appApi.entities.Task.update(t.id, { completed: true, completed_date: new Date().toISOString() });
      setTasks((p) => p.map((x) => (x.id === t.id ? updated : x)));
      await awardXp(10);
      await recordActivity();
      const completedCount = tasks.filter((x) => x.completed).length + 1;
      await syncAchievements({ tasksCompleted: completedCount, focusSessions: 0, habitsCompleted: 0 });
    }
  };

  const onDelete = async () => {
    await appApi.entities.Task.delete(deleteId);
    setTasks((p) => p.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  const fmtDue = (d) => {
    const dt = new Date(d);
    const now = new Date();
    const diff = dt - startOfDay();
    const todayDiff = new Date(dt).setHours(0,0,0,0) - startOfDay();
    const time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (todayDiff === 0) return `Today, ${time}`;
    if (todayDiff === 86400000) return `Tomorrow, ${time}`;
    if (todayDiff === -86400000) return `Yesterday, ${time}`;
    return dt.toLocaleDateString([], { month: "short", day: "numeric" }) + `, ${time}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">Stay on top of your work</p>
        </div>
        <Button className="h-10 px-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition ${filter === f.key ? "gradient-accent text-white border-transparent" : "border-border bg-card text-muted-foreground"}`}>
            {f.label} <span className="opacity-60">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-9 h-10 bg-card" />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-32 h-10 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="due">Due date</SelectItem>
            <SelectItem value="created">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-16 rounded-2xl animate-shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks here" description={filter === "completed" ? "Completed tasks will appear here." : "Tap Add to create your first task and start earning XP."} action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add task</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
            const overdue = !t.completed && t.due_date && new Date(t.due_date) < startOfDay();
            return (
              <div key={t.id} className={`rounded-2xl border bg-card p-3.5 flex items-start gap-3 transition ${t.completed ? "opacity-60" : ""}`}>
                <button onClick={() => toggleComplete(t)} className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${t.completed ? "gradient-accent border-transparent" : "border-border hover:border-indigo-500"}`}>
                  {t.completed && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</div>
                  {t.notes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.notes}</div>}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[0.62rem] font-medium ${pm.chip} border rounded-full px-1.5 py-0.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />{pm.label}
                    </span>
                    {t.subject_name && <SubjectBadge name={t.subject_name} color={subjectColor(t.subject_id)} size="xs" />}
                    {t.due_date && <span className={`text-[0.62rem] ${overdue ? "text-rose-400" : "text-muted-foreground"}`}>{fmtDue(t.due_date)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(t); setDialogOpen(true); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(t.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={(t) => { if (editing) setTasks((p) => p.map((x) => (x.id === t.id ? t : x))); else setTasks((p) => [t, ...p]); }} task={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-rose-500 hover:bg-rose-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}