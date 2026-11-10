import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ChevronRight } from "lucide-react";
import CountdownLabel from "@/components/CountdownLabel";
import SubjectBadge from "@/components/SubjectBadge";
import { colorClasses } from "@/lib/colors";

export default function ExamCountdownCard({ exam }) {
  if (!exam) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-violet-400" />
          <h3 className="font-heading font-bold text-foreground">Upcoming exam</h3>
        </div>
        <p className="text-sm text-muted-foreground">No exams scheduled. Add one to see a live countdown.</p>
        <Link to="/exams?new=1" className="text-xs text-indigo-400 font-medium mt-2 inline-block">Add exam →</Link>
      </div>
    );
  }
  const c = colorClasses(exam.color);
  return (
    <Link to="/exams" className="block rounded-3xl border border-border bg-card p-5 hover:border-indigo-500/40 transition group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-violet-400" />
          <h3 className="font-heading font-bold text-foreground">Next exam</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
      </div>
      <div className="mb-3">
        <div className="font-heading font-semibold text-foreground">{exam.title}</div>
        {exam.subject_name && <div className="mt-1"><SubjectBadge name={exam.subject_name} color={exam.color} /></div>}
      </div>
      <div className="rounded-2xl bg-background/50 border border-border p-3">
        <CountdownLabel target={exam.exam_date} />
      </div>
    </Link>
  );
}