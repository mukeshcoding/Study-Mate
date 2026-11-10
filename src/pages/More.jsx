import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appApi } from "@/api/appClient";
import { useProfile } from "@/lib/profileContext";
import { ACHIEVEMENTS } from "@/lib/gamification";
import { BarChart3, StickyNote, BookOpen, User, Award, ChevronRight, BookMarked } from "lucide-react";

const LINKS = [
  { to: "/stats", label: "Statistics", desc: "Your study analytics", icon: BarChart3, color: "text-indigo-300 bg-indigo-500/15 border-indigo-500/30" },
  { to: "/habits", label: "Habits", desc: "Build daily routines", icon: BookOpen, color: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
  { to: "/notes", label: "Notes", desc: "Capture ideas & revision", icon: StickyNote, color: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
  { to: "/profile", label: "Profile & Settings", desc: "Account, theme, goals", icon: User, color: "text-violet-300 bg-violet-500/15 border-violet-500/30" },
];

export default function More() {
  const { profile } = useProfile();
  const [subjectsCount, setSubjectsCount] = useState(0);

  useEffect(() => {
    appApi.entities.Subject.list().then((s) => setSubjectsCount((s || []).length)).catch(() => {});
  }, []);

  const earned = new Set(profile?.earned_achievements || []);
  const earnedCount = earned.size;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-4">
      <h1 className="font-heading font-extrabold text-2xl text-foreground mb-1">More</h1>
      <p className="text-sm text-muted-foreground mb-5">Everything else in your study space</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {LINKS.map(({ to, label, desc, icon: Icon, color }) => (
          <Link key={to} to={to} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 hover:border-indigo-500/40 transition group">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-heading font-semibold text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      {/* Achievements preview */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="font-heading font-bold text-foreground">Achievements</h2>
          </div>
          <span className="text-xs text-muted-foreground">{earnedCount}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const on = earned.has(a.id);
            return (
              <div key={a.id} className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-center p-1 ${on ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-muted/30 opacity-50"}`} title={a.name}>
                <span className="text-lg">{on ? "🏆" : "🔒"}</span>
              </div>
            );
          })}
        </div>
        <Link to="/profile" className="text-xs text-indigo-400 font-medium mt-3 inline-block">View all in profile →</Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center"><BookMarked className="w-4 h-4 text-indigo-300" /></div>
          <div>
            <div className="font-heading font-semibold text-foreground text-sm">Subjects</div>
            <div className="text-xs text-muted-foreground">{subjectsCount} subjects</div>
          </div>
        </div>
        <Link to="/profile" className="text-xs text-indigo-400 font-medium">Manage →</Link>
      </div>
    </div>
  );
}