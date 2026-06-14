import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  opened: 'bg-purple-100 text-purple-700',
  read: 'bg-indigo-100 text-indigo-700',
  clicked: 'bg-amber-100 text-amber-700',
  running: 'bg-blue-100 text-blue-700 animate-pulse',
  completed: 'bg-green-100 text-green-700',
  draft: 'bg-slate-100 text-slate-600',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const style = statusStyles[normalized] ?? 'bg-slate-100 text-slate-700';

  return (
    <Badge variant="outline" className={cn('border-0 capitalize', style)}>
      {status}
    </Badge>
  );
}
