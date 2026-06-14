import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowUp,
  BarChart3,
  CheckCircle,
  Lightbulb,
  Sparkles,
  Users,
  TrendingUp,
  Zap,
  Menu,
  History,
  Trash2,
  Plus,
} from 'lucide-react';
import { chat } from '@/api/ai';
import { getCampaigns } from '@/api/campaigns';
import { getOverview } from '@/api/analytics';
import { createSegment, getSegments, getSegment } from '@/api/segments';
import { getCustomers } from '@/api/customers';
import ChannelIcon from '@/components/shared/ChannelIcon';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { AIAction, Campaign, ChatMessage, Segment } from '@/types';

interface OverviewData {
  total_customers: number;
  total_campaigns: number;
  active_campaigns?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  activeSegment?: any;
}

const suggestionPills = [
  { icon: '🔍', label: 'Find customers inactive for 90 days', query: "Find customers inactive for 90 days" },
  { icon: '✉️', label: 'Draft a WhatsApp re-engagement campaign', query: "Draft a WhatsApp re-engagement campaign" },
  { icon: '📊', label: 'Show me top spenders this month', query: "Show me top spenders this month" },
  { icon: '🎯', label: 'Analyze my last campaign performance', query: "Analyze my last campaign performance" },
];

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const value = (payload as { data?: T }).data;
    if (value !== undefined) return value as T;
  }

  return payload as T;
}

function formatFilterValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState<any>(null);
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});

  const { data: segments = [], isLoading: segmentsLoading } = useQuery<Segment[]>({
    queryKey: ['segments'],
    queryFn: async () => {
      const res = (await getSegments()) as unknown as ApiResponse<Segment[]> | Segment[];
      return unwrapData<Segment[]>(res);
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = (await getCampaigns()) as unknown as ApiResponse<Campaign[]> | Campaign[];
      return unwrapData<Campaign[]>(res);
    },
  });

  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewData>({
    queryKey: ['overview'],
    queryFn: async () => {
      const res = (await getOverview()) as unknown as ApiResponse<OverviewData> | OverviewData;
      return unwrapData<OverviewData>(res);
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-stats'],
    queryFn: async () => {
      const res = (await getCustomers({ limit: 100 })) as any;
      return unwrapData<any>(res);
    },
  });

  const avgRevenue = useMemo(() => {
    const custs = customersData?.customers ?? [];
    if (custs.length === 0) return 0;
    const totalSpent = custs.reduce((sum: number, c: any) => sum + (c.total_spent ?? 0), 0);
    return Math.round(totalSpent / custs.length);
  }, [customersData]);

  const recentCampaigns = campaigns.slice(0, 3);

  // Load chat sessions on mount
  useEffect(() => {
    const stored = localStorage.getItem('aria_sessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChatSession[];
        if (parsed.length > 0) {
          setSessions(parsed);
          const sorted = [...parsed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const latest = sorted[0];
          setCurrentSessionId(latest.id);
          setMessages(latest.messages);
          if (latest.activeSegment) {
            setActiveSegment(latest.activeSegment);
          }
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Sync current session updates back to sessions state & localStorage
  useEffect(() => {
    if (!currentSessionId) return;

    setSessions(prev => {
      const sessionIndex = prev.findIndex(s => s.id === currentSessionId);
      if (sessionIndex === -1) return prev;

      const session = prev[sessionIndex];
      const updatedMessages = messages;
      let newTitle = session.title;

      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        newTitle = firstUserMsg.content.slice(0, 30);
        if (firstUserMsg.content.length > 30) {
          newTitle += '...';
        }
      }

      if (
        session.title !== newTitle ||
        session.messages !== updatedMessages ||
        JSON.stringify(session.activeSegment) !== JSON.stringify(activeSegment)
      ) {
        const updatedSession = {
          ...session,
          title: newTitle,
          messages: updatedMessages,
          activeSegment: activeSegment,
        };
        const newSessions = [...prev];
        newSessions[sessionIndex] = updatedSession;
        localStorage.setItem('aria_sessions', JSON.stringify(newSessions));
        return newSessions;
      }
      return prev;
    });
  }, [messages, currentSessionId, activeSegment]);

  // Create new session
  function createNewSession() {
    const newSession: ChatSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      title: 'New Discussion',
      createdAt: new Date().toISOString(),
      messages: [],
    };

    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('aria_sessions', JSON.stringify(updated));
      return updated;
    });
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setActiveSegment(null);
  }

  // Load selected session
  function loadSession(id: string) {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setActiveSegment(session.activeSegment || null);
    }
  }

  // Delete chat session
  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();

    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('aria_sessions', JSON.stringify(updated));

      if (currentSessionId === id) {
        if (updated.length > 0) {
          setCurrentSessionId(updated[0].id);
          setMessages(updated[0].messages);
          setActiveSegment(updated[0].activeSegment || null);
        } else {
          setTimeout(() => {
            createNewSession();
          }, 0);
        }
      }
      return updated;
    });
  }

  // BUG 1 — Fetch counts for segments rendered in intelligence cards if missing
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.action?.type === 'create_segment') {
        const payload = msg.action.payload ?? {};
        const name = payload.name;
        const hasDbCount = payload.customer_count !== undefined && payload.customer_count !== null;
        
        if (!hasDbCount && name && segmentCounts[name] === undefined) {
          getSegments().then((res: any) => {
            const allSegs = unwrapData<Segment[]>(res);
            const found = allSegs.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (found) {
              setSegmentCounts(prev => ({ ...prev, [name]: found.customer_count }));
            }
          }).catch(() => {});
        }
      }
    });
  }, [messages, segmentCounts]);

  // BUG 3 — Fetch active context segment live count from GET /api/segments/:id or GET /api/segments
  useEffect(() => {
    if (!activeSegment) return;

    let isMounted = true;

    async function fetchLiveCount() {
      try {
        let liveSeg: any = null;
        if (activeSegment.id) {
          const res = (await getSegment(activeSegment.id)) as any;
          liveSeg = unwrapData<any>(res);
        } else if (activeSegment.name) {
          const res = (await getSegments()) as any;
          const allSegs = unwrapData<Segment[]>(res);
          liveSeg = allSegs.find(s => s.name.toLowerCase() === activeSegment.name.toLowerCase());
        }

        if (liveSeg && isMounted) {
          setActiveSegment((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              id: liveSeg.id ?? prev.id,
              customer_count: liveSeg.customer_count ?? prev.customer_count,
            };
          });
        }
      } catch (e) {
        console.error("Failed to fetch live segment count", e);
      }
    }

    fetchLiveCount();

    return () => {
      isMounted = false;
    };
  }, [activeSegment?.id, activeSegment?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const trimmedContent = content.trim();
    const userMsg: ChatMessage = { role: 'user', content: trimmedContent };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const context = {
        customers_count: overview?.total_customers ?? 0,
        segments: (segments ?? []).map((segment) => ({
          id: segment.id,
          name: segment.name,
          customer_count: segment.customer_count,
        })),
        recent_campaigns: recentCampaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
        })),
      };

      const res = (await chat(
        newMessages.map((message) => ({ role: message.role, content: message.content })),
        context,
      )) as any;

      const responseData = res?.data ?? res;
      const assistantContent = responseData?.message ?? 'I could not process that.';
      const finalAction = responseData?.action ?? null;

      // KEY FIX: Do NOT auto-save segments here.
      // The action is stored in message state so the user can
      // explicitly click "Save to CRM" if they choose to.
      // Update Active Context panel with the query result (unsaved).
      if (finalAction?.type === 'create_segment' && finalAction.payload?.filter_rules) {
        const realCount = finalAction.payload.real_count ?? finalAction.payload.estimated_count ?? 0;
        const newActiveSeg = {
          id: null, // not yet saved
          name: finalAction.payload.name,
          customer_count: realCount,
          filter_rules: finalAction.payload.filter_rules,
        };
        setActiveSegment(newActiveSeg);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantContent,
          action: finalAction ?? undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Save a proposed segment to CRM when the user explicitly clicks "Save to CRM"
  async function handleSaveSegment(action: AIAction, messageIndex: number) {
    const payload = action.payload ?? {};
    if (!payload.filter_rules || !payload.name) return;

    try {
      const createRes = (await createSegment({
        name: payload.name as string,
        description: payload.description as string | undefined,
        filter_rules: payload.filter_rules as any,
        created_by_ai: true,
      })) as any;

      const createdData = createRes?.data ?? createRes;
      const segmentId = createdData?.id ?? createdData?.data?.id;
      const realCustomerCount = createdData?.customer_count ?? createdData?.data?.customer_count;

      // Update the message's action with the saved segment id
      setMessages((prev) =>
        prev.map((msg, idx) => {
          if (idx !== messageIndex || !msg.action) return msg;
          return {
            ...msg,
            action: {
              ...msg.action,
              payload: {
                ...msg.action.payload,
                id: segmentId,
                customer_count: realCustomerCount,
              },
            },
          };
        })
      );

      // Update active context panel
      setActiveSegment((prev: any) => ({
        ...(prev ?? {}),
        id: segmentId,
        name: payload.name,
        customer_count: realCustomerCount ?? payload.real_count ?? payload.estimated_count ?? 0,
        filter_rules: payload.filter_rules,
      }));

      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success(`Segment '${payload.name as string}' saved to CRM!`);
    } catch (err) {
      toast.error('Failed to save segment. Please try again.');
      console.error('[handleSaveSegment]', err);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  // BUG 4 — Rule-based channel recommendation logic
  const recommendedChannel = useMemo(() => {
    if (!activeSegment) return null;
    const name = (activeSegment.name || '').toLowerCase();
    const desc = (activeSegment.description || '').toLowerCase();
    
    const isInactiveOrChurned = 
      name.includes('inactive') || name.includes('churn') || name.includes('order') || name.includes('day') || name.includes('last') || name.includes('ago') || name.includes('re-engage') || name.includes('dormant') ||
      desc.includes('inactive') || desc.includes('churn') || desc.includes('order') || desc.includes('day') || desc.includes('last') || desc.includes('ago') || desc.includes('re-engage') || desc.includes('dormant');
      
    const isHighSpenderOrVip = 
      name.includes('vip') || name.includes('spend') || name.includes('top') || name.includes('revenue') || name.includes('gold') || name.includes('platinum') || name.includes('high') || name.includes('value') || name.includes('premium') || name.includes('amount') ||
      desc.includes('vip') || desc.includes('spend') || desc.includes('top') || desc.includes('revenue') || desc.includes('gold') || desc.includes('platinum') || desc.includes('high') || desc.includes('value') || desc.includes('premium') || desc.includes('amount');
      
    const isCityOrLocation = 
      name.includes('city') || name.includes('location') || name.includes('bangalore') || name.includes('mumbai') || name.includes('delhi') || name.includes('pune') || name.includes('chennai') || name.includes('kolkata') || name.includes('hyderabad') || name.includes('state') || name.includes('country') || name.includes('region') ||
      desc.includes('city') || desc.includes('location') || desc.includes('bangalore') || desc.includes('mumbai') || desc.includes('delhi') || desc.includes('pune') || desc.includes('chennai') || desc.includes('kolkata') || desc.includes('hyderabad') || desc.includes('state') || desc.includes('country') || desc.includes('region');

    if (isInactiveOrChurned) {
      return {
        channel: 'WhatsApp',
        reasoning: 'WhatsApp is recommended for re-engaging inactive or churned customers due to its high direct response and read rate.',
        openRate: 85,
        conversionRate: 12,
      };
    } else if (isHighSpenderOrVip) {
      return {
        channel: 'Email',
        reasoning: 'Email is recommended for high spenders and VIP customers to share detailed high-quality content or catalogs.',
        openRate: 45,
        conversionRate: 8,
      };
    } else if (isCityOrLocation) {
      return {
        channel: 'SMS',
        reasoning: 'SMS is recommended for targeted location-based filters to deliver time-sensitive updates to local audiences.',
        openRate: 70,
        conversionRate: 10,
      };
    } else {
      return {
        channel: 'WhatsApp',
        reasoning: 'WhatsApp is the default recommended channel for general audiences, maximizing campaign visibility.',
        openRate: 85,
        conversionRate: 12,
      };
    }
  }, [activeSegment]);

  function renderActionCard(action: AIAction | undefined, messageIndex: number) {
    if (!action) return null;

    if (action.type === 'create_segment') {
      const payload = action.payload ?? {};
      const name = payload.name as string;
      const isSaved = !!payload.id;

      // Use real DB count from backend (real_count), then fallback chain
      const displayCount =
        payload.customer_count !== undefined && payload.customer_count !== null
          ? payload.customer_count
          : payload.real_count !== undefined
          ? payload.real_count
          : segmentCounts[name] !== undefined
          ? segmentCounts[name]
          : (payload.estimated_count ?? 0);

      // Build human-readable filter summary from transformed rules
      const filterRules = (payload.filter_rules as any) ?? {};
      const rulesList: Array<{ field: string; operator: string; value: unknown }> =
        Array.isArray(filterRules.rules) ? filterRules.rules : [];
      const logicLabel = (filterRules.logic as string) ?? 'AND';

      return (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 border-t-4 border-t-indigo-600 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 max-w-[90%] md:max-w-[80%]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">Query Executed</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded uppercase tracking-wider">
              {isSaved ? 'Saved' : 'Preview'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matched</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-1">{displayCount as number}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">customers found</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Filters ({logicLabel})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rulesList.length > 0 ? rulesList.map((rule, i) => (
                  <code key={i} className="bg-indigo-50/50 text-indigo-600 px-2 py-0.5 rounded text-xs font-mono border border-indigo-100">
                    {rule.field} {rule.operator} {formatFilterValue(rule.value)}
                  </code>
                )) : (
                  <span className="text-xs text-slate-400">No filters</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {isSaved ? (
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 h-9 cursor-default"
                disabled
              >
                <CheckCircle className="h-4 w-4 mr-1 text-emerald-600" />
                Saved to CRM
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 h-9 font-semibold"
                onClick={() => void handleSaveSegment(action, messageIndex)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Save to CRM
              </Button>
            )}
            {isSaved ? (
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm h-9"
                onClick={() => {
                  navigate(`/campaigns?segment=${String(payload.id)}`);
                }}
              >
                Draft Campaign
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-slate-400 border border-slate-200 h-9"
                disabled
                title="Save the segment first to draft a campaign"
              >
                Draft Campaign
              </Button>
            )}
          </div>
        </motion.div>
      );
    }

    if (action.type === 'draft_message') {
      const payload = action.payload ?? {};

      return (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 border-t-4 border-t-indigo-600 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 max-w-[90%] md:max-w-[80%]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={payload.channel ?? 'whatsapp'} />
              <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">Message Draft Ready</span>
            </div>
            {payload.tone ? (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold rounded uppercase">
                {payload.tone}
              </span>
            ) : null}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 font-mono leading-relaxed select-all">
            {payload.message?.replace(/\{\{name\}\}/g, 'Peter') ?? 'No message generated yet.'}
          </div>
          <div className="flex items-center justify-end pt-1">
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 h-8"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(payload.message ?? '');
                  toast.success('Copied to clipboard!');
                } catch {
                  toast.error('Unable to copy');
                }
              }}
            >
              Copy Message
            </Button>
          </div>
        </motion.div>
      );
    }

    if (action.type === 'show_insight') {
      const payload = action.payload ?? {};
      const highlights = Array.isArray(payload.highlights) ? payload.highlights : [];
      const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];

      return (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 border-t-4 border-t-purple-500 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 max-w-[90%] md:max-w-[80%]"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">Intelligence Insight</span>
          </div>
          {payload.summary ? (
            <p className="text-sm italic text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{payload.summary}</p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Highlights</p>
                {highlights.map((item: string, index: number) => (
                  <div key={`highlight-${index}`} className="flex items-start gap-1.5 text-xs text-slate-700">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
            {recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Recommendations</p>
                {recommendations.map((item: string, index: number) => (
                  <div key={`recommendation-${index}`} className="flex items-start gap-1.5 text-xs text-slate-700">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    return null;
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-white border border-slate-200 rounded-2xl overflow-hidden text-slate-800 font-sans shadow-sm">
      {/* PAST SESSIONS SIDEBAR (Collapsible) */}
      <div className={`flex flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'}`}>
        <div className="p-3 border-b border-slate-200 shrink-0">
          <Button
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 justify-start gap-2 h-9 text-xs font-semibold shadow-sm"
            onClick={createNewSession}
          >
            <Plus className="h-3.5 w-3.5 text-indigo-600" />
            New Discussion
          </Button>
        </div>
        
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
          <span>Discussions</span>
          <History className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`group flex items-center justify-between w-full p-2.5 rounded-lg text-left cursor-pointer transition-colors border-l-4 ${
                  isActive
                    ? 'bg-slate-200/60 text-slate-900 border-l-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-transparent'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold truncate leading-none mb-1">{session.title}</p>
                  <p className="text-[9px] text-slate-400">{dateStr}</p>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT CONTAINER PANEL */}
      <div className="flex flex-col flex-1 h-full bg-white overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 h-8 w-8 shrink-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="font-bold text-base bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Tara Intelligence
            </span>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={createNewSession}
              className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 h-8"
            >
              Clear Session
            </Button>
          </div>
        </div>

        {/* Message / Welcome Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
              <div className="relative flex items-center justify-center h-20 w-20 rounded-full border border-indigo-200 bg-indigo-50 shadow-sm mb-6 animate-pulse">
                <Sparkles className="h-10 w-10 text-indigo-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                What would you like to accomplish today?
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                Ask Tara to discover audiences, generate segments, and launch campaigns from customer data.
              </p>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full px-4">
                {suggestionPills.map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => void sendMessage(pill.query)}
                    className="flex items-start gap-3 text-left p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-indigo-600 hover:bg-slate-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <span className="text-xl shrink-0 leading-none">{pill.icon}</span>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors leading-snug">
                      {pill.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 p-6">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className="w-full">
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-indigo-600 px-4 py-3 text-sm text-white shadow-sm">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5 pl-1 mb-1">
                        <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                          TARA
                        </span>
                      </div>
                      <div className="flex-1 w-full">
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="max-w-[90%] md:max-w-[80%] rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 leading-relaxed shadow-sm markdown-content"
                        >
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </motion.div>
                        {renderActionCard(message.action, index)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading ? (
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5 pl-1 mb-1">
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                      TARA
                    </span>
                  </div>
                  <div className="max-w-[90%] md:max-w-[80%] rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    <div className="flex space-x-1.5 items-center py-2 px-1">
                      <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <div className="flex items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
            <textarea
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your customers..."
              className="min-h-[40px] max-h-[120px] flex-1 resize-none border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-40"
              disabled={!input.trim() || loading}
              onClick={() => void sendMessage(input)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 pl-1">Shift+Enter for new line</p>
        </div>
      </div>

      {/* RIGHT PANEL - Intelligence Sidebar (35% width) */}
      <aside className="flex flex-col w-full lg:w-[35%] h-full bg-slate-50/50 overflow-hidden border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0 h-[65px]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Strategic Context</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1 - ACTIVE CONTEXT */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Context</h3>
            {!activeSegment ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-slate-50">
                Awaiting query...
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Segment</p>
                  <h4 className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{activeSegment.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Audience Size</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{activeSegment.customer_count ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Avg Spend</p>
                    <p className="text-sm font-bold text-indigo-600 mt-0.5">
                      {activeSegment.name.toLowerCase().includes('vip') || activeSegment.name.toLowerCase().includes('spender') ? '₹8,500' : '₹2,400'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold rounded uppercase">
                    {activeSegment.name.toLowerCase().includes('90') || activeSegment.name.toLowerCase().includes('inactive') ? '90d Recency' : 'High Activity'}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase border border-slate-200">
                    AI-Optimized
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2 - DATA SNAPSHOT */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Snapshot</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Total Customers */}
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between shadow-sm min-h-[90px]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 mt-2">
                  {overviewLoading ? '...' : (overview?.total_customers ?? 0)}
                </div>
              </div>

              {/* Active Segments */}
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between shadow-sm min-h-[90px]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Segments</span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 mt-2">
                  {segmentsLoading ? '...' : segments.length}
                </div>
              </div>

              {/* Campaigns Run */}
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between shadow-sm min-h-[90px]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Campaigns Run</span>
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 mt-2">
                  {campaignsLoading ? '...' : (overview?.total_campaigns ?? campaigns.length)}
                </div>
              </div>

              {/* Avg Revenue */}
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between shadow-sm min-h-[90px]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Rev / Cust</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 mt-2">
                  {overviewLoading || !avgRevenue ? '...' : formatCurrency(avgRevenue)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 - RECENT ACTIVITY */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent Activity</h3>
            <div className="space-y-4">
              {/* Segments */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Segments</p>
                <div className="space-y-2">
                  {segmentsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 bg-slate-100" />
                    ))
                  ) : segments.length > 0 ? (
                    segments.slice(0, 3).map((seg) => (
                      <div key={seg.id} className="flex justify-between items-center text-xs bg-white border border-slate-200 p-2.5 rounded-lg animate-fade-in">
                        <span className="font-medium text-slate-700 truncate pr-2">{seg.name}</span>
                        {/* BUG 2 — Label next to customer count changed from pts to customers */}
                        <span className="text-indigo-600 shrink-0 font-semibold font-mono text-[10px]">{seg.customer_count} customers</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">No segments found</div>
                  )}
                </div>
              </div>
              
              {/* Campaigns */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Campaigns</p>
                <div className="space-y-2">
                  {campaignsLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 bg-slate-100" />
                    ))
                  ) : recentCampaigns.length > 0 ? (
                    recentCampaigns.slice(0, 2).map((camp) => (
                      <div key={camp.id} className="flex justify-between items-center text-xs bg-white border border-slate-200 p-2.5 rounded-lg">
                        <span className="font-medium text-slate-700 truncate pr-2">{camp.name}</span>
                        <span className="shrink-0 scale-90 origin-right">
                          <StatusBadge status={camp.status} />
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">No campaigns found</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 - CHANNEL INTELLIGENCE */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Channel Intelligence</h3>
            {!activeSegment || !recommendedChannel ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-slate-50">
                Execute a segment query to see channel analysis
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={recommendedChannel.channel.toLowerCase() as any} />
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recommended: {recommendedChannel.channel}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                    {recommendedChannel.reasoning}
                  </p>
                </div>
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Expected Open Rate</span>
                      <span className="text-indigo-600 font-bold font-mono">{recommendedChannel.openRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 border border-slate-200/50">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1 rounded-full transition-all duration-500" style={{ width: `${recommendedChannel.openRate}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Expected Conv. Rate</span>
                      <span className="text-violet-500 font-bold font-mono">{recommendedChannel.conversionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 border border-slate-200/50">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1 rounded-full transition-all duration-500" style={{ width: `${recommendedChannel.conversionRate}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
