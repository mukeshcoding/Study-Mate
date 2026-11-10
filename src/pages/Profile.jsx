import React, { useRef, useState } from "react";
import { appApi } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/profileContext";
import { useSubjects, invalidateSubjects } from "@/lib/useSubjects";
import { ACHIEVEMENTS, levelProgress } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Image as Img } from "@/components/ui/image";
import { Camera, Plus, Trash2, LogOut, Moon, Sun, Monitor, Loader2 } from "lucide-react";
import { COLOR_OPTIONS, colorClasses } from "@/lib/colors";
import { toast } from "@/components/ui/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { profile, updateProfile, refresh } = useProfile();
  const { subjects, refresh: refreshSubjects } = useSubjects();
  const fileRef = useRef(null);
  const [name, setName] = useState(profile?.full_name || "");
  const [education, setEducation] = useState(profile?.education_level || "");
  const [goal, setGoal] = useState(profile?.daily_goal_minutes || 120);
  const [theme, setTheme] = useState(profile?.theme || "dark");
  const [notifications, setNotifications] = useState(profile?.notifications_enabled !== false);
  const [newSubject, setNewSubject] = useState("");
  const [newColor, setNewColor] = useState("indigo");
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEducation(profile.education_level || "");
      setGoal(profile.daily_goal_minutes || 120);
      setTheme(profile.theme || "dark");
      setNotifications(profile.notifications_enabled !== false);
    }
  }, [profile]);

  if (!profile) return <div className="p-6"><div className="h-40 rounded-2xl animate-shimmer" /></div>;

  const lp = levelProgress(profile.xp || 0);
  const earned = new Set(profile.earned_achievements || []);

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await appApi.storage.uploadPublicFile({ file });
      await updateProfile({ avatar_url: file_url });
      toast({ title: "Photo updated" });
    } catch (err) { toast({ title: "Upload failed", description: err.message }); }
    finally { setUploading(false); }
  };

  const saveProfile = async () => {
    await updateProfile({ full_name: name.trim(), education_level: education, daily_goal_minutes: goal, theme, notifications_enabled: notifications });
    toast({ title: "Profile saved" });
  };

  const addSubject = async () => {
    const n = newSubject.trim();
    if (!n) return;
    await appApi.entities.Subject.create({ name: n, color: newColor });
    invalidateSubjects();
    refreshSubjects();
    setNewSubject("");
    toast({ title: "Subject added" });
  };

  const removeSubject = async (id) => {
    await appApi.entities.Subject.delete(id);
    invalidateSubjects();
    refreshSubjects();
  };

  const deleteAllData = async () => {
    setDeleting(true);
    try {
      await Promise.all([
        appApi.entities.Task.deleteMany({}),
        appApi.entities.Exam.deleteMany({}),
        appApi.entities.StudySession.deleteMany({}),
        appApi.entities.Habit.deleteMany({}),
        appApi.entities.HabitLog.deleteMany({}),
        appApi.entities.Note.deleteMany({}),
        appApi.entities.Subject.deleteMany({}),
      ]);
      await updateProfile({ xp: 0, level: 1, current_streak: 0, longest_streak: 0, last_study_day: null, daily_study_minutes: 0, daily_study_day: null, goal_met_day: null, earned_achievements: [] });
      invalidateSubjects();
      refreshSubjects();
      toast({ title: "All data deleted" });
      setDeleteOpen(false);
    } catch (e) { toast({ title: "Could not delete all data", description: e.message }); }
    finally { setDeleting(false); }
  };

  const logout = () => appApi.auth.logout(window.location.origin);

  const THEMES = [
    { key: "dark", label: "Dark", icon: Moon },
    { key: "light", label: "Light", icon: Sun },
    { key: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-4">
      <h1 className="font-heading font-extrabold text-2xl text-foreground mb-5">Profile & Settings</h1>

      {/* Profile card */}
      <div className="rounded-3xl border border-border bg-card p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center">
              {profile.avatar_url ? <Img src={profile.avatar_url} fittingType="fill" className="w-full h-full" /> : <span className="font-heading font-extrabold text-2xl gradient-text">{(name || user?.email || "S")[0].toUpperCase()}</span>}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full gradient-accent flex items-center justify-center border-2 border-card">
              {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-heading font-bold text-foreground">{name || "Set your name"}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="glass-pill rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-violet-200">LVL {lp.level}</span>
              <span className="text-[0.65rem] text-muted-foreground">{profile.xp || 0} XP</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Level {lp.level}</span><span>{lp.toNext} XP to {lp.level + 1}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-accent rounded-full" style={{ width: `${lp.progress * 100}%` }} /></div>
        </div>
      </div>

      {/* Details */}
      <Section title="Details">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Education level</Label>
            <Select value={education || "none"} onValueChange={(v) => setEducation(v === "none" ? "" : v)}>
              <SelectTrigger className="h-11 bg-background/50"><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {["High School", "Undergraduate", "Postgraduate", "Other"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Goal */}
      <Section title="Daily study goal">
        <div className="rounded-2xl bg-background/50 border border-border p-4">
          <div className="text-center mb-3">
            <span className="font-heading font-extrabold text-3xl gradient-text">{goal}</span>
            <span className="text-sm text-muted-foreground ml-1">min / day</span>
          </div>
          <Slider value={[goal]} onValueChange={(v) => setGoal(v[0])} min={15} max={480} step={15} />
          <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>15 min</span><span>8 hrs</span></div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTheme(key)} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition ${theme === key ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-border bg-background/50 text-muted-foreground"}`}>
              <Icon className="w-4 h-4" /><span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="flex items-center justify-between rounded-2xl bg-background/50 border border-border p-4">
          <div>
            <div className="text-sm font-medium text-foreground">Study reminders</div>
            <div className="text-xs text-muted-foreground">Daily nudges to keep your streak</div>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
      </Section>

      {/* Subjects */}
      <Section title="Subjects">
        <div className="flex flex-wrap gap-2 mb-3">
          {subjects.length === 0 && <p className="text-sm text-muted-foreground">No subjects yet.</p>}
          {subjects.map((s) => {
            const c = colorClasses(s.color);
            return (
              <span key={s.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${c.chip} text-sm`}>
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />{s.name}
                <button onClick={() => removeSubject(s.id)} className="ml-0.5 opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
              </span>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Add subject" className="h-10 bg-background/50" onKeyDown={(e) => e.key === "Enter" && addSubject()} />
          <div className="flex items-center gap-1 px-1 rounded-lg bg-background/50 border border-border">
            {COLOR_OPTIONS.slice(0, 6).map((c) => (
              <button key={c} onClick={() => setNewColor(c)} className={`w-5 h-5 rounded-full ${colorClasses(c).dot} ${newColor === c ? "ring-2 ring-offset-1 ring-offset-card ring-indigo-400" : ""}`} />
            ))}
          </div>
          <Button variant="outline" className="h-10 px-3" onClick={addSubject}><Plus className="w-4 h-4" /></Button>
        </div>
      </Section>

      {/* Achievements */}
      <Section title={`Achievements (${earned.size}/${ACHIEVEMENTS.length})`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const on = earned.has(a.id);
            return (
              <div key={a.id} className={`rounded-2xl border p-3 flex items-center gap-3 ${on ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-background/40 opacity-60"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${on ? "bg-amber-500/15" : "bg-muted"}`}>{on ? "🏆" : "🔒"}</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{a.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground truncate">{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Button className="w-full h-12 mt-5" onClick={saveProfile}>Save changes</Button>

      {/* Account */}
      <Section title="Account">
        <div className="space-y-2">
          <button onClick={logout} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition text-left">
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1"><div className="text-sm font-medium text-foreground">Log out</div><div className="text-xs text-muted-foreground">Sign out of StudyMate</div></div>
          </button>
          <button onClick={() => setDeleteOpen(true)} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition text-left">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <div className="flex-1"><div className="text-sm font-medium text-rose-400">Delete all my data</div><div className="text-xs text-muted-foreground">Remove tasks, exams, sessions, habits, notes & reset progress</div></div>
          </button>
        </div>
      </Section>

      <p className="text-center text-xs text-muted-foreground mt-6">StudyMate · Study smarter. Live better.</p>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all your data?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes all your tasks, exams, study sessions, habits, notes, subjects and resets your XP, streaks and achievements. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAllData} disabled={deleting} className="bg-rose-500 hover:bg-rose-600">{deleting ? "Deleting..." : "Delete everything"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">{title}</h2>
      {children}
    </div>
  );
}
