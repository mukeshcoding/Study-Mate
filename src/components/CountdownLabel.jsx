import React, { useEffect, useState } from "react";

function diffParts(target) {
  const now = Date.now();
  const t = new Date(target).getTime();
  let d = t - now;
  if (d < 0) d = 0;
  const days = Math.floor(d / 86400000);
  const hours = Math.floor((d % 86400000) / 3600000);
  const mins = Math.floor((d % 3600000) / 60000);
  const secs = Math.floor((d % 60000) / 1000);
  return { days, hours, mins, secs, done: t <= now };
}

export default function CountdownLabel({ target, compact = false }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const p = diffParts(target);
  if (p.done) return <span className="text-rose-400 font-semibold">Started / Past</span>;
  if (compact) {
    return <span>{p.days > 0 ? `${p.days}d ${p.hours}h` : `${p.hours}h ${p.mins}m`}</span>;
  }
  return (
    <div className="flex items-center gap-2">
      {[
        { v: p.days, l: "days" },
        { v: p.hours, l: "hrs" },
        { v: p.mins, l: "min" },
        { v: p.secs, l: "sec" },
      ].map((x, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="font-heading font-extrabold text-xl text-foreground tabular-nums leading-none">{String(x.v).padStart(2, "0")}</span>
          <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wide">{x.l}</span>
        </div>
      ))}
    </div>
  );
}

export { diffParts };