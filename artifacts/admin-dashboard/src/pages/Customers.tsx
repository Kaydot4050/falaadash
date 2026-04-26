import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  Phone, 
  User, 
  Calendar, 
  ShoppingBag, 
  CreditCard,
  TrendingUp,
  Award,
  ArrowUpRight,
  RefreshCw,
  Mail,
  Filter,
  ArrowRightLeft,
  Download
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { customFetch } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

// Types
interface Customer {
  phoneNumber: string;
  customerName: string | null;
  totalOrders: number;
  totalSpent: string;
  lastOrderAt: string;
}

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Customers
  const { data: customersData, isLoading, refetch } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const data = await customFetch<any>("/api/admin/customers");
      return data.data as Customer[];
    }
  });

  // Filter logic
  const filteredCustomers = useMemo(() => {
    if (!customersData) return [];
    return customersData.filter(c => 
      c.phoneNumber.includes(searchTerm) || 
      (c.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [customersData, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    if (!customersData) return { total: 0, topSpender: 0, activeToday: 0 };
    const total = customersData.length;
    const topSpender = Math.max(...customersData.map(c => Number(c.totalSpent)));
    
    const today = new Date().toISOString().split('T')[0];
    const activeToday = customersData.filter(c => c.lastOrderAt.split('T')[0] === today).length;
    
    const returning = customersData.filter(c => c.totalOrders > 1).length;
    const retention = total > 0 ? Math.round((returning / total) * 100) : 0;

    return { total, topSpender, activeToday, retention };
  }, [customersData]);

  const handleExport = () => {
    if (!customersData) return;
    const headers = ["Phone Number", "Customer Name", "Total Orders", "Total Spent", "Last Order"];
    const rows = customersData.map(c => [
      c.phoneNumber,
      c.customerName || "Anonymous",
      c.totalOrders,
      c.totalSpent,
      format(new Date(c.lastOrderAt), 'yyyy-MM-dd HH:mm')
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTier = (orders: number) => {
    if (orders >= 10) return { label: 'GOLD', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: Award };
    if (orders >= 5) return { label: 'SILVER', color: 'text-slate-300 bg-slate-300/10 border-slate-300/20', icon: Award };
    return { label: 'BRONZE', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', icon: Award };
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Analyzing customer data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* ── Tabs Header ── */}
      <div className="flex items-center gap-4">
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
          <Users size={16} />
          Customers View
        </button>
        <button className="bg-card border border-border px-6 py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
          <ArrowRightLeft size={16} />
          Audience Insights
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatsCard label="Total Customers" value={stats.total} color="text-white" />
        <StatsCard label="Active Today" value={stats.activeToday} color="text-primary" />
        <StatsCard label="Top Spender" value={formatCurrency(stats.topSpender)} color="text-emerald-500" />
        <StatsCard label="Retention" value={`${stats.retention}%`} />
      </div>

      <div className="space-y-6">
        {/* ── Filter Controls ── */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {['All', 'Gold', 'Silver', 'Bronze'].map((f) => (
              <button 
                key={f}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap border bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-[11px] font-medium placeholder:text-slate-600 focus:outline-none focus:border-primary/30 transition-all" 
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button onClick={handleExport} variant="outline" className="flex-1 md:flex-none h-10 rounded-xl font-bold gap-2 border-primary/20 hover:bg-primary/5 text-primary text-[10px]">
              <Download size={14} /> EXPORT
            </Button>
            <Button onClick={() => refetch()} variant="ghost" className="flex-1 md:flex-none h-10 rounded-xl font-bold gap-2 text-[10px]">
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> REFRESH
            </Button>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="overflow-hidden rounded-xl border border-border/30">

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Alias</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</TableHead>
                <TableHead className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tier</TableHead>
                <TableHead className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Count</TableHead>
                <TableHead className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Value</TableHead>
                <TableHead className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                      <Users size={48} />
                      <p className="font-black text-sm uppercase tracking-tighter">No customers matching your search</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer, i) => {
                  const tier = getTier(customer.totalOrders);
                  const TierIcon = tier.icon;
                  
                  return (
                    <TableRow key={customer.phoneNumber} className="group border-border/20 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="font-black text-[13px] tracking-tight text-foreground capitalize">{customer.customerName || 'Anonymous User'}</div>
                            <div className="text-[10px] font-bold text-muted-foreground capitalize opacity-50">Verified User</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4 font-mono text-xs tracking-wider text-slate-300 font-bold">
                        {customer.phoneNumber}
                      </TableCell>
                      
                      <TableCell className="px-6 py-4 text-center">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border tracking-wider",
                          tier.color
                        )}>
                          <TierIcon size={10} />
                          {tier.label}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                           <span className="text-sm font-black text-foreground">{customer.totalOrders}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-sm font-black text-emerald-500">₵{customer.totalSpent}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right text-xs font-bold text-muted-foreground whitespace-nowrap">
                         {formatDate(customer.lastOrderAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </div>
);
}

function StatsCard({ label, value, color = "text-foreground" }: { label: string, value: string | number, color?: string }) {
  return (
    <Card className="bg-card/40 border-border/50 backdrop-blur-xl group hover:border-primary/30 transition-all cursor-default">
      <CardContent className="p-4 md:p-6">
        <p className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2 md:mb-4">{label}</p>
        <p className={cn("text-lg md:text-2xl font-black tracking-tight transition-transform group-hover:translate-x-1 truncate", color)}>
          <span className={cn(color.includes("emerald") ? "" : "text-foreground")}>
            {typeof value === 'string' && value.includes('GH') ? value.split('₵')[0] + '₵' : ''}
          </span>
          {typeof value === 'string' && value.includes('GH') ? value.split('₵')[1] : value}
        </p>
      </CardContent>
    </Card>
  );
}
