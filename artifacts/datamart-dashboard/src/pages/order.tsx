import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useGetOrderStatus, useGetDeliveryTracker } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  Phone,
  Hash,
  Activity,
  Trash2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type SearchMode = 'phone' | 'reference' | 'transId';

export default function OrderStatus() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ reference?: string }>();
  
  // State from URL
  const urlReference = params?.reference || "";
  
  // UI State
  const [searchMode, setSearchMode] = useState<SearchMode>('phone');
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // For reference-based search (URL param)
  const { data: orderRes, isLoading, isError, refetch } = useGetOrderStatus(urlReference, {
    query: {
      enabled: !!urlReference,
      retry: 1
    }
  });

  const { data: trackerRes } = useGetDeliveryTracker({
    query: { refetchInterval: 15000 }
  });
  const tracker = trackerRes?.data;
  const scanner = tracker?.scanner;

  // Sync mode if reference comes from URL
  useEffect(() => {
    if (urlReference) {
      setSearchMode('reference');
      setSearchInput(urlReference);
    }
  }, [urlReference]);

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const query = directQuery || searchInput.trim();
    if (!query) return;

    // Auto-detect phone numbers (e.g. 0548169191 or 233548169191) to prevent user errors
    const isPhoneNumber = /^(?:\+?233|0)\d{9}$/.test(query);
    const actualMode = isPhoneNumber ? 'phone' : searchMode;

    if (actualMode !== searchMode) {
      setSearchMode(actualMode);
    }

    if (actualMode === 'reference' || actualMode === 'transId') {
      setLocation(`/order/${query}`);
      setSearchResults([]);
    } else {
      // Phone Search (Local DB)
      setIsSearching(true);
      setSearchResults([]);
      try {
        const res = await fetch(`/api/order/phone/${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setSearchResults(data.data);
          // If phone search, clear reference in URL but stay on page
          if (params?.reference) setLocation('/order');
        }
      } catch (err) {
        console.error("Phone search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }
  };



  const fulfilledState = { icon: CheckCircle2, label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/40', desc: 'Data delivered successfully! Check your phone' };

  const statusConfig: Record<string, any> = {
    pending: { icon: Clock, label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/40', desc: 'Order received, waiting to be processed' },
    processing: { icon: RefreshCw, label: 'Processing', color: 'text-primary', bg: 'bg-primary/20', border: 'border-primary/40', desc: 'Your data is being sent to the network', spin: true },
    fulfilled: fulfilledState,
    success: fulfilledState,
    completed: fulfilledState,
    delivered: fulfilledState,
    failed: { icon: XCircle, label: 'Failed', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/40', desc: 'Transaction failed. Please contact support' }
  };

  const order = orderRes?.data;

  return (
    <div className="w-full space-y-6 pb-20 relative overflow-hidden">

      <div className="relative z-10 w-full pt-4 md:pt-10 max-w-4xl mx-auto">


        <section className="animate-scale-in">
          <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[24px] p-4 md:p-6 shadow-sm space-y-6 relative overflow-hidden group hover:border-border/60 transition-colors">
            <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 block">Search by</label>
            
            {/* Tab Switcher */}
            <div className="grid grid-cols-3 gap-2 bg-muted/50 p-1 rounded-[16px] border border-border/40">
              <TabButton 
                active={searchMode === 'phone'} 
                onClick={() => setSearchMode('phone')} 
                icon={Phone} 
                label="Phone" 
              />
              <TabButton 
                active={searchMode === 'reference'} 
                onClick={() => setSearchMode('reference')} 
                icon={Hash} 
                label="Reference" 
              />
              <TabButton 
                active={searchMode === 'transId'} 
                onClick={() => setSearchMode('transId')} 
                icon={Activity} 
                label="Trans. ID" 
              />
            </div>

            {/* Input Field */}
            <form onSubmit={(e) => handleSearch(e)} className="space-y-5">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  type="text"
                  placeholder={
                    searchMode === 'phone' ? "Enter phone number (e.g., 0241234567)" :
                    searchMode === 'transId' ? "Enter Transaction ID" : "Enter Order Reference"
                  }
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-muted border-border/40 h-12 md:h-14 pl-14 text-base md:text-lg rounded-[16px] focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all shadow-inner text-foreground font-medium"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSearching}
                className="w-full h-12 md:h-14 bg-slate-950 hover:bg-slate-900 text-white font-black text-base md:text-lg rounded-[16px] transition-all active:scale-[0.98] border border-border/40 hover:border-primary/40 group relative overflow-hidden shadow-none"
              >
                {isSearching ? (
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  <Search className="h-5 w-5 mr-3 opacity-50 group-hover:opacity-100" />
                )}
                <span className="relative z-10">Track Order</span>
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Results Area ── */}
      <div className="min-h-[200px] max-w-4xl mx-auto mt-10">
        {/* Loading State */}
        {(isLoading || isSearching) && (
          <div className="bg-card border border-border rounded-[20px] p-6 md:p-8 space-y-4 animate-pulse shadow-sm">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* Reference Search Result (Single Order) */}
        {!isLoading && !isSearching && order && urlReference && (
          <div className="animate-scale-in">
            <OrderResultCard order={order} config={statusConfig} />
          </div>
        )}

        {/* Phone Search Results (List) */}
        {!isLoading && !isSearching && searchResults.filter(o => o.status !== 'pending').length > 0 && (
          <div className="space-y-6 animate-scale-in mt-10 md:mt-20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">Orders Found</h3>
              <span className="text-sm bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold">
                {searchResults.filter(o => o.status !== 'pending').length} {searchResults.filter(o => o.status !== 'pending').length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.filter(o => o.status !== 'pending').map((order) => (
                <div key={order.id} className="relative group">


                  <Link href={`/order/${order.orderReference || order.paystackReference}`}>
                    <div className="bg-card border border-border hover:border-primary/30 p-4 rounded-[16px] group transition-all hover:shadow-xl cursor-pointer relative overflow-hidden h-full flex flex-col justify-between active:scale-95 active:brightness-95">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-center justify-between mb-4 relative z-10 w-[calc(100%-40px)]">
                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border border-border">
                          {order.network === 'YELLO' ? 'MTN' : order.network} • {order.capacity}GB
                        </div>
                        <StatusBadge status={order.status} config={statusConfig} dotOnly />
                      </div>

                      <div className="space-y-4 relative z-10">

                        
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-0.5">Recipient</p>
                            <p className="font-mono font-bold text-base">{order.phoneNumber}</p>
                          </div>
                          <div className="bg-muted p-2 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty / Error States */}
        {!isLoading && !isSearching && !order && !searchResults.length && searchInput && (
          <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-[20px] space-y-4 animate-fade-in">
            <div className="bg-muted h-16 w-16 rounded-[12px] flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <h3 className="text-xl font-bold">No orders found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">We couldn't find any recent transactions for this information. Please check your tracking ID or phone number.</p>
          </div>
        )}
      </div>


      {/* ── Status Guide ── */}
      <section className="space-y-6 pt-10 border-t border-white/5 animate-fade-in-up-delay-3">
        <h2 className="text-2xl font-bold tracking-tight">Order Status Guide</h2>
        <div className="bg-slate-900/20 border border-white/5 rounded-[20px] p-5 md:p-8 space-y-6">
          <GuideItem config={statusConfig.pending} />
          <GuideItem config={statusConfig.processing} />
          <GuideItem config={statusConfig.fulfilled} />
        </div>
      </section>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-1.5 sm:py-3 px-1 sm:px-5 rounded-[16px] text-[10px] sm:text-xs font-black transition-all h-full tracking-wider uppercase",
        active 
          ? "bg-slate-950 text-white shadow-xl scale-[1.02] border border-white/10" 
          : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function GuideItem({ config }: { config: any }) {
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-4 group">
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 md:px-6 py-1.5 md:py-2.5 rounded-full border text-[10px] md:text-sm font-black uppercase tracking-widest min-w-[100px] md:min-w-[140px] justify-center transition-all group-hover:scale-105 shrink-0",
        config.bg, config.color, config.border
      )}>
        <Icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4", config.spin && "animate-spin")} />
        {config.label}
      </div>
      <p className="text-xs md:text-base text-muted-foreground font-medium group-hover:text-foreground transition-colors leading-tight">{config.desc}</p>
    </div>
  );
}

function StatusBadge({ status, config, dotOnly }: { status: string, config: any, dotOnly?: boolean }) {
  const cfg = config[status.toLowerCase()] || config.pending;
  const Icon = cfg.icon;
  
  if (dotOnly) {
    return (
      <div className={cn("flex items-center gap-2 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border", cfg.bg, cfg.color, cfg.border)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.color.replace('text-', 'bg-'), cfg.spin && "animate-pulse")} />
        {cfg.label}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest", cfg.bg, cfg.color, cfg.border)}>
      <Icon className={cn("h-3 w-3", cfg.spin && "animate-spin")} />
      {cfg.label}
    </div>
  );
}

function OrderResultCard({ order, config }: { order: any, config: any }) {
  const cfg = config[order.orderStatus.toLowerCase()] || config.pending;
  
  return (
    <div className="bg-card border border-border rounded-[16px] overflow-hidden shadow-sm transition-all hover:border-border/60 relative group">
      <div className="p-3 md:p-4 border-b border-border bg-muted/10">
        <div className="flex flex-row justify-between items-center gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-0">Tracking ID</p>
            <p className="text-lg md:text-xl font-mono font-bold text-primary uppercase tracking-tight">{order.reference}</p>
          </div>
          <StatusBadge status={order.orderStatus} config={config} />
        </div>
      </div>
      
      <div className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <DetailItem label="Data Bundle" value={`${order.capacity}GB`} subValue={order.network} icon={Package} />
        <DetailItem label="Recipient" value={order.phoneNumber} />
        <DetailItem 
          label="Purchase Date" 
          value={order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy") : "Just now"} 
          subValue={order.createdAt ? format(new Date(order.createdAt), "h:mm a") : ""}
        />
      </div>


    </div>
  );
}

function DetailItem({ label, value, subValue, icon: Icon, isMono, isPrimary }: { label: string, value: string, subValue?: string, icon?: any, isMono?: boolean, isPrimary?: boolean }) {
  return (
    <div className="space-y-0.5 group">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-3 w-3 opacity-50" />}
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <p className={cn(
          "text-base md:text-lg font-bold tracking-tight", 
          isMono && "font-mono", 
          isPrimary ? "text-primary" : "text-foreground"
        )}>
          {value}
        </p>
        {subValue && <span className="text-[9px] md:text-xs font-normal text-muted-foreground">{subValue}</span>}
      </div>
    </div>
  );
}
