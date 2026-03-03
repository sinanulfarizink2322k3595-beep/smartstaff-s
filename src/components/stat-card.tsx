'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  onClick?: () => void;
}

const colorConfig = {
  blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
  green: 'from-green-500/10 to-green-500/5 text-green-600',
  red: 'from-red-500/10 to-red-500/5 text-red-600',
  yellow: 'from-yellow-500/10 to-yellow-500/5 text-yellow-600',
  purple: 'from-purple-500/10 to-purple-500/5 text-purple-600',
};

const trendConfig = {
  up: 'text-green-600',
  down: 'text-red-600',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendDirection = 'up',
  color = 'blue',
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden cursor-pointer group transition-all duration-300',
        'hover:shadow-lg hover:scale-105 active:scale-95',
        onClick && 'hover:border-primary'
      )}
      onClick={onClick}
    >
      {/* Gradient background that appears on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          `bg-gradient-to-br ${colorConfig[color]}`
        )}
      />

      {/* Animated background blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity" />

      <CardContent className="p-6 relative z-10">
        {/* Top section: Icon and description */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center transition-all',
              'bg-gradient-to-br from-primary/20 to-primary/10',
              'group-hover:shadow-lg group-hover:scale-110'
            )}
          >
            <Icon className="w-6 h-6 text-primary" />
          </div>

          {/* Trend badge */}
          {trend !== undefined && (
            <div
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1',
                'bg-gradient-to-r',
                trendDirection === 'up'
                  ? 'from-green-50 to-green-100 text-green-700'
                  : 'from-red-50 to-red-100 text-red-700'
              )}
            >
              {trendDirection === 'up' ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {value}
          </p>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Card>
  );
}
