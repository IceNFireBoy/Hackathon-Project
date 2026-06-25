import { useState } from 'react';

const badgeVariants = {
  success: 'text-accent-bright bg-accent-bright-muted border-accent-bright/30',
  warning: 'text-accent bg-accent-muted border-accent/30',
  danger: 'text-critical bg-critical-muted border-critical/25',
  neutral: 'text-slate-400 bg-surface-raised/60 border-surface-card/40',
  gold: 'text-accent-bright bg-accent-bright-muted border-accent-bright/30',
};

export function Badge({ variant = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${badgeVariants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

const buttonVariants = {
  primary: 'bg-gradient-to-r from-accent to-accent-bright hover:from-accent-bright hover:to-accent text-surface-base shadow-lg shadow-black/30 font-black',
  ghost: 'bg-surface-raised text-slate-400 hover:bg-surface-card hover:text-accent-bright border border-surface-card',
  danger: 'bg-critical/80 hover:bg-critical text-slate-200',
  outline: 'bg-transparent border border-accent/40 text-accent hover:bg-accent-muted',
};

const buttonSizes = {
  sm: 'py-1.5 px-3 text-xs',
  md: 'py-2.5 px-4 text-sm',
  lg: 'py-3 px-5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const cardVariantClasses = {
  default: 'oc-card',
  accent: 'oc-card-accent',
  bright: 'oc-card-bright',
  emerald: 'oc-card-accent',
  amber: 'oc-card-bright',
};

export function Card({ variant = 'default', className = '', children, onClick }) {
  return (
    <div
      className={`${cardVariantClasses[variant] || cardVariantClasses.default} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }) {
  return (
    <div className={`px-4 py-3 border-b border-surface-card/60 bg-surface-raised/30 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`${className}`}>{children}</div>;
}

export function CardRow({ className = '', children, onClick }) {
  const interactive = onClick ? 'cursor-pointer hover:bg-surface-raised/60' : 'hover:bg-surface-raised/40';
  return (
    <div
      className={`flex items-center p-3 transition-colors w-full min-w-0 ${interactive} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {children}
    </div>
  );
}

export function ConfidencePill({ score }) {
  if (score >= 0.8) {
    return <Badge variant="success">High Match</Badge>;
  }
  return (
    <Badge variant="warning">
      Verify ({Math.round(score * 100)}%)
    </Badge>
  );
}

const sectionHeaderVariants = {
  accent: 'text-accent',
  bright: 'text-accent-bright',
  amber: 'text-accent',
  emerald: 'text-accent',
  neutral: 'text-slate-400',
};

export function SectionHeader({ title, count, variant = 'neutral', className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-2 pl-1 ${className}`}>
      <h2 className={`text-[11px] font-bold uppercase tracking-wider opacity-90 ${sectionHeaderVariants[variant]}`}>
        {title}
        {count !== undefined && ` (${count})`}
      </h2>
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`oc-skeleton ${className}`} />;
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
    </div>
  );
}

export function SkeletonCard({ rows = 3, tint = 'default', className = '' }) {
  const tintClass =
    tint === 'bright' || tint === 'amber'
      ? 'border-accent-bright/20'
      : tint === 'accent' || tint === 'emerald'
        ? 'border-accent/15'
        : 'border-surface-card/30';
  return (
    <div className={`oc-card border ${tintClass} ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} className={i < rows - 1 ? 'border-b border-surface-card/50' : ''} />
      ))}
    </div>
  );
}

export function Tooltip({ content, children, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-xs leading-relaxed text-slate-200 bg-surface-raised border border-surface-card rounded-lg shadow-card"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface-card" />
        </div>
      )}
    </div>
  );
}
