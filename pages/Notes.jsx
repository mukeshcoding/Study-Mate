import React, { useEffect, useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useSubjects } from "@/lib/useSubjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Pin, StickyNote, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import SubjectBadge from "@/components/SubjectBadge";
import EmptyState from "@/components/EmptyState";

function NoteDialog({ open, onClose, onSaved, note }) {
  const isMobile = useIsMobile();
  const { subjects } = useSubjects();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setTitle(note?.title || ""); setContent(note?.content || ""); setSubjectId(note?.subject_id || ""); setPinned(!!note?.pinned); }
  }, [open, note]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const subj = subjects.find((s) => s.id === subjectId);
    const payload = { title: title.trim(), content: content.trim(), subject_id: subjectId || null, subject_name: subj?.name || null, pinned };
    try {
      const result = note ? await base44.entities.Note.update(note.id, payload) : await base44.entities.Note.create(payload);
      onSaved(result); onClose();
    } catch (e) {} finally { setSaving(false); }
  };

  const body = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="n-title">Title</Label>
        <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" autoFocus />
      </div>
      <div className="space-y-2">
        <Label>Subject</Label>
        <Select value={subjectId || "none"} onValueChange={(v) => setSubjectId(v === "none" ? "" : v)}>
          <SelectTrigger className="h-10"><SelectValue placeholder="No subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No subject</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="n-content">Content</Label>
        <Textarea id="n-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your note..." rows={6} />
      </div>
      <button onClick={() => setPinned((p) => !p)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${pinned ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-border text-muted-foreground"}`}>
        <Pin className="w-4 h-4" /> {pinned ? "Pinned" : "Pin this note"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="text-left pb-2"><DrawerTitle className="font-heading">{note ? "Edit note" : "New note"}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-2 max-h-[70vh] overflow-y-auto">{body}</div>
          <DrawerFooter className="px-4 pb-6 pt-2 flex-row gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-11" disabled={saving || !title.trim()} onClick={save}>{note ? "Save" : "Add"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-[480px]">
        <DialogHeader><DialogTitle className="font-heading">{note ? "Edit note" : "New note"}</DialogTitle></DialogHeader>
        {body}
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-11" disabled={saving || !title.trim()} onClick={save}>{note ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Notes() {
  const { subjects } = useSubjects();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const subjectColor = (id) => subjects.find((s) => s.id === id)?.color;

  const load = useCallback(async () => {
    try {
      const ns = await base44.entities.Note.list("-created_date", 200);
      setNotes(ns || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...notes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q) || (n.subject_name || "").toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.created_date) - new Date(a.created_date));
  }, [notes, search]);

  const togglePin = async (n) => {
    const updated = await base44.entities.Note.update(n.id, { pinned: !n.pinned });
    setNotes((p) => p.map((x) => (x.id === n.id ? updated : x)));
  };

  const onDelete = async () => {
    await base44.entities.Note.delete(deleteId);
    setNotes((p) => p.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground">Notes</h1>
          <p className="text-sm text-muted-foreground">Capture and pin your revision</p>
        </div>
        <Button className="h-10 px-4" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="pl-9 h-10 bg-card" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[0,1,2,3].map((i) => <div key={i} className="h-32 rounded-2xl animate-shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Jot down ideas, formulas, or summaries. Pin the important ones." action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add note</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((n) => (
            <div key={n.id} className={`rounded-2xl border bg-card p-4 flex flex-col ${n.pinned ? "border-amber-500/40" : "border-border"}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-semibold text-foreground flex-1">{n.title}</h3>
                <button onClick={() => togglePin(n)} className={`p-1.5 rounded-lg ${n.pinned ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}`}><Pin className={`w-3.5 h-3.5 ${n.pinned ? "fill-amber-400" : ""}`} /></button>
              </div>
              {n.content && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-4 whitespace-pre-wrap">{n.content}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                {n.subject_name ? <SubjectBadge name={n.subject_name} color={subjectColor(n.subject_id)} size="xs" /> : <span className="text-[0.65rem] text-muted-foreground">{new Date(n.created_date).toLocaleDateString()}</span>}
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(n); setDialogOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(n.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={(n) => { if (editing) setNotes((p) => p.map((x) => (x.id === n.id ? n : x))); else setNotes((p) => [n, ...p]); }} note={editing} />
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete note?</AlertDialogTitle><AlertDialogDescription>This can't be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-rose-500 hover:bg-rose-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}