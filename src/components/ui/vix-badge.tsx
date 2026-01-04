
"use client";

import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Gauge, TrendingUp, AlertTriangle } from "lucide-react";
import type { VixZone } from "@/hooks/use-vix-state";

interface VixBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  zoneLabel: VixZone;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick: () => void;
}

export function VixBadge({ value, zoneLabel, size = 'md', showLabel = true, className, onClick, ...props }: VixBadgeProps) {
    const zoneConfig: Record<VixZone, string> = {
        "Extremely Calm": 'border-green-500/30 bg-green-500/10 text-green-300',
        "Normal": 'border-green-500/30 bg-green-500/10 text-green-300',
        "Volatile": 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        "High Volatility": 'border-orange-500/30 bg-orange-500/10 text-orange-300',
        "Extreme": 'border-red-500/30 bg-red-500/10 text-red-300 animate-pulse',
    };

    const isHighRisk = zoneLabel === 'High Volatility' || zoneLabel === 'Extreme';
    const Icon = isHighRisk ? AlertTriangle : Gauge;

    return (
        <Badge
            variant="outline"
            className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                zoneConfig[zoneLabel],
                size === 'sm' && 'px-2 py-1 text-xs',
                size === 'md' && 'px-2.5 py-1 text-sm',
                size === 'lg' && 'px-3 py-1.5 text-base',
                className
            )}
            onClick={onClick}
            {...props}
        >
            <Icon className="mr-1.5 h-3 w-3" />
            <span className="font-semibold font-mono">{value.toFixed(0)}</span>
            {showLabel && <span className="ml-1.5 font-medium">{zoneLabel}</span>}
        </Badge>
    );
}
