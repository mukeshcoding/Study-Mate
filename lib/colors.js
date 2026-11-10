// Shared color tokens for subjects/habits/notes — literal Tailwind classes (purge-safe).
export const COLOR_OPTIONS = [
  "indigo", "violet", "blue", "emerald", "amber", "rose", "cyan", "fuchsia", "orange", "teal",
];

const MAP = {
  indigo:  { dot: "bg-indigo-500",   text: "text-indigo-300",   chip: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",   ring: "ring-indigo-500/40",   grad: "from-indigo-500 to-violet-500" },
  violet:  { dot: "bg-violet-500",   text: "text-violet-300",   chip: "bg-violet-500/15 text-violet-300 border-violet-500/30",  ring: "ring-violet-500/40",  grad: "from-violet-500 to-fuchsia-500" },
  blue:    { dot: "bg-blue-500",     text: "text-blue-300",     chip: "bg-blue-500/15 text-blue-300 border-blue-500/30",         ring: "ring-blue-500/40",    grad: "from-blue-500 to-cyan-500" },
  emerald: { dot: "bg-emerald-500",   text: "text-emerald-300", chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",ring: "ring-emerald-500/40", grad: "from-emerald-500 to-teal-500" },
  amber:   { dot: "bg-amber-500",    text: "text-amber-300",   chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",      ring: "ring-amber-500/40",   grad: "from-amber-500 to-orange-500" },
  rose:    { dot: "bg-rose-500",     text: "text-rose-300",    chip: "bg-rose-500/15 text-rose-300 border-rose-500/30",         ring: "ring-rose-500/40",    grad: "from-rose-500 to-pink-500" },
  cyan:    { dot: "bg-cyan-500",     text: "text-cyan-300",    chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",         ring: "ring-cyan-500/40",    grad: "from-cyan-500 to-blue-500" },
  fuchsia: { dot: "bg-fuchsia-500",  text: "text-fuchsia-300", chip: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",ring: "ring-fuchsia-500/40", grad: "from-fuchsia-500 to-pink-500" },
  orange:  { dot: "bg-orange-500",   text: "text-orange-300", chip: "bg-orange-500/15 text-orange-300 border-orange-500/30",  ring: "ring-orange-500/40",  grad: "from-orange-500 to-amber-500" },
  teal:    { dot: "bg-teal-500",     text: "text-teal-300",    chip: "bg-teal-500/15 text-teal-300 border-teal-500/30",         ring: "ring-teal-500/40",    grad: "from-teal-500 to-emerald-500" },
};

export const colorClasses = (c) => MAP[c] || MAP.indigo;

export const PRIORITY_META = {
  low:    { label: "Low",    chip: "bg-slate-500/15 text-slate-300 border-slate-500/30", dot: "bg-slate-400" },
  medium: { label: "Medium", chip: "bg-blue-500/15 text-blue-300 border-blue-500/30",    dot: "bg-blue-400" },
  high:   { label: "High",   chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",  dot: "bg-amber-400" },
  urgent: { label: "Urgent", chip: "bg-rose-500/15 text-rose-300 border-rose-500/30",     dot: "bg-rose-400" },
};