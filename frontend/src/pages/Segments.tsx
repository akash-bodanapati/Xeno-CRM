import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  createSegment,
  deleteSegment,
  getSegments,
  getSegmentMembers,
  suggestSegment,
} from '@/api/segments';
import EmptyState from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatRelativeDate, formatCurrency } from '@/lib/utils';
import type { FilterRules, Segment, Customer } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface AiSuggestion {
  name: string;
  description: string;
  filter_rules: FilterRules;
  estimated_count: number;
}

interface ManualForm {
  name: string;
  description: string;
  city: string;
  min_spent: string;
  max_spent: string;
  churned_days: string;
  min_orders: string;
}

interface FilterRulesPayload {
  logic: 'AND' | 'OR';
  rules: Array<{
    field: string;
    operator: string;
    value: string | number | string[];
  }>;
}

const CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Kolkata',
];

const EMPTY_MANUAL_FORM: ManualForm = {
  name: '',
  description: '',
  city: 'all',
  min_spent: '',
  max_spent: '',
  churned_days: '',
  min_orders: '',
};

function normalizeFilterRules(rules: FilterRules): FilterRulesPayload {
  const maybeRules = rules as FilterRules & {
    rules?: Array<{ field: string; operator: string; value: string | number | string[] }>;
    logic?: 'AND' | 'OR';
  };

  if (Array.isArray(maybeRules.rules) && maybeRules.rules.length > 0) {
    return {
      logic: maybeRules.logic ?? 'AND',
      rules: maybeRules.rules.map((rule) => ({
        field: String(rule.field),
        operator: rule.operator,
        value: rule.value,
      })),
    };
  }

  const built: FilterRulesPayload['rules'] = [];
  if (rules.city) {
    built.push({ field: 'city', operator: 'eq', value: rules.city });
  }
  if (rules.min_spent != null) {
    built.push({ field: 'total_spent', operator: 'gte', value: rules.min_spent });
  }
  if (rules.max_spent != null) {
    built.push({ field: 'total_spent', operator: 'lte', value: rules.max_spent });
  }
  if (rules.churned_days != null) {
    const isTimestamp = typeof rules.churned_days === 'string' && isNaN(Number(rules.churned_days));
    const value = isTimestamp 
      ? rules.churned_days 
      : new Date(Date.now() - Number(rules.churned_days) * 24 * 60 * 60 * 1000).toISOString();
    built.push({
      field: 'last_order_date',
      operator: 'days_ago_gt',
      value,
    });
  }
  if (rules.min_orders != null) {
    built.push({ field: 'total_orders', operator: 'gte', value: rules.min_orders });
  }
  if (rules.tags?.length) {
    built.push({ field: 'tags', operator: 'in', value: rules.tags });
  }

  return { logic: 'AND', rules: built };
}

