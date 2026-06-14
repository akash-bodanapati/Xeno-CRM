import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart3,
  Coffee,
  Filter,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { seedData } from '@/api/customers';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/segments', label: 'Segments', icon: Filter },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/ai-assistant', label: 'Tara Intelligence', icon: Sparkles, highlight: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  const seedMutation = useMutation({
    mutationFn: seedData,
    onSuccess: () => {
      toast.success('Demo data loaded successfully');
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error('Failed to load demo data');
    },
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/health`
        );
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[240px] flex-col bg-[#0B1220] text-white border-r border-slate-800/40">
      <div className="flex flex-col border-b border-slate-800/60 px-6 py-5">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-indigo-500" />
          <span className="text-lg font-bold text-slate-100 tracking-tight">XenoCRM</span>
        </div>
        <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Customer Intelligence Platform
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : highlight
                    ? 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-3 w-full justify-start text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
        >
          {seedMutation.isPending ? 'Loading…' : 'Load Demo Data'}
        </Button>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isOnline ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            {isOnline ? 'Channel Online' : 'Channel Offline'}
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-slate-800/20 p-2.5 border border-slate-800/30 text-center">
          <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
            Powered by
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-slate-400">
            Tara Intelligence
          </span>
        </div>
      </div>
    </aside>
  );
}
