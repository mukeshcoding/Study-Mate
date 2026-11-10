import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useSubjects } from "@/lib/useSubjects";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, GraduationCap, CheckCircle2 } from "lucide-react";
import ExamDialog from "@/components/ExamDialog";
import CountdownLabel from "@/components/CountdownLabel";
import SubjectBadge from "@/components/SubjectBadge";
import EmptyState from "@/components/EmptyState";

export default function Exams() {
  const [params, setParams] = useSearchParams();
  const { subjects } = useSubjects();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const subjectColor = (id) => subjects.find((s) => s.id === id)?.color;

  const load = useCallback(async () => {
    try {
      const es = await base44.entities.Exam.list("-exam_date", 200);
      setExams(es || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.get("new") === "1") { setEditing(null); setDialogOpen(true); params.delete("new"); setParams(params, { replace: true }); }
  }, [params]);

  const upcoming = exams.filter((e) => !e.completed && new Date(e.exam_date) > new Date()).sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
  const completed = exams.filter((e) => e.completed || new Date(e.exam_date) <= new Date()).sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));

  const markDone = async (e) => {
    const updated = await base44.entities.Exam.update(e.id, { completed: true });
    setExams((p) => p.map((x) => (x.id === e.id ? updated : x)));
  };

  const onDelete = async () => {
    await base44.entities.Exam.delete(deleteId);
    setExams((p) => p.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " · " + new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground">Exams</h1>
          <p className="text-sm text-muted-foreground">Countdown to your next test</p>
        </div>
        <Button className="h-10 px-4" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[0,1].map((i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}</div>
      ) : (
        <>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Upcoming</h2>
            {upcoming.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No upcoming exams" description="Add an exam to see a live countdown and stay ahead." action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add exam</Button>} />
            ) : (
              <div className="space-y-3">
                {upcoming.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-semibold text-foreground">{e.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(e.exam_date)}</div>
                        {e.subject_name && <div className="mt-2"><SubjectBadge name={e.subject_name} color={subjectColor(e.subject_id)} /></div>}
                        {e.notes && <p className="text-sm text-muted-foreground mt-2">{e.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditing(e); setDialogOpen(true); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(e.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl bg-background/50 border border-border p-3 flex items-center justify-between">
                      <CountdownLabel target={e.exam_date} />
                      <Button variant="outline" size="sm" className="h-8" onClick={() => markDone(e)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Past</h2>
              <div className="space-y-2">
                {completed.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-border bg-card p-3.5 flex items-center justify-between opacity-70">
                    <div>
                      <div className="text-sm font-medium text-foreground line-through">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(e.exam_date)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(e); setDialogOpen(true); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(e.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ExamDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={(e) => { if (editing) setExams((p) => p.map((x) => (x.id === e.id ? e : x))); else setExams((p) => [...p, e]); }} exam={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exam?</AlertDialogTitle>
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