function getDaysFromValue(value: string | number | string[]): number {
  const num = Number(value);
  if (!isNaN(num)) return num;
  const valDate = new Date(String(value));
  if (!isNaN(valDate.getTime())) {
    return Math.round((Date.now() - valDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
}

function describeFilterRules(rules: FilterRules): string[] {
  const normalized = normalizeFilterRules(rules);
  return normalized.rules.map((rule) => {
    switch (rule.field) {
      case 'city':
        return `City: ${rule.value}`;
      case 'total_spent':
        return rule.operator === 'gte'
          ? `Min spent: ₹${rule.value}`
          : `Max spent: ₹${rule.value}`;
      case 'last_order_date':
        return `Churned: ${getDaysFromValue(rule.value)} days`;
      case 'total_orders':
        return `Min orders: ${rule.value}`;
      case 'tags':
        return `Tags: ${Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}`;
      default:
        return `${rule.field} ${rule.operator} ${rule.value}`;
    }
  });
}

function buildFilterRulesFromManual(form: ManualForm): FilterRulesPayload {
  const flat: FilterRules = {};
  if (form.city && form.city !== 'all') flat.city = form.city;
  if (form.min_spent) flat.min_spent = Number(form.min_spent);
  if (form.max_spent) flat.max_spent = Number(form.max_spent);
  if (form.churned_days) flat.churned_days = Number(form.churned_days);
  if (form.min_orders) flat.min_orders = Number(form.min_orders);
  return normalizeFilterRules(flat);
}

export default function Segments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [aiDescription, setAiDescription] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [manualForm, setManualForm] = useState<ManualForm>(EMPTY_MANUAL_FORM);
  const [creating, setCreating] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);

  const { data: segments, isLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const res = (await getSegments()) as unknown as ApiResponse<Segment[]>;
      return res.data;
    },
  });

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const { data: segmentDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['segment-members', selectedSegmentId],
    queryFn: async () => {
      if (!selectedSegmentId) return null;
      const res = (await getSegmentMembers(selectedSegmentId)) as unknown as ApiResponse<Segment & { customers: Customer[] }>;
      return res.data;
    },
    enabled: !!selectedSegmentId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSegment,
    onSuccess: () => {
      toast.success('Segment deleted');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.error ?? err?.message ?? 'Failed to delete segment';
      toast.error(errMsg);
    },
  });

  const resetDialog = () => {
    setActiveTab('manual');
    setAiDescription('');
    setAiSuggestion(null);
    setAiLoading(false);
    setManualForm(EMPTY_MANUAL_FORM);
    setCreating(false);
  };

  const handleOpenDialog = () => {
    resetDialog();
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    resetDialog();
  };

  const handleManualCreate = async () => {
    if (!manualForm.name.trim()) {
      toast.error('Segment name is required');
      return;
    }

    setCreating(true);
    try {
      await createSegment({
        name: manualForm.name.trim(),
        description: manualForm.description.trim() || undefined,
        filter_rules: buildFilterRulesFromManual(manualForm),
        created_by_ai: false,
      });
      toast.success('Segment created!');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      handleCloseDialog();
    } catch {
      toast.error('Failed to create segment');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateAi = async () => {
    if (aiDescription.trim().length < 5) {
      toast.error('Please describe your audience in more detail');
      return;
    }

    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = (await suggestSegment(aiDescription.trim())) as unknown as ApiResponse<AiSuggestion>;
      setAiSuggestion(res.data);
    } catch {
      toast.error('Failed to generate segment');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiCreate = async () => {
    if (!aiSuggestion) return;

    setCreating(true);
    try {
      await createSegment({
        name: aiSuggestion.name,
        description: aiSuggestion.description,
        filter_rules: normalizeFilterRules(aiSuggestion.filter_rules),
        created_by_ai: true,
      });
      toast.success('AI segment created! ✨');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      handleCloseDialog();
    } catch {
      toast.error('Failed to create segment');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (segment: Segment) => {
    setSegmentToDelete(segment);
  };

  const segmentList = segments ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Segments</h1>
          <Badge variant="outline" className="border-0 bg-slate-100 text-slate-700">
            {segmentList.length} total
          </Badge>
        </div>
        <Button
          className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm"
          onClick={handleOpenDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : segmentList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No segments yet"
          description="Create a segment manually or let AI build one from a description."
          actionLabel="Create your first segment"
          onAction={handleOpenDialog}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {segmentList.map((segment) => (
            <Card key={segment.id} className="flex flex-col border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
              <CardContent 
                className="flex flex-1 flex-col gap-3 pt-6 cursor-pointer hover:bg-slate-50/30 transition-colors"
                onClick={() => setSelectedSegmentId(segment.id)}
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{segment.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {segment.description || 'No description'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-slate-900">
                    {segment.customer_count}
                  </span>
                  <span>customers</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {segment.created_by_ai && (
                    <Badge className="border-0 bg-indigo-50 text-indigo-700 font-semibold">
                      <Sparkles className="mr-1 h-3 w-3" />
                      AI Generated
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(segment.created_at)}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  className="flex-1 justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/campaigns?segment=${segment.id}`);
                  }}
                >
                  Use in Campaign →
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(segment);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Segment</DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'manual' | 'ai')}
          >
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">
                Manual Builder
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">
                Ask AI ✨
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="segment-name" className="text-sm font-medium">
                  Segment Name *
                </label>
                <Input
                  id="segment-name"
                  value={manualForm.name}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. VIP Mumbai Customers"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="segment-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="segment-description"
                  value={manualForm.description}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What defines this audience?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Select
                  value={manualForm.city}
                  onValueChange={(value) =>
                    setManualForm((prev) => ({ ...prev, city: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="min-spent" className="text-sm font-medium">
                    Min Spent ₹
                  </label>
                  <Input
                    id="min-spent"
                    type="number"
                    placeholder="e.g. 2000"
                    value={manualForm.min_spent}
                    onChange={(e) =>
                      setManualForm((prev) => ({ ...prev, min_spent: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="max-spent" className="text-sm font-medium">
                    Max Spent ₹
                  </label>
                  <Input
                    id="max-spent"
                    type="number"
                    placeholder="e.g. 10000"
                    value={manualForm.max_spent}
                    onChange={(e) =>
                      setManualForm((prev) => ({ ...prev, max_spent: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="churned-days" className="text-sm font-medium">
                    Churned in last X days
                  </label>
                  <Input
                    id="churned-days"
                    type="number"
                    placeholder="e.g. 90"
                    value={manualForm.churned_days}
                    onChange={(e) =>
                      setManualForm((prev) => ({ ...prev, churned_days: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="min-orders" className="text-sm font-medium">
                    Min Orders
                  </label>
                  <Input
                    id="min-orders"
                    type="number"
                    placeholder="e.g. 3"
                    value={manualForm.min_orders}
                    onChange={(e) =>
                      setManualForm((prev) => ({ ...prev, min_orders: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
                disabled={creating}
                onClick={handleManualCreate}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Segment
              </Button>
            </TabsContent>

            <TabsContent value="ai" className="mt-4 space-y-4">
              <Textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder={
                  'Describe your audience...\ne.g. "customers who spent over ₹3000 but haven\'t ordered in 2 months"'
                }
                rows={4}
              />

              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
                disabled={aiLoading}
                onClick={handleGenerateAi}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI is thinking...
                  </>
                ) : (
                  'Generate Segment ✨'
                )}
              </Button>

              {aiSuggestion && (
                <div className="space-y-4 rounded-lg border-2 border-green-500 bg-green-50/50 p-4">
                  <p className="font-semibold text-green-800">✓ Segment Preview</p>
                  <div>
                    <p className="font-bold text-slate-900">{aiSuggestion.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {aiSuggestion.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {describeFilterRules(aiSuggestion.filter_rules).map((label) => (
                      <Badge
                        key={label}
                        variant="outline"
                        className="border-0 bg-white text-slate-700"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    Matches ~{aiSuggestion.estimated_count} customers
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleGenerateAi}
                      disabled={aiLoading}
                    >
                      Regenerate
                    </Button>
                    <Button
                      className={cn(
                        'flex-1 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold'
                      )}
                      disabled={creating}
                      onClick={handleAiCreate}
                    >
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create This Segment ✓
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={segmentToDelete !== null} onOpenChange={(open) => !open && setSegmentToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-semibold flex items-center gap-2">
              Delete Segment
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-1">
              Are you sure you want to delete the segment <strong>{segmentToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground bg-red-50 p-2.5 rounded-lg border border-red-100 leading-relaxed">
              Warning: This will clear customer segment assignments, but campaigns using this segment will remain active with their targets cleared.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSegmentToDelete(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={() => {
                if (segmentToDelete) {
                  deleteMutation.mutate(segmentToDelete.id);
                  setSegmentToDelete(null);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Segment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={selectedSegmentId !== null} onOpenChange={(open) => !open && setSelectedSegmentId(null)}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-[600px] md:max-w-[750px] lg:max-w-[850px]"
        >
          {selectedSegmentId && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-2xl font-bold truncate">
                  {segmentDetails?.name || 'Loading segment...'}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {segmentDetails?.description || 'No description provided'}
                </SheetDescription>
              </SheetHeader>

              {detailsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : segmentDetails ? (
                <div className="space-y-6 pt-6">
                  {/* Filter Rules Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Filter Rules</h4>
                    <div className="flex flex-wrap gap-2">
                      {segmentDetails.filter_rules && describeFilterRules(segmentDetails.filter_rules).length > 0 ? (
                        describeFilterRules(segmentDetails.filter_rules).map((ruleDesc, idx) => (
                          <Badge key={idx} variant="outline" className="border-0 bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1">
                            {ruleDesc}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No custom filter rules defined</span>
                      )}
                    </div>
                  </div>

                  {/* Matching customer count */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">
                      {segmentDetails.customer_count}
                    </span>
                    <span>matching customers</span>
                  </div>

                  {/* Customers Table */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="overflow-x-auto w-full">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold text-slate-700">Name</TableHead>
                            <TableHead className="font-semibold text-slate-700">Email</TableHead>
                            <TableHead className="font-semibold text-slate-700">Phone</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Total Spent</TableHead>
                            <TableHead className="font-semibold text-slate-700">Last Order Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {segmentDetails.customers && segmentDetails.customers.length > 0 ? (
                            segmentDetails.customers.map((customer: Customer) => (
                              <TableRow key={customer.id}>
                                <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                                  {customer.name}
                                </TableCell>
                                <TableCell className="text-slate-600 whitespace-nowrap">
                                  {customer.email || '—'}
                                </TableCell>
                                <TableCell className="text-slate-600 whitespace-nowrap">
                                  {customer.phone || '—'}
                                </TableCell>
                                <TableCell className="text-right text-slate-900 font-medium whitespace-nowrap">
                                  {formatCurrency(customer.total_spent)}
                                </TableCell>
                                <TableCell className="text-slate-600 whitespace-nowrap">
                                  {formatRelativeDate(customer.last_order_date)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No matching customers found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Failed to load segment details.
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
