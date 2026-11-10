import React from "react";

export default function PageShell({ title, subtitle, actions, children }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}