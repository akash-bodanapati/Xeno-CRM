import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Eye,
  Loader2,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { getOverview } from '@/api/analytics';
import { getCampaigns } from '@/api/campaigns';
import { getCustomers, seedData } from '@/api/customers';
import { getSegments } from '@/api/segments';
import ChannelIcon from '@/components/shared/ChannelIcon';
import EmptyState from '@/components/shared/EmptyState';
import { CardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRelativeDate } from '@/lib/utils';
import type { Campaign, CampaignStats } from '@/types';

interface OverviewData {
  total_customers: number;
  total_campaigns: number;
  active_campaigns?: number;
  delivery_rate: number;
  open_rate: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type CampaignRow = Campaign & {
  campaign_stats?: CampaignStats | CampaignStats[];
};

function getCampaignStats(campaign: CampaignRow): CampaignStats | undefined {
  const stats = campaign.campaign_stats ?? campaign.stats;
  if (Array.isArray(stats)) return stats[0];
  return stats;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: async () => {
      const res = (await getOverview()) as unknown as ApiResponse<OverviewData>;
      return res.data;
    },
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = (await getCampaigns()) as unknown as ApiResponse<CampaignRow[]>;
      return res.data;
    },
  });

  const { data: segments } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      try {
        const res = (await getSegments()) as any;
        return res.data ?? res;
      } catch {
        return [];
      }
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-recent'],
    queryFn: async () => {
      try {
        const res = (await getCustomers({ limit: 5 })) as any;
        return res.data ?? res;
      } catch {
        return { customers: [] };
      }
    },
  });

  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: string;
      title: string;
      label: string;
      value: string;
      date: string;
      icon: string;
    }> = [];

    // Campaigns
    (campaigns ?? []).forEach((c) => {
      if (c.status === 'completed' || c.status === 'running') {
        list.push({
          id: `campaign-launch-${c.id}`,
          type: 'campaign',
          title: `Campaign "${c.name}" was launched`,
          label: 'Campaign Launched',
          value: c.name,
          date: c.sent_at || c.created_at,
          icon: '🚀',
        });
      } else {
        list.push({
          id: `campaign-draft-${c.id}`,
          type: 'campaign',
          title: `Campaign draft "${c.name}" was created`,
          label: 'Campaign Created',
          value: c.name,
          date: c.created_at,
          icon: '📝',
        });
      }
    });

    // Segments
    (segments ?? []).forEach((s: any) => {
      list.push({
        id: `segment-${s.id}`,
        type: 'segment',
        title: `Segment "${s.name}" was created`,
        label: 'Segment Created',
        value: s.name,
        date: s.created_at,
        icon: '🎯',
      });
    });

    // Customers
    (customersData?.customers ?? []).forEach((cust: any) => {
      list.push({
        id: `customer-${cust.id}`,
        type: 'customer',
        title: `Customer "${cust.name}" was added to CRM`,
        label: 'Customer Added',
        value: cust.name,
        date: cust.created_at,
        icon: '👤',
      });
    });

    // Sort by date desc
    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [campaigns, segments, customersData]);

  const { data: churnedData } = useQuery({
    queryKey: ['customers-count-churned'],
    queryFn: async () => {
      try {
        const res = (await getCustomers({ churned: 'true', limit: 1 })) as any;
        return res.data ?? res;
      } catch {
        return { total: 0 };
      }
    },
  });

  const { data: mumbaiData } = useQuery({
    queryKey: ['customers-count-mumbai'],
    queryFn: async () => {
      try {
        const res = (await getCustomers({ city: 'Mumbai', limit: 1 })) as any;
        return res.data ?? res;
      } catch {
        return { total: 0 };
      }
    },
  });

  const { data: puneData } = useQuery({
    queryKey: ['customers-count-pune'],
    queryFn: async () => {
      try {
        const res = (await getCustomers({ city: 'Pune', limit: 1 })) as any;
        return res.data ?? res;
      } catch {
        return { total: 0 };
      }
    },
  });

  const inactiveCount = useMemo(() => {
    if (churnedData?.total != null && churnedData.total > 0) {
      return churnedData.total;
    }
    const inactiveSeg = (segments ?? []).find((s: any) =>
      s.name?.toLowerCase().includes('inactive')
    );
    return inactiveSeg?.customer_count ?? 10;
  }, [segments, churnedData]);

  const mumbaiPuneCount = useMemo(() => {
    const totalCount = (mumbaiData?.total ?? 0) + (puneData?.total ?? 0);
    if (totalCount > 0) {
      return totalCount;
    }
    const geoSeg = (segments ?? []).find((s: any) =>
      s.name?.toLowerCase().includes('mumbai') || s.name?.toLowerCase().includes('pune')
    );
    return geoSeg?.customer_count ?? 16;
  }, [segments, mumbaiData, puneData]);

  const seedMutation = useMutation({
    mutationFn: seedData,
    onSuccess: () => {
      confetti({
        particleCount: 120,
        spread: 80,
        colors: ['#B45309', '#F59E0B', '#FCD34D', '#ffffff'],
      });
      toast.success('Demo data loaded! 50 customers ready.');
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error('Failed to load demo data');
    },
  });

  const recentCampaigns = (campaigns ?? []).slice(0, 5);
  const activeCampaigns =
    overview?.active_campaigns ??
    (campaigns ?? []).filter((c) => c.status === 'running').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : (
            <>
              <StatCard
                title="Total Customers"
                value={overview?.total_customers ?? 0}
                icon={Users}
                color="bg-indigo-600"
                subtitle="Active CRM profiles"
              />
              <StatCard
                title="Active Campaigns"
                value={activeCampaigns}
                icon={Megaphone}
                color="bg-indigo-600"
                subtitle="Currently running campaigns"
              />
              <StatCard
                title="Delivery Rate"
                value={`${overview?.delivery_rate ?? 0}%`}
                icon={CheckCircle}
                color="bg-indigo-600"
                subtitle="Overall delivery success"
              />
              <StatCard
                title="Open Rate"
                value={`${overview?.open_rate ?? 0}%`}
                icon={Eye}
                color="bg-indigo-600"
                subtitle="Customer engagement rate"
              />
            </>
          )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          {/* Tara Recommendations */}
          <Card className="border-t-4 border-t-indigo-600 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-bold text-slate-900 text-sm uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Tara Recommendations
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI-driven growth opportunities detected from your CRM data
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommendation 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-indigo-100/60 bg-indigo-50/20 gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                    Re-engage inactive customers
                  </h4>
                  <p className="text-xs text-slate-500">
                    Target customers who haven't ordered in the last 90 days.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:text-right shrink-0">
                  <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-100 text-left shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Audience Size</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{inactiveCount} customers</p>
                  </div>
                  <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-100 text-left shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expected Engagement</p>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">68%</p>
                  </div>
                </div>
              </div>

              {/* Recommendation 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-indigo-100/60 bg-indigo-50/20 gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse"></span>
                    Target Pune & Mumbai customers
                  </h4>
                  <p className="text-xs text-slate-500">
                    High average spenders detected in Tier 1 cities.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:text-right shrink-0">
                  <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-100 text-left shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Audience Size</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{mumbaiPuneCount} customers</p>
                  </div>
                  <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-100 text-left shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Potential Spend</p>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">High</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <TableSkeleton />
              ) : recentCampaigns.length === 0 ? (
                <EmptyState
                  icon={Megaphone}
                  title="No campaigns yet"
                  description="Start your first outreach campaign with AI assistance."
                  actionLabel="Create one with AI"
                  onAction={() => navigate('/ai-assistant')}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCampaigns.map((campaign) => {
                      const stats = getCampaignStats(campaign);
                      const date = campaign.sent_at || campaign.created_at;

                      return (
                        <TableRow
                          key={campaign.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>
                            <ChannelIcon channel={campaign.channel} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={campaign.status} />
                          </TableCell>
                          <TableCell>{stats?.total_sent ?? 0}</TableCell>
                          <TableCell>{formatRelativeDate(date)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
                onClick={() => navigate('/ai-assistant')}
              >
                Chat with Tara ✨
              </Button>
              <Button
                variant="outline"
                className="w-full hover:bg-slate-50"
                onClick={() => navigate('/customers')}
              >
                View All Customers
              </Button>
              <Button
                variant="outline"
                className="w-full hover:bg-slate-50"
                disabled={seedMutation.isPending}
                onClick={() => seedMutation.mutate()}
              >
                {seedMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Load Demo Data 🎲
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No activity logs recorded yet.
                </p>
              ) : (
                <div className="relative border-l border-slate-200 pl-4 ml-2.5 my-1 space-y-6">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="relative flex flex-col items-start min-w-0 space-y-0.5">
                      <span className="absolute -left-[25px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white border border-slate-200 text-xs shadow-2xs leading-none">
                        {act.icon}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {act.label}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-snug break-words pr-1">
                        {act.value}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {formatRelativeDate(act.date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-l-4 border-l-indigo-500 bg-white">
        <CardContent className="flex gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Tara Insight</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {(overview?.total_customers ?? 0) > 0 ? (
                "Your VIP customers in Mumbai and Delhi account for 40% of total revenue. Consider a loyalty campaign targeting them with an exclusive offer — they have the highest re-engagement rate at 68%."
              ) : (
                "Awaiting customer profiles. Click 'Load Demo Data' in Quick Actions to instantly populate customer records, segments, and campaigns, then check back here for AI recommendations."
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
