import { useState, useMemo } from "react";
import { useGetBalance, useGetTransactions, useGetUsageStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet as WalletIcon, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  RefreshCw, 
  Search 
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Wallet() {
  const { data: statsData } = useGetUsageStats();
  const { data: balanceData, isLoading: isBalanceLoading } = useGetBalance();
  const { data: txData, isLoading: isTxLoading } = useGetTransactions({
     page: 1, 
     limit: 50
  });
  const [searchTerm, setSearchTerm] = useState("");
  const balance = balanceData?.data?.balance || 0;
  const rawTransactions = txData?.data?.transactions || [];

  // Filter logic
  const transactions = useMemo(() => {
    return rawTransactions.filter((tx: any) => 
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawTransactions, searchTerm]);

  // Calculate dynamic stats from filtered transactions
  const walletStats = useMemo(() => {
    const funded = transactions
      .filter((tx: any) => tx.type === 'credit' && tx.status === 'success')
      .reduce((acc: number, tx: any) => acc + Number(tx.amount), 0);
    const spent = transactions
      .filter((tx: any) => tx.type === 'debit' && tx.status === 'success')
      .reduce((acc: number, tx: any) => acc + Number(tx.amount), 0);
    return { funded, spent };
  }, [transactions]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* ── Tabs Header ── */}
      <div className="flex items-center gap-4">
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
          <WalletIcon size={16} />
          Wallet Overview
        </button>
        <button className="bg-card border border-border px-6 py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
          <History size={16} />
          Transaction Logs
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Available Balance" value={formatCurrency(balance)} color="text-white" />
        <StatsCard label="Total Spent" value={formatCurrency(statsData?.data?.allTimeSpent || 0)} color="text-red-500" />
        <StatsCard label="Total Funded" value={formatCurrency(walletStats.funded)} color="text-slate-300" />
        <StatsCard label="Total Deposited" value={formatCurrency(balance + (statsData?.data?.allTimeSpent || 0))} color="text-emerald-500" />
      </div>

      <div className="space-y-6">
        {/* ── Toolbar ── */}
        <div className="flex flex-col md:flex-row md:items-center gap-6">
           <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {['All', 'Funding', 'Purchase', 'Refund'].map((f) => (
              <button 
                key={f}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-full bg-background/50 border-border focus:ring-primary text-sm shadow-inner" 
            />
          </div>
          <Button variant="ghost" className="h-10 rounded-xl font-bold gap-2 ml-auto">
            <RefreshCw size={14} className={isTxLoading ? "animate-spin" : ""} /> REFRESH
          </Button>
        </div>

        {/* ── Table Container ── */}
        <div className="overflow-hidden rounded-xl border border-border/30">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTxLoading ? (
                 Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-border/20">
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                    </TableRow>
                 ))
              ) : transactions.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="h-64 text-center">
                     <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                       <History size={48} />
                       <p className="font-black text-sm uppercase tracking-tighter">No transactions yet</p>
                     </div>
                   </TableCell>
                </TableRow>
              ) : transactions.map((tx: any) => (
                <TableRow key={tx.reference} className="group border-border/20 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {tx.type === 'debit' ? (
                         <ArrowDownCircle size={14} className="text-red-500" />
                      ) : (
                         <ArrowUpCircle size={14} className="text-emerald-500" />
                      )}
                      <span className="capitalize font-black text-xs">{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                     <span className="text-[10px] font-black uppercase tracking-widest bg-muted px-2 py-1 rounded-md text-muted-foreground">
                        {tx.category || (tx.type === 'debit' ? 'Data Purchase' : 'Wallet Funding')}
                     </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 font-mono text-[10px] font-bold text-muted-foreground uppercase">{tx.reference?.substring(0, 12)}</TableCell>
                  <TableCell className={cn(
                    "px-6 py-4 font-black text-sm",
                    tx.type === 'debit' ? "text-red-500" : "text-emerald-500"
                  )}>
                    {tx.type === 'debit' ? "-" : "+"}{formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-muted-foreground text-[10px] font-bold whitespace-nowrap">
                     {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Badge variant={tx.status === 'success' ? 'default' : 'outline'} className={cn(
                      "text-[9px] font-black uppercase tracking-tighter h-5",
                      tx.status === 'success' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""
                    )}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, color = "text-foreground" }: { label: string, value: string | number, color?: string }) {
  return (
    <Card className="bg-card/40 border-border/50 backdrop-blur-xl group hover:border-primary/30 transition-all cursor-default">
      <CardContent className="p-6">
        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-4">{label}</p>
        <p className={cn("text-2xl font-black tracking-tight transition-transform group-hover:translate-x-1", color)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
