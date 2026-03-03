'use client';

import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';

interface StatusBadgeProps {
  status: Status | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  PENDING: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: Clock,
    label: 'Pending Approval',
  },
  APPROVED: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    icon: CheckCircle2,
    label: 'Approved',
  },
  REJECTED: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    label: 'Rejected',
  },
  IN_PROGRESS: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    icon: AlertCircle,
    label: 'In Progress',
  },
  COMPLETED: {
    bg: 'bg-slate-50 dark:bg-slate-950',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    icon: CheckCircle2,
    label: 'Completed',
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function StatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status as Status] || statusConfig.PENDING;
  const Icon = config.icon;
  const sizeClass = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        'transition-all duration-200 hover:shadow-md',
        config.bg,
        config.border,
        config.text,
        sizeClass,
        className
      )}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      <span className="truncate">{config.label}</span>
    </div>
  );
}
