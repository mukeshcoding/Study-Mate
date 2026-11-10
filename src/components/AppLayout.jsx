import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Home, ListTodo, Timer, GraduationCap, MoreHorizontal, BarChart3, StickyNote, User, Plus, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/lib/profileContext";
import QuickAdd from "@/components/QuickAdd";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/exams", label: "Exams", icon: GraduationCap },
  { to: "/more", label: "More", icon: MoreHorizontal },
];

const SIDEBAR_EXTRA = [
  { to: "/stats", label: "Statistics", icon: BarChart3 },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/habits", label: "Habits", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/30">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div className="leading-tight">
        <div className="font-heading font-extrabold text-[1.05rem] text-foreground tracking-tight">StudyMate</div>
        <div className="text-[0.65rem] text-muted-foreground -mt-0.5">Study smarter. Live better.</div>
      </div>
    </Link>
  );
}

function LevelPill() {
  const { profile } = useProfile();
  if (!profile) return null;
  return (
    <div className="glass-pill rounded-full px-3 py-1.5 flex items-center gap-1.5">
      <span className="text-[0.7rem] font-semibold text-violet-200">LVL {profile.level || 1}</span>
      <span className="w-1 h-1 rounded-full bg-violet-300/50" />
      <span className="text-[0.7rem] font-semibold text-indigo-200">{profile.xp || 0} XP</span>
    </div>
  );
}

function StreakBadge() {
  const { profile } = useProfile();
  if (!profile) return null;
  const s = profile.current_streak || 0;
  if (!s) return null;
  return (
    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
      <span className="text-base leading-none">🔥</span>
      <span className="text-[0.72rem] font-bold text-amber-300">{s}</span>
    </div>
  );
}

export default function AppLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Sticky top header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-extrabold text-foreground">StudyMate</span>
            </Link>
            <div className="flex items-center gap-2">
              <StreakBadge />
              <LevelPill />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28">
          <Outlet />
        </main>

        {/* Floating quick add */}
        <button
          onClick={() => setQuickOpen(true)}
          aria-label="Quick add"
          className="fixed right-5 bottom-28 z-40 w-14 h-14 rounded-full gradient-accent focus-glow flex items-center justify-center active:scale-95 transition"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {/* Floating glass bottom nav (iOS style) */}
        <nav className="fixed bottom-4 inset-x-4 z-30 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-2xl shadow-2xl shadow-black/30">
          <div className="flex items-stretch justify-around h-16 px-2">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <Link key={to} to={to} className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
                  <span className={`flex items-center justify-center w-9 h-7 rounded-full transition-all duration-200 ${active ? "bg-primary/15" : ""}`}>
                    <Icon className={active ? "w-5 h-5 text-primary" : "w-5 h-5 text-muted-foreground"} />
                  </span>
                  <span className={active ? "text-[0.62rem] font-semibold text-primary" : "text-[0.62rem] text-muted-foreground"}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
      </div>
    );
  }

  // Desktop
  const allNav = [...NAV.slice(0, 4), ...SIDEBAR_EXTRA];
  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-60 shrink-0 sticky top-0 h-screen border-r border-border bg-sidebar-background/60 flex flex-col">
        <div className="px-5 h-16 flex items-center border-b border-border">
          <Brand />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {allNav.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active ? "bg-indigo-500/15 text-indigo-300 font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="w-[1.05rem] h-[1.05rem]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <Link to="/focus" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted transition">
            <Timer className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-muted-foreground">Start a focus session</span>
          </Link>
          <div className="flex items-center justify-between px-2">
            <StreakBadge />
            <LevelPill />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen">
        <Outlet />
        <button
          onClick={() => setQuickOpen(true)}
          className="fixed right-6 bottom-6 z-40 h-12 px-5 rounded-full gradient-accent focus-glow flex items-center gap-2 active:scale-95 transition shadow-lg"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold text-white">Quick add</span>
        </button>
      </main>

      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
    </div>
  );
}