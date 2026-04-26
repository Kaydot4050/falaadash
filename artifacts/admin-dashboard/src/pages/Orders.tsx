import { useGetPurchaseHistory } from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  Search, 
  RefreshCcw,
  ShoppingCart,
  Phone,
  Usb,
  Monitor
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Orders() {
  const { data: historyData, isLoading, refetch } = useGetPurchaseHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeNetwork, setActiveNetwork] = useState<string>("ALL");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const queryClient = useQueryClient();

  const orders = Array.isArray(historyData?.data?.purchases) ? historyData.data.purchases : [];

  const { filteredOrders, stats } = useMemo(() => {
    const list = orders.filter(o => {
      const s = searchTerm.toLowerCase();
      const status = o.orderStatus?.toLowerCase() || '';
      
      const matchesSearch = 
        o.phoneNumber.includes(searchTerm) || 
        (o.orderReference && o.orderReference.toLowerCase().includes(s)) ||
        (o.customerName && o.customerName.toLowerCase().includes(s));
      
      const matchesNetwork = activeNetwork === "ALL" || 
        (o.network && o.network.toUpperCase().includes(activeNetwork.toUpperCase()));

      const matchesStatus = activeStatus === "ALL" ||
        (activeStatus === "SUCCESS" && (status === "completed" || status === "fulfilled" || status === "success")) ||
        (activeStatus === "FAILED" && (status === "failed" || status === "cancel")) ||
        (activeStatus === "PENDING" && (status === "pending" || status === "processing" || status === "unpaid"));

      return matchesSearch && matchesNetwork && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalRevenue = list.reduce((acc, o) => {
      const status = o.orderStatus?.toLowerCase() || '';
      const isCompleted = status.includes("fulfilled") || status.includes("success") || status.includes("complete");
      return acc + (isCompleted ? Number(o.price || 0) : 0);
    }, 0);

    const completedCount = list.filter(o => {
      const status = o.orderStatus?.toLowerCase() || '';
      return status === "completed" || status === "fulfilled" || status === "success";
    }).length;

    const pendingCount = list.filter(o => {
      const status = o.orderStatus?.toLowerCase() || '';
      return status === "pending" || status === "processing" || status === "unpaid";
    }).length;
    
    const totalProfit = list.reduce((acc, o) => {
       const price = Number(o.price || 0);
       let cost = o.costPrice ? Number(o.costPrice) : null;
       if (cost === null) {
          if (o.network?.toLowerCase().includes('mtn') || o.network?.toLowerCase().includes('yello')) {
             cost = (o.capacity || 1) * 4;
          } else {
             cost = price * 0.88;
          }
       }
       const status = o.orderStatus?.toLowerCase() || '';
       const isFulfilled = status === "completed" || status === "fulfilled" || status === "success";
       return acc + (isFulfilled ? (price - cost) : 0);
    }, 0);

    return { 
      filteredOrders: list, 
      stats: { totalRevenue, totalProfit, completed: completedCount, pending: pendingCount } 
    };
  }, [orders, searchTerm, activeNetwork, activeStatus]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <RefreshCcw className="h-8 w-8 text-primary animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Syncing Transactions...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter glow-text">Orders</h1>
          <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">Transaction Registry</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              placeholder="Filter by phone or ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-[11px] font-medium placeholder:text-slate-600 focus:outline-none focus:border-primary/30 transition-all"
            />
          </div>
          <button 
            onClick={() => refetch()}
            className="h-10 px-6 flex items-center justify-center gap-2 glass rounded-xl text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <RefreshCcw size={14} />
            <span className="md:hidden">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatsCard label="Revenue" value={formatCurrency(stats.totalRevenue)} />
        <StatsCard label="Net Profit" value={formatCurrency(stats.totalProfit)} color="text-primary" />
        <StatsCard label="Success" value={stats.completed} />
        <StatsCard label="Pending" value={stats.pending} />
      </div>

      {/* ── Status Filters ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((stat) => (
          <button 
            key={stat}
            onClick={() => setActiveStatus(stat)}
            className={cn(
              "px-6 md:px-8 py-2.5 md:py-3 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeStatus === stat
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(79,70,229,0.4)]" 
                : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
            )}
          >
            {stat}
          </button>
        ))}
      </div>

      {/* ── Table Section ── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 px-8 text-slate-500">Customer</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500">Service</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500">Reference</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500">Amount</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500">Status</TableHead>
                <TableHead className="text-right py-6 px-8 text-[10px] uppercase font-black tracking-widest text-slate-500">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                       <ShoppingCart size={40} />
                       <p className="font-black text-xs uppercase tracking-widest">No matching orders</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: any) => (
                  <TableRow key={order.id} className="group border-white/5 hover:bg-white/[0.01] transition-all">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl glass border-white/10 flex items-center justify-center font-black text-xs text-primary/60 group-hover:text-primary transition-colors">
                          {order.customerName?.substring(0, 1) || 'C'}
                        </div>
                        <div>
                          <p className="font-black text-base tracking-tight">{order.customerName || 'Guest'}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-sm text-slate-500 font-bold">{order.phoneNumber}</p>
                             <span className="text-slate-700">·</span>
                             {order.source === "api" ? <Usb size={10} className="text-primary/40" /> : <Monitor size={10} className="text-primary/40" />}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <div className={cn(
                             "h-9 w-9 rounded-full flex items-center justify-center shrink-0 border border-white/5 bg-white/5",
                             (order.network?.toLowerCase().includes("mtn") || order.network?.toLowerCase().includes("ye")) ? "text-amber-500" : 
                             order.network?.toLowerCase().includes("at") ? "text-blue-500" :
                             "text-red-500"
                          )}>
                             <div className={cn(
                               "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border border-white/10",
                               (order.network?.toLowerCase().includes("mtn") || order.network?.toLowerCase().includes("ye")) ? "bg-[#facc15] text-black" : 
                               order.network?.toLowerCase().includes("at") ? "bg-[#003399] text-white" :
                               "bg-[#e21b22] text-white"
                             )}>
                                {order.network?.toLowerCase().includes("mtn") ? "Y" : 
                                 order.network?.toLowerCase().includes("at") ? "AT" :
                                 order.network?.substring(0, 1).toUpperCase()}
                             </div>
                          </div>
                          <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-black text-slate-400">{order.capacity}GB</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono font-bold text-primary/60 tracking-tighter bg-primary/5 px-2 py-1 rounded">
                        {order.orderReference}
                      </code>
                    </TableCell>
                    <TableCell className="font-black text-base">₵{Number(order.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.orderStatus} />
                    </TableCell>
                    <TableCell className="text-right px-8">
                       <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-400">
                             {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-[11px] font-black uppercase text-primary/40 tracking-widest">
                             {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, color = "text-foreground" }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="glass-card p-4 md:p-6 group cursor-default relative overflow-hidden transition-all hover:border-primary/20">
      <p className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 md:mb-4">{label}</p>
      <p className={cn("text-xl md:text-3xl font-black tracking-tighter glow-text truncate", color)}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || '';
  if (s === "completed" || s === "fulfilled" || s === "success") {
    return (
      <div className="inline-flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
        <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
        <span className="text-[9px] font-black uppercase tracking-tight">Success</span>
      </div>
    );
  }
  if (s === "processing") {
    return (
      <div className="inline-flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
        <span className="text-[9px] font-black uppercase tracking-tight">Processing</span>
      </div>
    );
  }
  if (s === "failed" || s === "cancel") {
    return (
      <div className="inline-flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
        <div className="h-1 w-1 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
        <span className="text-[9px] font-black uppercase tracking-tight">Failed</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
      <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
      <span className="text-[9px] font-black uppercase tracking-tight">Pending</span>
    </div>
  );
}
