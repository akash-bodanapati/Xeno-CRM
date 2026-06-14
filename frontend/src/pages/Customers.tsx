import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
  Plus,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCustomer, getCustomers, createCustomer } from '@/api/customers';
import { createOrder } from '@/api/orders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ChannelIcon from '@/components/shared/ChannelIcon';
import EmptyState from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { Communication, Customer, Order, Segment } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface CustomersResponse {
  customers: Customer[];
  total: number;
}

interface CustomerDetail extends Customer {
  orders?: Order[];
  segments?: Segment[];
  communications?: (Communication & {
    campaigns?: { name: string };
    campaign?: { name: string };
  })[];
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

const PAGE_SIZE = 20;

function formatOrderItems(items?: Order['items']): string {
  const list = items && typeof items === 'object' && 'items' in items
    ? (items as { items?: string[] }).items
    : undefined;
  return Array.isArray(list) && list.length > 0 ? list.join(', ') : 'No items';
}

function getTagClass(tag: string): string {
  switch (tag.toLowerCase()) {
    case 'vip':
      return 'border-0 bg-amber-100 text-amber-800';
    case 'regular':
      return 'border-0 bg-blue-100 text-blue-800';
    case 'new':
      return 'border-0 bg-green-100 text-green-800';
    default:
      return 'border-0 bg-slate-100 text-slate-700';
  }
}

function CustomerDetailSheet({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [orderAmount, setOrderAmount] = useState('');
  const [orderItems, setOrderItems] = useState('');
  const [orderDate, setOrderDate] = useState('');

  const { data: detail, isLoading } = useQuery({
    queryKey: ['customer', customer?.id],
    queryFn: async () => {
      const res = (await getCustomer(customer!.id)) as unknown as ApiResponse<CustomerDetail>;
      return res.data;
    },
    enabled: !!customer,
  });

  const addOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      toast.success('Order added successfully! ☕');
      queryClient.invalidateQueries({ queryKey: ['customer', customer?.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setOrderAmount('');
      setOrderItems('');
      setOrderDate('');
      setShowAddOrder(false);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.error ?? err?.message ?? 'Failed to add order';
      toast.error(errMsg);
    },
  });

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    if (!orderAmount || !orderItems) {
      toast.error('Amount and Items are required');
      return;
    }
    const amountNum = Number(orderAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }
    const itemsArr = orderItems.split(',').map(i => i.trim()).filter(Boolean);
    if (itemsArr.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    addOrderMutation.mutate({
      customer_id: customer.id,
      amount: amountNum,
      items: itemsArr,
      order_date: orderDate ? new Date(orderDate).toISOString() : undefined,
    });
  };

  const orders = detail?.orders ?? [];
  const segments = detail?.segments ?? [];
  const communications = detail?.communications ?? [];

  return (
    <>
      <Sheet open={!!customer} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-[600px] md:max-w-[750px] lg:max-w-[850px] xl:max-w-[900px]"
        >
          {customer && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-2xl font-bold truncate" title={customer.name}>
                  {customer.name}
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="outline" className="gap-1 border-0 bg-slate-100 shrink-0">
                    <MapPin className="h-3 w-3" />
                    {customer.city}
                  </Badge>
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className={cn(getTagClass(tag), "shrink-0")}>
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-1 pt-2 text-sm text-muted-foreground min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1" title={customer.email}>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1" title={customer.phone}>{customer.phone}</span>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-3 gap-3 bg-slate-50/40 p-3 rounded-xl border border-slate-100/80 my-5">
                <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">Total Spent</p>
                  <p className="mt-1 font-bold text-sm sm:text-base text-slate-900">
                    {formatCurrency(detail?.total_spent ?? customer.total_spent)}
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">Total Orders</p>
                  <p className="mt-1 font-bold text-sm sm:text-base text-slate-900">
                    {detail?.total_orders ?? customer.total_orders}
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">Last Order</p>
                  <p className="mt-1 font-semibold text-xs sm:text-sm text-slate-900 truncate">
                    {formatRelativeDate(detail?.last_order_date ?? customer.last_order_date)}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto p-1 bg-muted gap-1">
                  <TabsTrigger value="orders" className="flex-1 py-1.5 text-xs sm:text-sm">Orders</TabsTrigger>
                  <TabsTrigger value="segments" className="flex-1 py-1.5 text-xs sm:text-sm">Segments</TabsTrigger>
                  <TabsTrigger value="communications" className="flex-1 py-1.5 text-xs sm:text-sm">
                    Communications
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">Order History</h4>
                    <Button
                      size="sm"
                      className="bg-indigo-600 text-white hover:bg-indigo-700 h-8 shrink-0"
                      onClick={() => setShowAddOrder(true)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Order
                    </Button>
                  </div>

                  {isLoading ? (
                    <TableSkeleton />
                  ) : orders.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No orders yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="relative border-l-2 border-indigo-200 pl-4"
                        >
                          <div className="flex items-start justify-between gap-4 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeDate(order.ordered_at)}
                              </p>
                              <p className="mt-1 text-sm break-words leading-relaxed text-slate-800">
                                {formatOrderItems(order.items)}
                              </p>
                              {order.campaigns?.name && (
                                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold bg-rose-50 border border-rose-100 text-rose-700 shrink-0 truncate max-w-full" title={order.campaigns.name}>
                                  <ShoppingCart className="h-3 w-3 shrink-0" />
                                  Attributed to {order.campaigns.name}
                                </div>
                              )}
                              <div className="mt-2">
                                <StatusBadge status={order.status} />
                              </div>
                            </div>
                            <p className="shrink-0 font-semibold text-slate-900">
                              {formatCurrency(order.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="segments" className="mt-4">
                  {isLoading ? (
                    <TableSkeleton />
                  ) : segments.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Not in any segments
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {segments.map((segment) => (
                        <Badge
                          key={segment.id}
                          variant="outline"
                          className="border-0 bg-indigo-50 text-indigo-700 font-semibold"
                        >
                          {segment.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="communications" className="mt-4">
                  {isLoading ? (
                    <TableSkeleton />
                  ) : communications.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No messages sent yet
                    </p>
                  ) : (
                    <div className="overflow-x-auto w-full border rounded-lg">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {communications.map((comm) => (
                            <TableRow key={comm.id}>
                              <TableCell className="font-medium max-w-[150px] truncate" title={comm.campaigns?.name ?? comm.campaign?.name ?? 'Unknown'}>
                                {comm.campaigns?.name ??
                                  comm.campaign?.name ??
                                  'Unknown'}
                              </TableCell>
                              <TableCell>
                                <ChannelIcon channel={comm.channel} />
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={comm.status} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {formatRelativeDate(comm.sent_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showAddOrder} onOpenChange={setShowAddOrder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddOrderSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="order-amount" className="text-sm font-medium">
                Amount (₹) *
              </label>
              <Input
                id="order-amount"
                type="number"
                step="any"
                required
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="e.g. 250"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="order-items" className="text-sm font-medium">
                Items (comma-separated) *
              </label>
              <Input
                id="order-items"
                type="text"
                required
                value={orderItems}
                onChange={(e) => setOrderItems(e.target.value)}
                placeholder="e.g. Cold Brew, Chocolate Cookie"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="order-date" className="text-sm font-medium">
                Order Date
              </label>
              <Input
                id="order-date"
                type="datetime-local"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddOrder(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={addOrderMutation.isPending}
              >
                {addOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Order'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [city, setCity] = useState('');
  const [minSpent, setMinSpent] = useState<number | undefined>();
  const [maxSpent, setMaxSpent] = useState<number | undefined>();
  const [churned, setChurned] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const queryClient = useQueryClient();
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custTags, setCustTags] = useState('');

  const addCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success('Customer created successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setCustCity('');
      setCustTags('');
      setShowAddCustomer(false);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.error ?? err?.message ?? 'Failed to create customer';
      toast.error(errMsg);
    },
  });

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      toast.error('Name is required');
      return;
    }
    const tagsArr = custTags.split(',').map(t => t.trim()).filter(Boolean);

    addCustomerMutation.mutate({
      name: custName.trim(),
      email: custEmail.trim() || undefined,
      phone: custPhone.trim() || undefined,
      city: custCity.trim() || undefined,
      tags: tagsArr,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, city, minSpent, maxSpent, churned]);

  const filters = {
    search: debouncedSearch || undefined,
    city: city || undefined,
    min_spent: minSpent,
    max_spent: maxSpent,
    churned: churned || undefined,
    page,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const res = (await getCustomers(filters)) as unknown as ApiResponse<CustomersResponse>;
      return res.data;
    },
  });

  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const hasActiveFilters =
    !!debouncedSearch ||
    !!city ||
    minSpent !== undefined ||
    maxSpent !== undefined ||
    churned;

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCity('');
    setMinSpent(undefined);
    setMaxSpent(undefined);
    setChurned(false);
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <Badge variant="outline" className="border-0 bg-slate-100 text-slate-700">
            {total} total
          </Badge>
        </div>
        <Button
          className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm"
          onClick={() => setShowAddCustomer(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="sticky top-0 z-10 -mx-6 mb-6 border-b bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={city || 'all'}
            onValueChange={(value) => setCity(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Min Spent ₹"
            value={minSpent ?? ''}
            onChange={(e) =>
              setMinSpent(e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-[130px]"
          />

          <Input
            type="number"
            placeholder="Max Spent ₹"
            value={maxSpent ?? ''}
            onChange={(e) =>
              setMaxSpent(e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-[130px]"
          />

          <Button
            variant={churned ? 'default' : 'outline'}
            className={cn(
              churned && 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
            onClick={() => setChurned((prev) => !prev)}
          >
            Churned 90d
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Try adjusting your filters or load demo data from the dashboard."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <TableCell className="font-semibold">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell>{formatCurrency(customer.total_spent)}</TableCell>
                    <TableCell>
                      {formatRelativeDate(customer.last_order_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-0 bg-slate-100">
                        {customer.total_orders}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={getTagClass(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {start}–{end} of {total} customers
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <CustomerDetailSheet
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="cust-name" className="text-sm font-medium">
                Name *
              </label>
              <Input
                id="cust-name"
                type="text"
                required
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. Amit Patel"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cust-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="cust-email"
                type="email"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="e.g. amit.patel@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cust-phone" className="text-sm font-medium">
                Phone
              </label>
              <Input
                id="cust-phone"
                type="text"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="e.g. +919876543210"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cust-city" className="text-sm font-medium">
                City
              </label>
              <Input
                id="cust-city"
                type="text"
                value={custCity}
                onChange={(e) => setCustCity(e.target.value)}
                placeholder="e.g. Bangalore"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cust-tags" className="text-sm font-medium">
                Tags (comma-separated)
              </label>
              <Input
                id="cust-tags"
                type="text"
                value={custTags}
                onChange={(e) => setCustTags(e.target.value)}
                placeholder="e.g. vip, frequent"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddCustomer(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={addCustomerMutation.isPending}
              >
                {addCustomerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Customer'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
