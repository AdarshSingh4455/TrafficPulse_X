import React from 'react';

export default function SectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = ""
}) {
  return (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs dark:shadow-lg dark:shadow-black/20 flex flex-col transition-colors ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-wide">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
