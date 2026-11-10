import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubjects } from "@/lib/useSubjects";

function toLocalInput(d) {
  if (!d) return "";
  const x = new Date(d);
  const off = x.getTimezoneOffset();
  return new Date(x.getTime() - off * 60000).toISOString().slice(0, 16);
}

function Form({ title, setTitle, examDate, setExamDate, subjectId, setSubjectId, notes, setNotes, subjects }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="e-title">Exam title</Label>
        <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Exam" autoFocus />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="e-date">Date & time</Label>
          <Input id="e-date" type="datetime-local" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="e-notes">Notes</Label>
        <Textarea id="e-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Topics, location, what to bring..." rows={3} />
      </div>
    </div>
  );
}

export default function ExamDialog({ open, onClose, onSaved, exam }) {
  const isMobile = useIsMobile();
  const { subjects } = useSubjects();
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(exam?.title || "");
      setExamDate(exam?.exam_date ? toLocalInput(exam.exam_date) : "");
      setSubjectId(exam?.subject_id || "");
      setNotes(exam?.notes || "");
    }
  }, [open, exam]);

  const save = async () => {
    if (!title.trim() || !examDate) return;
    setSaving(true);
    const subj = subjects.find((s) => s.id === subjectId);
    const payload = {
      title: title.trim(),
      exam_date: new Date(examDate).toISOString(),
      subject_id: subjectId || null,
      subject_name: subj?.name || null,
      notes: notes.trim(),
    };
    try {
      const result = exam ? await base44.entities.Exam.update(exam.id, payload) : await base44.entities.Exam.create({ ...payload, completed: false });
      onSaved(result);
      onClose();
    } catch (e) {} finally { setSaving(false); }
  };

  const formProps = { title, setTitle, examDate, setExamDate, subjectId, setSubjectId, notes, setNotes, subjects };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="text-left pb-2"><DrawerTitle className="font-heading">{exam ? "Edit exam" : "New exam"}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-2 max-h-[70vh] overflow-y-auto"><Form {...formProps} /></div>
          <DrawerFooter className="px-4 pb-6 pt-2 flex-row gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-11" disabled={saving || !title.trim() || !examDate} onClick={save}>{exam ? "Save" : "Add exam"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-[480px]">
        <DialogHeader><DialogTitle className="font-heading">{exam ? "Edit exam" : "New exam"}</DialogTitle></DialogHeader>
        <Form {...formProps} />
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-11" disabled={saving || !title.trim() || !examDate} onClick={save}>{exam ? "Save" : "Add exam"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}