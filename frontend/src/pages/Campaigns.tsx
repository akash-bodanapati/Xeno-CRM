import { useQuery, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
  Check,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  createCampaign,
  getCampaigns,
  launchCampaign,
} from '@/api/campaigns';
import { draftMessage, getSegments } from '@/api/segments';
import ChannelIcon from '@/components/shared/ChannelIcon';
import EmptyState from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatPercentage, formatRelativeDate } from '@/lib/utils';
import type { Campaign, CampaignStats, Segment } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type CampaignRow = Campaign & {
  campaign_stats?: CampaignStats | CampaignStats[];
  segments?: { name: string; customer_count?: number } | Segment;
};

type Channel = Campaign['channel'];

interface CampaignForm {
  name: string;
  segment_id: string;
  channel: Channel | '';
  message_template: string;
  ai_generated: boolean;
}

const CHANNELS: Array<{
  id: Channel;
  label: string;
  subtitle: string;
  icon: typeof MessageCircle;
  color: string;
  bg: string;
}> = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    subtitle: 'Rich messaging',
    icon: MessageCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    id: 'sms',
    label: 'SMS',
    subtitle: 'Universal reach',
    icon: Phone,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'email',
    label: 'Email',
    subtitle: 'Detailed content',
    icon: Mail,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    id: 'rcs',
    label: 'RCS',
    subtitle: 'Next-gen SMS',
    icon: Zap,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
];

const EMPTY_FORM: CampaignForm = {
  name: '',
  segment_id: '',
  channel: '',
  message_template: '',
  ai_generated: false,
};

function getCampaignStats(campaign: CampaignRow): CampaignStats | undefined {
  const stats = campaign.campaign_stats ?? campaign.stats;
  if (Array.isArray(stats)) return stats[0];
  return stats;
}

function getSegmentName(campaign: CampaignRow): string {
  if (!campaign.segments) return '—';
  if (typeof campaign.segments === 'object' && 'name' in campaign.segments) {
    return campaign.segments.name;
  }
  return '—';
}

function getDeliveryRate(stats?: CampaignStats): string {
  if (!stats) return '0%';
  if (stats.delivery_rate != null) return formatPercentage(stats.delivery_rate);
  if (stats.total_sent === 0) return '0%';
  return formatPercentage((stats.total_delivered / stats.total_sent) * 100);
}

function getOpenRate(stats?: CampaignStats): string {
  if (!stats) return '0%';
  if (stats.open_rate != null) return formatPercentage(stats.open_rate);
  if (stats.total_delivered === 0) return '0%';
  return formatPercentage((stats.total_opened / stats.total_delivered) * 100);
}

