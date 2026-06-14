import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  Eye,
  Megaphone,
  Send,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getCampaignAnalytics, getOverview } from '@/api/analytics';
import EmptyState from '@/components/shared/EmptyState';
import { CardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton';
import ChannelIcon from '@/components/shared/ChannelIcon';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPercentage, formatRelativeDate } from '@/lib/utils';
import type { Campaign, CampaignStats } from '@/types';

interface OverviewData {
  total_campaigns: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_conversions: number;
  total_attributed_orders: number;
  delivery_rate: number;
  open_rate: number;
  conversion_rate: number;
  active_campaigns?: number;
}

interface CampaignAnalyticsRow extends Campaign {
  stats?: CampaignStats | null;
  campaign_stats?: CampaignStats | CampaignStats[] | null;
  delivery_rate?: number;
  open_rate?: number;
  click_rate?: number;
  conversion_rate?: number;
  attributed_orders?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type SortKey = 'name' | 'channel' | 'sent' | 'delivery_rate' | 'open_rate' | 'click_rate' | 'conversions' | 'conversion_rate' | 'attributed_orders' | 'status' | 'date';

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const value = (payload as { data?: T }).data;
    if (value !== undefined) return value as T;
  }

  return payload as T;
}

function truncateLabel(label: string, maxLength = 12): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength)}…`;
}

function getCampaignStats(stats: CampaignStats | CampaignStats[] | null | undefined): CampaignStats | null {
  if (Array.isArray(stats)) {
    return stats[0] ?? null;
  }

  return stats ?? null;
}

export default function Analytics() {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewData>({
    queryKey: ['overview'],
    queryFn: async () => {
      const res = (await getOverview()) as unknown as ApiResponse<OverviewData> | OverviewData;
      return unwrapData<OverviewData>(res);
    },
  });

  const { data: campaignAnalytics = [], isLoading: analyticsLoading } = useQuery<CampaignAnalyticsRow[]>({
    queryKey: ['campaign-analytics'],
    queryFn: async () => {
      const res = (await getCampaignAnalytics()) as unknown as ApiResponse<CampaignAnalyticsRow[]> | CampaignAnalyticsRow[];
      return unwrapData<CampaignAnalyticsRow[]>(res);
    },
  });

  const channelData = useMemo(() => {
    const channels = ['whatsapp', 'sms', 'email', 'rcs'] as const;
    return channels.map((channel) => {
      const matching = campaignAnalytics.filter((campaign) => campaign.channel?.toLowerCase() === channel);
      const totalSent = matching.reduce((sum, campaign) => sum + (campaign.stats?.total_sent ?? 0), 0);
      const totalDelivered = matching.reduce((sum, campaign) => sum + (campaign.stats?.total_delivered ?? 0), 0);
      const totalOpened = matching.reduce((sum, campaign) => sum + (campaign.stats?.total_opened ?? 0), 0);
      const totalConversions = matching.reduce((sum, campaign) => sum + (campaign.stats?.conversions ?? 0), 0);

      return {
        name: channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : channel === 'email' ? 'Email' : 'RCS',
        Sent: totalSent,
        Delivered: totalDelivered,
        Opened: totalOpened,
        Conversions: totalConversions,
      };
    });
  }, [campaignAnalytics]);

  const deliveryRateData = useMemo(() => {
    return campaignAnalytics
      .slice(0, 8)
      .map((campaign) => {
        const stats = campaign.stats ?? campaign.campaign_stats;
        const baseStats = Array.isArray(stats) ? stats[0] : stats;
        const convRate = campaign.conversion_rate ?? (
          baseStats && baseStats.total_sent > 0
            ? Math.round((baseStats.conversions / baseStats.total_sent) * 100)
            : 0
        );
        return {
          name: truncateLabel(campaign.name),
          deliveryRate: campaign.delivery_rate ?? baseStats?.delivery_rate ?? 0,
          openRate: campaign.open_rate ?? baseStats?.open_rate ?? 0,
          conversionRate: convRate,
        };
      });
  }, [campaignAnalytics]);

  const sortedCampaigns = useMemo(() => {
    const rows = [...campaignAnalytics];
    rows.sort((a, b) => {
      const leftDate = a.sent_at || a.created_at || '';
      const rightDate = b.sent_at || b.created_at || '';
      const leftSent = a.stats?.total_sent ?? 0;
      const rightSent = b.stats?.total_sent ?? 0;
      const leftDelivery = a.delivery_rate ?? a.stats?.delivery_rate ?? 0;
      const rightDelivery = b.delivery_rate ?? b.stats?.delivery_rate ?? 0;
      const leftOpen = a.open_rate ?? a.stats?.open_rate ?? 0;
      const rightOpen = b.open_rate ?? b.stats?.open_rate ?? 0;
      const leftClick = a.click_rate ?? a.stats?.click_rate ?? 0;
      const rightClick = b.click_rate ?? b.stats?.click_rate ?? 0;
      const leftConversions = a.stats?.conversions ?? 0;
      const rightConversions = b.stats?.conversions ?? 0;
      const leftAttributed = a.stats?.attributed_orders ?? a.attributed_orders ?? 0;
      const rightAttributed = b.stats?.attributed_orders ?? b.attributed_orders ?? 0;

      const leftStats = a.stats ?? a.campaign_stats;
      const leftBase = Array.isArray(leftStats) ? leftStats[0] : leftStats;
      const leftConvRate = a.conversion_rate ?? (
        leftBase && leftBase.total_sent > 0
          ? Math.round((leftBase.conversions / leftBase.total_sent) * 100)
          : 0
      );

      const rightStats = b.stats ?? b.campaign_stats;
      const rightBase = Array.isArray(rightStats) ? rightStats[0] : rightStats;
      const rightConvRate = b.conversion_rate ?? (
        rightBase && rightBase.total_sent > 0
          ? Math.round((rightBase.conversions / rightBase.total_sent) * 100)
          : 0
      );

      let comparison = 0;

      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'channel':
          comparison = (a.channel || '').localeCompare(b.channel || '');
          break;
        case 'sent':
          comparison = leftSent - rightSent;
          break;
        case 'delivery_rate':
          comparison = leftDelivery - rightDelivery;
          break;
        case 'open_rate':
          comparison = leftOpen - rightOpen;
          break;
        case 'click_rate':
          comparison = leftClick - rightClick;
          break;
        case 'conversions':
          comparison = leftConversions - rightConversions;
          break;
        case 'conversion_rate':
          comparison = leftConvRate - rightConvRate;
          break;
        case 'attributed_orders':
          comparison = leftAttributed - rightAttributed;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'date':
        default:
          comparison = new Date(leftDate).getTime() - new Date(rightDate).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [campaignAnalytics, sortDirection, sortKey]);

  const highestOpenRate = campaignAnalytics.reduce((max, campaign) => {
    const value = campaign.open_rate ?? campaign.stats?.open_rate ?? 0;
    return Math.max(max, value);
  }, 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  }

  function renderSortIndicator(key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-slate-400" />;
    return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="ml-1 h-3.5 w-3.5 text-indigo-600" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {overviewLoading ? (
          Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)
        ) : (
          <>
            <StatCard title="Total Campaigns" value={overview?.total_campaigns ?? 0} icon={Megaphone} color="bg-indigo-600" />
            <StatCard title="Total Sent" value={overview?.total_sent?.toLocaleString('en-IN') ?? '0'} icon={Send} color="bg-blue-500" />
            <StatCard title="Overall Delivery Rate" value={formatPercentage(overview?.delivery_rate ?? 0)} icon={CheckCircle} color="bg-green-500" />
            <StatCard title="Overall Open Rate" value={formatPercentage(overview?.open_rate ?? 0)} icon={Eye} color="bg-purple-500" />
            <StatCard title="Total Conversions" value={overview?.total_conversions?.toLocaleString('en-IN') ?? '0'} icon={ShoppingCart} color="bg-rose-500" subtitle={`${overview?.total_attributed_orders ?? 0} orders`} />
            <StatCard title="Overall Conv. Rate" value={formatPercentage(overview?.conversion_rate ?? 0)} icon={TrendingUp} color="bg-indigo-500" />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Channel Performance</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Performance by communication channel</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Sent" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Opened" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Conversions" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Campaign Delivery Rates</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Compare delivery, open, and conversion metrics</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deliveryRateData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                  <Legend />
                  <Bar dataKey="deliveryRate" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="openRate" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversionRate" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <TableSkeleton />
          ) : campaignAnalytics.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No campaign data yet"
              description="Campaign analytics will appear here once campaigns are created."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                      <div className="flex items-center">Campaign{renderSortIndicator('name')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('channel')}>
                      <div className="flex items-center">Channel{renderSortIndicator('channel')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('sent')}>
                      <div className="flex items-center">Sent{renderSortIndicator('sent')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('delivery_rate')}>
                      <div className="flex items-center">Delivery%{renderSortIndicator('delivery_rate')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('open_rate')}>
                      <div className="flex items-center">Open%{renderSortIndicator('open_rate')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('click_rate')}>
                      <div className="flex items-center">Click%{renderSortIndicator('click_rate')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('conversions')}>
                      <div className="flex items-center">Conversions{renderSortIndicator('conversions')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('attributed_orders')}>
                      <div className="flex items-center">Orders{renderSortIndicator('attributed_orders')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('conversion_rate')}>
                      <div className="flex items-center">Conv.%{renderSortIndicator('conversion_rate')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('status')}>
                      <div className="flex items-center">Status{renderSortIndicator('status')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('date')}>
                      <div className="flex items-center">Date{renderSortIndicator('date')}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCampaigns.map((campaign) => {
                    const stats = getCampaignStats(campaign.stats ?? campaign.campaign_stats);
                    const openRate = campaign.open_rate ?? stats?.open_rate ?? 0;
                    const deliveryRate = campaign.delivery_rate ?? stats?.delivery_rate ?? 0;
                    const clickRate = campaign.click_rate ?? stats?.click_rate ?? 0;
                    const sentValue = stats?.total_sent ?? 0;
                    const conversionsValue = stats?.conversions ?? 0;
                    const attributedOrdersValue = stats?.attributed_orders ?? campaign.attributed_orders ?? 0;
                    const conversionRate = campaign.conversion_rate ?? (
                      stats && stats.total_sent > 0
                        ? Math.round((stats.conversions / stats.total_sent) * 100)
                        : 0
                    );
                    const date = campaign.sent_at || campaign.created_at;

                    return (
                      <TableRow
                        key={campaign.id}
                        className={openRate === highestOpenRate ? 'border-l-4 border-l-indigo-600 bg-indigo-50/30' : ''}
                      >
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <ChannelIcon channel={campaign.channel} />
                        </TableCell>
                        <TableCell>{sentValue.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{formatPercentage(deliveryRate)}</TableCell>
                        <TableCell>{formatPercentage(openRate)}</TableCell>
                        <TableCell>{formatPercentage(clickRate)}</TableCell>
                        <TableCell>{conversionsValue.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{attributedOrdersValue.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{formatPercentage(conversionRate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell>{formatRelativeDate(date)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
