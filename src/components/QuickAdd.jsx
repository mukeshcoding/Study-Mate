import React from "react";
import { useNavigate } from "react-router-dom";
import { ListTodo, GraduationCap, StickyNote } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const OPTIONS = [
  { key: "task", label: "New Task", desc: "Add a to-do with priority & due date", icon: ListTodo, to: "/tasks?new=1", color: "text-indigo-300 bg-indigo-500/15 border-indigo-500/30" },
  { key: "exam", label: "New Exam", desc: "Schedule an exam with countdown", icon: GraduationCap, to: "/exams?new=1", color: "text-violet-300 bg-violet-500/15 border-violet-500/30" },
  { key: "note", label: "New Note", desc: "Jot down a quick note", icon: StickyNote, to: "/notes?new=1", color: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
];

function Content({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="px-1 pb-2 space-y-2">
      {OPTIONS.map(({ key, label, desc, icon: Icon, to, color }) => (
        <button
          key={key}
          onClick={() => { onClose(); navigate(to); }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/60 transition text-left"
        >
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-heading font-semibold text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function QuickAdd({ open, onClose }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-heading">Quick add</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">Create something new in seconds.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <Content onClose={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[400px] sm:w-[420px] bg-card border-border p-0">
        <SheetHeader className="px-6 pt-6 pb-3">
          <SheetTitle className="font-heading">Quick add</SheetTitle>
          <SheetDescription className="text-muted-foreground">Create something new in seconds.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <Content onClose={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}