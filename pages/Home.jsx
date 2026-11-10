import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profileContext";
import { useSubjects } from "@/lib/useSubjects";
import { dayStr } from "@/lib/gamification";
import HomeHero from "@/components/home/HomeHero";
import FocusLaunchpad from "@/components/home/FocusLaunchpad";
import ExamCountdownCard from "@/components/home/ExamCountdownCard";
import HabitChecklist from "@/components/home/HabitChecklist";
import TodayTasksPreview from "@/components/home/TodayTasksPreview";

const startOfDay = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); };
const endOfDay = () => { const d = new Date(); d.setHours(23,59,59,999); return d.toISOString(); };

export default function Home() {
  const { profile, awardXp, recordActivity, syncAchievements } = useProfile();
  const { subjects } = useSubjects();
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const subjectColor = (id) => subjects.find((s) => s.id === id)?.color;

  const load = useCallback(async () => {
    try {
      const [ts, ex] = await Promise.all([
        base44.entities.Task.list("-created_date", 200),
        base44.entities.Exam.filter({ completed: false }, "exam_date", 50),
      ]);
      setTasks(ts || []);
      const upcoming = (ex || []).filter((e) => new Date(e.exam_date).getTime() > Date.now()).sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
      setExams(upcoming);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = dayStr();
  const studyMinutesToday = profile?.daily_study_day === today ? (profile?.daily_study_minutes || 0) : 0;

  const todays = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) <= new Date(endOfDay()) && new Date(t.due_date) >= new Date(startOfDay()));
  const overdue = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < new Date(startOfDay()));
  const noDate = tasks.filter((t) => !t.completed && !t.due_date);
  const previewTasks = [...overdue, ...todays, ...noDate];
  const tasksDoneToday = tasks.filter((t) => t.completed && t.completed_date && dayStr(t.completed_date) === today).length;
  const tasksTotalToday = previewTasks.length + tasksDoneToday;

  const nextExam = exams[0] ? { ...exams[0], color: subjectColor(exams[0].subject_id) } : null;

  const toggleTask = async (t) => {
    const updated = await base44.entities.Task.update(t.id, { completed: true, completed_date: new Date().toISOString() });
    setTasks((p) => p.map((x) => (x.id === t.id ? updated : x)));
    await awardXp(10);
    await recordActivity();
    const completedCount = tasks.filter((x) => x.completed).length + 1;
    await syncAchievements({ tasksCompleted: completedCount, focusSessions: 0, habitsCompleted: 0 });
  };

  if (loading || !profile) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-48 rounded-3xl animate-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 rounded-3xl animate-shimmer" />
          <div className="h-40 rounded-3xl animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <HomeHero studyMinutesToday={studyMinutesToday} tasksDoneToday={tasksDoneToday} tasksTotalToday={tasksTotalToday} />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <TodayTasksPreview tasks={previewTasks} onToggle={toggleTask} />
          <FocusLaunchpad />
        </div>
        <div className="space-y-4">
          <ExamCountdownCard exam={nextExam} />
          <HabitChecklist />
        </div>
      </div>
    </div>
  );
}