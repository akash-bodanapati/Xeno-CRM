import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  HelpCircle,
  Lightbulb,
  Loader2,
  MousePointer,
  Send,
  ShoppingCart,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { interpretStats } from '@/api/ai';
import client from '@/api/client';
import { getCampaign, getCampaignStats, launchCampaign } from '@/api/campaigns';
import ChannelIcon from '@/components/shared/ChannelIcon';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
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
import { cn, formatPercentage, formatRelativeDate } from '@/lib/utils';
import type { Campaign, CampaignStats, Communication, Customer } from '@/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type CampaignRow = Campaign & {
  campaign_stats?: CampaignStats | CampaignStats[];
  segments?: { name: string; customer_count?: number };
};

type CommunicationRow = Communication & {
  customers?: Pick<Customer, 'name' | 'email' | 'phone'>;
};

interface AiInsights {
  summary: string;
  highlights: string[];
  recommendations: string[];
}

const COMM_PAGE_SIZE = 20;

const FUNNEL_COLORS: Record<string, string> = {
  Sent: '#94a3b8',
  Delivered: '#22c55e',
  Opened: '#a855f7',
  Clicked: '#B45309',
};

function extractStats(campaign?: CampaignRow): CampaignStats | undefined {
  const raw = campaign?.campaign_stats ?? campaign?.stats;
  const base = Array.isArray(raw) ? raw[0] : raw;
  if (!base) return undefined;
  return enrichStats(base);
}

function enrichStats(stats: CampaignStats): CampaignStats {
  const delivery_rate =
    stats.delivery_rate ??
    (stats.total_sent > 0
      ? Math.round((stats.total_delivered / stats.total_sent) * 100)
      : 0);
  const open_rate =
    stats.open_rate ??
    (stats.total_delivered > 0
      ? Math.round((stats.total_opened / stats.total_delivered) * 100)
      : 0);
  const click_rate =
    stats.click_rate ??
    (stats.total_opened > 0
      ? Math.round((stats.total_clicked / stats.total_opened) * 100)
      : 0);

  return {
    ...stats,
    delivery_rate,
    open_rate,
    click_rate,
  };
}


function FunnelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; percent: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold">{item.name}</p>
      <p>{item.value.toLocaleString()} messages</p>
      <p className="text-muted-foreground">{formatPercentage(item.percent)}</p>
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [commPage, setCommPage] = useState(1);
  const [launching, setLaunching] = useState(false);

  const { data: campaign, isLoading: campaignLoading, refetch: refetchCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = (await getCampaign(id!)) as unknown as ApiResponse<CampaignRow>;
      return res.data;
    },
    enabled: !!id,
  });

  const { data: statsFromApi, isLoading: statsLoading } = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: async () => {
      try {
        const res = (await getCampaignStats(id!)) as unknown as ApiResponse<CampaignStats>;
        return enrichStats(res.data);
      } catch {
        // Fallback: derive from embedded campaign_stats (may be stale)
        const embedded = extractStats(campaign);
        return embedded ? enrichStats(embedded) : undefined;
      }
    },
    enabled: !!id,
    // Poll while running OR while launching (messages are being dispatched)
    refetchInterval: (campaign?.status === 'running' || launching) ? 3000 : false,
  });

  const stats = useMemo(
    () => statsFromApi ?? (campaign ? enrichStats(extractStats(campaign) ?? ({} as CampaignStats)) : undefined),
    [statsFromApi, campaign]
  );

  const { data: communications, isLoading: commsLoading } = useQuery({
    queryKey: ['campaign-communications', id],
    queryFn: async () => {
      const res = (await client.get(
        `/api/campaigns/${id}/communications`
      )) as unknown as ApiResponse<CommunicationRow[]>;
      return res.data;
    },
    enabled: !!id,
    // Poll while running OR while launching
    refetchInterval: (campaign?.status === 'running' || launching) ? 3000 : false,
  });

  const {
    data: insights,
    isLoading: insightsLoading,
    isError: insightsError,
  } = useQuery({
    queryKey: ['campaign-insights', id],
    queryFn: async () => {
      const res = (await interpretStats({
        campaign_id: id,
        ...stats,
      })) as unknown as ApiResponse<AiInsights>;
      return res.data;
    },
    enabled: !!id && !!stats && stats.total_sent > 0,
  });

  useEffect(() => {
    if (!id || !launching) return;

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      void refetchCampaign().then((result) => {
        const status = result.data?.status;
        if (status === 'completed' || Date.now() - startedAt >= 120000) {
          clearInterval(interval);
          setLaunching(false);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [id, launching, refetchCampaign]);

  const handleLaunchCampaign = async () => {
    if (!id) return;

    setLaunching(true);
    try {
      await launchCampaign(id);
      await queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign launched successfully! 🚀');
    } catch {
      setLaunching(false);
      toast.error('Failed to launch campaign');
    }
  };

  const commList = communications ?? [];
  const commStart = commList.length === 0 ? 0 : (commPage - 1) * COMM_PAGE_SIZE + 1;
  const commEnd = Math.min(commPage * COMM_PAGE_SIZE, commList.length);
  const paginatedComms = commList.slice(
    (commPage - 1) * COMM_PAGE_SIZE,
    commPage * COMM_PAGE_SIZE
  );

  const funnelData = useMemo(() => {
    if (!stats) return [];
    const sent = stats.total_sent || 0;
    return [
      {
        name: 'Sent',
        value: stats.total_sent,
        percent: sent > 0 ? 100 : 0,
        fill: FUNNEL_COLORS.Sent,
      },
      {
        name: 'Delivered',
        value: stats.total_delivered,
        percent: sent > 0 ? (stats.total_delivered / sent) * 100 : 0,
        fill: FUNNEL_COLORS.Delivered,
      },
      {
        name: 'Opened',
        value: stats.total_opened,
        percent: sent > 0 ? (stats.total_opened / sent) * 100 : 0,
        fill: FUNNEL_COLORS.Opened,
      },
      {
        name: 'Clicked',
        value: stats.total_clicked,
        percent: sent > 0 ? (stats.total_clicked / sent) * 100 : 0,
        fill: FUNNEL_COLORS.Clicked,
      },
      {
        name: 'Conversions',
        value: stats.conversions || 0,
        percent: sent > 0 ? ((stats.conversions ?? 0) / sent) * 100 : 0,
        fill: '#f43f5e',
      },
    ];
  }, [stats]);

  const isRunning = campaign?.status === 'running';

  if (campaignLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <TableSkeleton />
      </motion.div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Campaign not found</p>
        <Link
          to="/campaigns"
          className="mt-4 inline-flex h-8 items-center rounded-lg border px-2.5 text-sm hover:bg-muted"
        >
          Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <Link
          to="/campaigns"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
          <ChannelIcon channel={campaign.channel} />
          <StatusBadge status={campaign.status} />
          {campaign.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3"
              onClick={() => void handleLaunchCampaign()}
              disabled={launching}
            >
              {launching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Launching...
                </>
              ) : (
                'Launch Campaign'
              )}
            </Button>
          )}
          {campaign.sent_at ? (
            <span className="text-sm text-muted-foreground">
              Sent {formatRelativeDate(campaign.sent_at)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Created {formatRelativeDate(campaign.created_at)}
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5',
          isRunning && 'rounded-xl border-2 border-blue-300 p-1'
        )}
      >
        {isRunning && (
          <div className="col-span-full flex justify-end">
            <Badge className="animate-pulse border-0 bg-blue-100 text-blue-700">
              Live updating...
            </Badge>
          </div>
        )}

        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="mt-2 text-3xl font-bold">
                {(isRunning || launching) && !statsLoading && (stats?.total_sent ?? 0) === 0
                  ? <span className="text-lg text-muted-foreground animate-pulse">Computing...</span>
                  : (stats?.total_sent ?? 0)
                }
              </p>
              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                <span>Targeted: {((stats?.total_sent ?? 0) + (stats?.total_failed ?? 0))}</span>
                {stats?.total_failed > 0 && (
                  <span className="text-red-600 font-semibold">({stats.total_failed} failed)</span>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-blue-500 p-3">
              <Send className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="mt-2 text-3xl font-bold">{stats?.total_delivered ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPercentage(stats?.delivery_rate ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-green-500 p-3">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Opened</p>
              <p className="mt-2 text-3xl font-bold">{stats?.total_opened ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPercentage(stats?.open_rate ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-purple-500 p-3">
              <Eye className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Clicked</p>
              <p className="mt-2 text-3xl font-bold">{stats?.total_clicked ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPercentage(stats?.click_rate ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-indigo-600 p-3">
              <MousePointer className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm text-muted-foreground">Conversions</p>
                <UiTooltip>
                  <TooltipTrigger>
                    <button type="button" className="text-slate-400 hover:text-slate-600 focus:outline-none">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Conversions represent unique customers who ordered within 72 hours of campaign delivery.
                    Since users can convert via notification previews, SMS, or offline channels without triggering
                    read webhooks, conversions may legitimately exceed opened or clicked counts.
                  </TooltipContent>
                </UiTooltip>
              </div>
              <p className="mt-2 text-3xl font-bold">{stats?.conversions ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPercentage(
                  stats?.total_sent && stats.total_sent > 0
                    ? Math.round(((stats.conversions ?? 0) / stats.total_sent) * 100)
                    : 0
                )} conversion rate
              </p>
            </div>
            <div className="rounded-lg bg-rose-500 p-3">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData.length === 0 || stats?.total_sent === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No delivery data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<FunnelTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communications</CardTitle>
        </CardHeader>
        <CardContent>
          {commsLoading ? (
            <TableSkeleton />
          ) : commList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No communications yet
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Delivered At</TableHead>
                    <TableHead>Opened At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComms.map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell className="font-medium">
                        {comm.customers?.name ?? 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <ChannelIcon channel={comm.channel} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={comm.status} />
                      </TableCell>
                      <TableCell>{formatRelativeDate(comm.sent_at)}</TableCell>
                      <TableCell>{formatRelativeDate(comm.delivered_at)}</TableCell>
                      <TableCell>{formatRelativeDate(comm.opened_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {commStart}–{commEnd} of {commList.length} communications
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={commPage === 1}
                    onClick={() => setCommPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={commPage * COMM_PAGE_SIZE >= commList.length}
                    onClick={() => setCommPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {stats && stats.total_sent > 0 && (
        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing performance with AI...
              </div>
            ) : insightsError ? (
              <p className="py-6 text-sm text-muted-foreground">Analysis unavailable</p>
            ) : insights ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-700">{insights.summary}</p>

                {insights.highlights.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-900">Highlights</p>
                    <ul className="space-y-2">
                      {insights.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.recommendations.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-900">
                      Recommendations
                    </p>
                    <ul className="space-y-2">
                      {insights.recommendations.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
