import React from "react";
import { Link } from "react-router-dom";
import { Check, ListTodo, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profileContext";
import SubjectBadge from "@/components/SubjectBadge";
import { PRIORITY_META } from "@/lib/colors";
import { useSubjects } from "@/lib/useSubjects";

export default function TodayTasksPreview({ tasks, onToggle }) {
  const { subjects } = useSubjects();
  const subjectColor = (id) => subjects.find((s) => s.id === id)?.color;

  const sorted = [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    })
    .slice(0, 3);

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-indigo-400" />
          <h3 className="font-heading font-bold text-foreground">Today's priorities</h3>
        </div>
        <Link to="/tasks" className="text-xs text-indigo-400 font-medium flex items-center gap-0.5">All <ChevronRight className="w-3 h-3" /></Link>
      </div>
      {sorted.length === 0 ? (
        <div className="py-3">
          <p className="text-sm text-muted-foreground">No pending tasks for today. Enjoy the calm — or plan ahead.</p>
          <Link to="/tasks?new=1" className="text-xs text-indigo-400 font-medium mt-2 inline-block">Add a task →</Link>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((t) => {
            const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
            return (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition">
                <button onClick={() => onToggle(t)} aria-label="Complete task" className="w-5 h-5 rounded-md border-2 border-border hover:border-indigo-500 transition shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[0.62rem] font-medium ${pm.chip} border rounded-full px-1.5 py-0.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />{pm.label}
                    </span>
                    {t.subject_name && <SubjectBadge name={t.subject_name} color={subjectColor(t.subject_id)} size="xs" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}