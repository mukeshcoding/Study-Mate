import React, { useEffect, useState } from "react";
import { appApi } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubjects } from "@/lib/useSubjects";
import { PRIORITY_META } from "@/lib/colors";

function toLocalInput(d) {
  if (!d) return "";
  const x = new Date(d);
  const off = x.getTimezoneOffset();
  return new Date(x.getTime() - off * 60000).toISOString().slice(0, 16);
}

function Form({ title, setTitle, notes, setNotes, due, setDue, priority, setPriority, subjectId, setSubjectId, subjects }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="t-title">Title</Label>
        <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need to do?" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="t-due">Due date & time</Label>
          <Input id="t-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${v.dot}`} />{v.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Label htmlFor="t-notes">Notes</Label>
        <Textarea id="t-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details..." rows={3} />
      </div>
    </div>
  );
}

export default function TaskDialog({ open, onClose, onSaved, task }) {
  const isMobile = useIsMobile();
  const { subjects } = useSubjects();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subjectId, setSubjectId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title || "");
      setNotes(task?.notes || "");
      setDue(task?.due_date ? toLocalInput(task.due_date) : "");
      setPriority(task?.priority || "medium");
      setSubjectId(task?.subject_id || "");
    }
  }, [open, task]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const subj = subjects.find((s) => s.id === subjectId);
    const payload = {
      title: title.trim(),
      notes: notes.trim(),
      due_date: due ? new Date(due).toISOString() : null,
      priority,
      subject_id: subjectId || null,
      subject_name: subj?.name || null,
    };
    try {
      let result;
      if (task) result = await appApi.entities.Task.update(task.id, payload);
      else result = await appApi.entities.Task.create({ ...payload, completed: false });
      onSaved(result);
      onClose();
    } catch (e) {} finally { setSaving(false); }
  };

  const formProps = { title, setTitle, notes, setNotes, due, setDue, priority, setPriority, subjectId, setSubjectId, subjects };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="font-heading">{task ? "Edit task" : "New task"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 max-h-[70vh] overflow-y-auto"><Form {...formProps} /></div>
          <DrawerFooter className="px-4 pb-6 pt-2 flex-row gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-11" disabled={saving || !title.trim()} onClick={save}>{task ? "Save" : "Add task"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-heading">{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <Form {...formProps} />
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-11" disabled={saving || !title.trim()} onClick={save}>{task ? "Save" : "Add task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}