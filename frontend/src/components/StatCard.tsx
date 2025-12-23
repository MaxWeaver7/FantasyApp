import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  className?: string;
  delay?: number;
}

export function StatCard({ label, value, subValue, trend = 'neutral', className, delay = 0 }: StatCardProps) {
  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-4 opacity-0 animate-slide-up",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={cn(
        "text-2xl font-bold font-mono",
        trend === 'positive' && "text-primary",
        trend === 'negative' && "text-destructive",
        trend === 'neutral' && "text-foreground"
      )}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">
          {subValue}
        </p>
      )}
    </div>
  );
}