function MessagePreview({ text }: { text: string }) {
  const parts = text.split(/(\{\{name\}\})/gi);
  return (
    <p className="text-sm leading-relaxed text-slate-700">
      {parts.map((part, index) =>
        part.toLowerCase() === '{{name}}' ? (
          <span key={index} className="font-bold text-indigo-600">
            {'{{name}}'}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: 'Setup' },
    { num: 2, label: 'Message' },
    { num: 3, label: 'Review' },
  ] as const;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((item, index) => {
          const isDone = step > item.num;
          const isActive = step === item.num;
          return (
            <div key={item.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
                    isDone && 'border-green-500 bg-green-500 text-white',
                    isActive && 'border-indigo-600 bg-indigo-600 text-white',
                    !isDone && !isActive && 'border-slate-300 bg-white text-slate-400'
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : item.num}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-indigo-700' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    step > item.num ? 'bg-green-500' : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [draftingMessage, setDraftingMessage] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = (await getCampaigns()) as unknown as ApiResponse<CampaignRow[]>;
      return res.data;
    },
  });

  const { data: segments } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const res = (await getSegments()) as unknown as ApiResponse<Segment[]>;
      return res.data;
    },
  });

  const segmentList = segments ?? [];
  const campaignList = campaigns ?? [];

  const selectedSegment = useMemo(
    () => segmentList.find((s) => s.id === form.segment_id),
    [segmentList, form.segment_id]
  );

  useEffect(() => {
    const segmentId = searchParams.get('segment');
    if (segmentId && segmentList.some((s) => s.id === segmentId)) {
      setForm((prev) => ({ ...prev, segment_id: segmentId }));
      setShowCreateDialog(true);
      setStep(1);
    }
  }, [searchParams, segmentList]);

  const resetWizard = () => {
    setStep(1);
    setForm(EMPTY_FORM);
    setDraftingMessage(false);
    setLaunching(false);
  };

  const handleOpenDialog = () => {
    resetWizard();
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    resetWizard();
  };

  const step1Valid =
    form.name.trim().length > 0 && !!form.segment_id && !!form.channel && segmentList.length > 0;

  const step2Valid = form.message_template.trim().length > 0;

  const handleDraftMessage = async () => {
    if (!form.segment_id || !form.channel) return;

    setDraftingMessage(true);
    try {
      const res = (await draftMessage({
        segment_id: form.segment_id,
        channel: form.channel,
        goal: 'engagement',
      })) as unknown as ApiResponse<{
        message_template: string;
        ai_generated: boolean;
      }>;

      setForm((prev) => ({
        ...prev,
        message_template: res.data.message_template,
        ai_generated: true,
      }));
      toast.success('Message drafted with AI ✨');
    } catch {
      toast.error('Failed to generate message');
    } finally {
      setDraftingMessage(false);
    }
  };

  const handleLaunchCampaign = async (campaignId: string) => {
    setLaunchingId(campaignId);
    try {
      await launchCampaign(campaignId);
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      await queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign launched successfully! 🚀');
      return true;
    } catch {
      toast.error('Failed to launch campaign');
      return false;
    } finally {
      setLaunchingId(null);
    }
  };

  const handleLaunch = async () => {
    if (!form.channel) return;

    setLaunching(true);
    try {
      const createRes = (await createCampaign({
        name: form.name.trim(),
        segment_id: form.segment_id,
        channel: form.channel,
        message_template: form.message_template.trim(),
        ai_generated: form.ai_generated,
      })) as unknown as ApiResponse<Campaign>;

      const campaignId = createRes.data.id;
      const ok = await handleLaunchCampaign(campaignId);

      if (ok) {
        confetti({
          particleCount: 120,
          spread: 80,
          colors: ['#B45309', '#F59E0B', '#FCD34D', '#ffffff'],
        });
        handleCloseDialog();
        setTimeout(() => navigate(`/campaigns/${campaignId}`), 1500);
      }
    } catch {
      toast.error('Failed to launch campaign');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <Badge variant="outline" className="border-0 bg-slate-100 text-slate-700">
            {campaignList.length} total
          </Badge>
        </div>
        <Button
          className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm"
          onClick={handleOpenDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : campaignList.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Launch your first campaign to reach customers across WhatsApp, SMS, email, or RCS."
          actionLabel="Create your first campaign"
          onAction={handleOpenDialog}
        />
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered%</TableHead>
                <TableHead>Opened%</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignList.map((campaign) => {
                const stats = getCampaignStats(campaign);
                const attributedOrders = stats?.attributed_orders ?? campaign.attributed_orders ?? 0;
                return (
                  <TableRow
                    key={campaign.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{getSegmentName(campaign)}</TableCell>
                    <TableCell>
                      <ChannelIcon channel={campaign.channel} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={campaign.status} />
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleLaunchCampaign(campaign.id);
                            }}
                            disabled={launchingId === campaign.id}
                          >
                            {launchingId === campaign.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            Launch
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{stats?.total_sent ?? 0}</TableCell>
                    <TableCell>{getDeliveryRate(stats)}</TableCell>
                    <TableCell>{getOpenRate(stats)}</TableCell>
                    <TableCell>{stats?.conversions?.toLocaleString('en-IN') ?? 0}</TableCell>
                    <TableCell>{attributedOrders.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{formatRelativeDate(campaign.sent_at || campaign.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>

          <StepIndicator step={step} />

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="campaign-name" className="text-sm font-medium">
                  Campaign Name *
                </label>
                <Input
                  id="campaign-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. VIP Re-engagement Blast"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Segment *</label>
                {segmentList.length > 0 ? (
                  <Select
                    value={form.segment_id || undefined}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, segment_id: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {segmentList.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name} ({segment.customer_count} customers)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm text-slate-600">
                      No segments are available yet. Create one first to continue.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={() => navigate('/segments')}
                    >
                      Go to Segments
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Channel *</label>
                <div className="grid grid-cols-2 gap-3">
                  {CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    const selected = form.channel === channel.id;
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, channel: channel.id }))
                        }
                        className={cn(
                          'rounded-lg border-2 p-3 text-left transition-colors',
                          selected
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className={cn('mb-2 inline-flex rounded-lg p-2', channel.bg)}>
                          <Icon className={cn('h-5 w-5', channel.color)} />
                        </div>
                        <p className="font-semibold text-slate-900">{channel.label}</p>
                        <p className="text-xs text-muted-foreground">{channel.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Next →
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="message-template" className="text-sm font-medium">
                    Message
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {form.message_template.length} characters
                  </span>
                </div>
                <Textarea
                  id="message-template"
                  rows={6}
                  value={form.message_template}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      message_template: e.target.value,
                      ai_generated: false,
                    }))
                  }
                  placeholder="Write your campaign message. Use {{name}} for personalization."
                />
              </div>

              <Button
                variant="outline"
                className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50/50 font-semibold"
                disabled={draftingMessage || !form.segment_id || !form.channel}
                onClick={handleDraftMessage}
              >
                {draftingMessage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI ✨
                  </>
                )}
              </Button>

              {form.ai_generated && (
                <Badge className="border-0 bg-indigo-50 text-indigo-700 font-semibold">
                  AI Generated ✨
                </Badge>
              )}

              {form.message_template && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Preview
                    </p>
                    <MessagePreview text={form.message_template} />
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
                  disabled={!step2Valid}
                  onClick={() => setStep(3)}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-3 pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Campaign Name</p>
                    <p className="font-semibold">{form.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Segment</p>
                    <p className="font-semibold">
                      {selectedSegment?.name ?? '—'} (
                      {selectedSegment?.customer_count ?? 0} customers)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Channel</p>
                    {form.channel && <ChannelIcon channel={form.channel} />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Message Preview</p>
                    <MessagePreview text={form.message_template} />
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-sm text-indigo-900 font-medium">
                This will send to {selectedSegment?.customer_count ?? 0} customers
                immediately.
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  ← Back
                </Button>
              </div>

              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm"
                disabled={launching}
                onClick={handleLaunch}
              >
                {launching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  '🚀 Launch Campaign'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
