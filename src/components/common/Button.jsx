import React from 'react';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon: Icon
}) {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-150 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm shadow-blue-600/30",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-[#17233f] dark:hover:bg-[#1e2d52] dark:text-slate-200 dark:border-slate-700/80",
    outline: "bg-transparent border border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
    cyan: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-sm shadow-cyan-500/30"
  };

  const sizes = {
    xs: "px-2 py-1 text-xs gap-1",
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
