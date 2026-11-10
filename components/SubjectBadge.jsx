import React from "react";
import { colorClasses } from "@/lib/colors";

export default function SubjectBadge({ name, color, size = "sm" }) {
  if (!name) return null;
  const c = colorClasses(color);
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[0.62rem]" : "px-2 py-0.5 text-[0.68rem]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${c.chip} ${pad} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {name}
    </span>
  );
}