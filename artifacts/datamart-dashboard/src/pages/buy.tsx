import { useState } from "react";
import { useGetDataPackages } from "@workspace/api-client-react";
import type { DataPackage } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { NetworkLogo } from "@/components/network-logo";
import { PurchaseDialog } from "@/components/purchase-dialog";
import { 
  ZapOff, 
  ArrowRight, 
  Smartphone, 
  CreditCard, 
  Wifi, 
  ShieldCheck, 
  Zap, 
  Clock 
} from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

export type NetworkId = "YELLO" | "TELECEL" | "AT_PREMIUM";

const NETWORKS: {
  id: NetworkId;
  name: string;
  sub: string;
  gradient: string;
  glow: string;
  trace: string;
}[] = [
  { id: "YELLO",   name: "MTN",       sub: "Non-Expiry",  gradient: "from-[#FFCC00] to-[#FF9500]", glow: "shadow-[0_0_30px_rgba(255,204,0,0.15)]", trace: "#FFCC00" },
  { id: "TELECEL",  name: "Telecel",   sub: "Instant",     gradient: "from-[#E60000] to-[#FF4444]", glow: "shadow-[0_0_30px_rgba(230,0,0,0.15)]", trace: "#E60000" },
  { id: "AT_PREMIUM", name: "AirtelTigo", sub: "Standard",   gradient: "from-[#0033A0] to-[#EF3D42]", glow: "shadow-[0_0_30px_rgba(239,61,66,0.15)]", trace: "#EF3D42" },
];

const STEPS = [
  { icon: Smartphone, title: "Choose Bundle", desc: "Select your network & data size" },
  { icon: CreditCard, title: "Pay Securely", desc: "Mobile Money or Card via Paystack" },
  { icon: Wifi,       title: "Get Data Instantly", desc: "Delivered in seconds, 24/7" },
];

function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(
        "transition-all duration-1000 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

export default function BuyData() {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("YELLO");
  const [selectedPackage, setSelectedPackage] = useState<DataPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: packagesRes, isLoading, isError, refetch } = useGetDataPackages();

  const packages: DataPackage[] =
    (packagesRes?.data as Record<string, DataPackage[]>)?.[selectedNetwork] ?? [];

  const handlePackageSelect = (pkg: DataPackage) => {
    setSelectedPackage(pkg);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-20 pb-40 animate-fade-in">
      
      {/* ── Page Header ── */}
      <section className="relative pt-12 pb-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 shadow-[0_0_15px_hsl(var(--primary)_/_0.2)]">
             <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Checkout</span>
          </div>
          <h1 className="text-3xl md:text-7xl font-black tracking-tight text-foreground leading-tight">
            Select Your <span className="text-primary">Bundle.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">
            Choose your network and preferred data package. All deliveries are automated and instant.
          </p>
        </div>
      </section>

      {/* ── Selection Flow ── */}
      <div className="space-y-20 md:space-y-32">
        
        {/* 1. Network Selector */}
        <AnimatedSection className="space-y-10">
          <div className="flex items-center gap-4">
             <div className="h-8 w-8 rounded-full bg-white text-slate-950 flex items-center justify-center font-black text-xs">1</div>
             <h2 className="text-2xl font-black tracking-tight">Select Network</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6">
            {NETWORKS.map((net) => {
              const isSelected = selectedNetwork === net.id;
              
              return (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net.id as NetworkId)}
                  style={{ "--trace-color": net.trace } as any}
                  className={cn(
                    "relative flex flex-col items-center gap-2 md:gap-6 rounded-[20px] transition-all duration-500 overflow-hidden isolate active:scale-95 active:brightness-95 p-[4px]",
                    isSelected
                      ? "bg-slate-900 shadow-2xl scale-[1.02]"
                      : "bg-slate-950/50 hover:bg-slate-900 border-2 border-white/5"
                  )}
                >
                  {/* Moving Border Trace */}
                  {isSelected && (
                    <div className="absolute inset-0 z-0">
                      <div className="trace-border animate-border-spin" />
                    </div>
                  )}

                  {/* Content Container */}
                  <div className={cn(
                    "relative z-10 w-full h-full flex flex-col items-center gap-2 md:gap-6 p-3 md:p-10 rounded-[18px] transition-all bg-inherit",
                    isSelected ? "bg-slate-900" : "bg-transparent"
                  )}>
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-[-1]" />
                    )}
                    <div className="relative z-10 p-2 md:p-4 rounded-[12px] bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                      <NetworkLogo network={net.id as NetworkId} size={52} />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="font-extrabold text-[10px] md:text-xl text-white mb-0.5 uppercase tracking-tight md:tracking-widest">{net.name}</p>
                      <span className="hidden md:block text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                        {net.sub}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </AnimatedSection>

        {/* 2. Bundle Grid */}
        <AnimatedSection className="space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-4">
               <div className="h-8 w-8 rounded-full bg-white text-slate-950 flex items-center justify-center font-black text-xs">2</div>
               <h2 className="text-2xl font-black tracking-tight">Choose Package</h2>
            </div>
            {!isLoading && packages.length > 0 && (
              <span className="px-6 py-2 rounded-full bg-primary/20 border border-primary/40 text-primary text-sm font-black uppercase tracking-widest shadow-[0_0_10px_hsl(var(--primary)_/_0.1)]">
                {packages.length} Available Bundles
              </span>
            )}
          </div>

          {isError ? (
            <div className="bg-rose-500/5 text-rose-500 p-12 rounded-[20px] border border-rose-500/10 text-center space-y-4">
              <ZapOff className="h-12 w-12 mx-auto opacity-50" />
              <div>
                <p className="text-xl font-black">Connection Interrupted</p>
                <p className="text-sm font-medium opacity-60">Unable to fetch live pricing. Try again in a few seconds.</p>
              </div>
              <button 
                onClick={() => refetch()}
                className="mt-4 px-6 py-2 rounded-lg bg-rose-500 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-[20px] border border-border p-8 bg-muted/50 h-[140px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
              {packages.map((pkg, i) => (
                <button
                  key={`${pkg.network}-${pkg.capacity}`}
                  onClick={() => pkg.inStock && handlePackageSelect(pkg)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={cn(
                    "group relative flex flex-col p-5 md:p-8 rounded-[20px] border border-border bg-card hover:bg-card/80 hover:border-primary/60 hover:-translate-y-3 hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)_/_0.3)] transition-all duration-500 text-left overflow-hidden isolate active:scale-95 active:brightness-95",
                    !pkg.inStock && "opacity-60 grayscale cursor-not-allowed hover:translate-y-0 hover:shadow-none border-dashed"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[-1]" />
                  
                  <div className="space-y-1 mb-2 md:mb-8 text-center md:text-left">
                    <div className="flex items-baseline justify-center md:justify-start gap-1">
                      <span className="text-2xl md:text-5xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
                        {pkg.capacity}
                      </span>
                      <span className="text-sm md:text-xl font-bold text-muted-foreground uppercase">GB</span>
                    </div>
                    {!pkg.inStock ? (
                      <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-1">
                        <ZapOff size={10} /> Out of Stock
                      </p>
                    ) : (
                      <p className="hidden md:block text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Non-Expiry</p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex flex-col items-center md:items-end md:flex-row md:justify-between gap-2">
                        <p className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                          {(pkg.showOldPrice !== false) && pkg.oldPrice && pkg.oldPrice !== pkg.price && (
                            <span className="text-[10px] md:text-xs font-bold text-muted-foreground/40 line-through">
                              GHS {Number(pkg.oldPrice).toFixed(2)}
                            </span>
                          )}
                          <span className="font-black text-sm md:text-2xl text-foreground">
                            <span className="text-[10px] font-bold mr-0.5 text-muted-foreground">GHS</span>
                            {Number(pkg.price).toFixed(2)}
                          </span>
                        </p>
                      <div className={cn(
                        "hidden md:flex h-10 w-10 rounded-[12px] items-center justify-center transition-all shadow-[0_0_15px_hsl(var(--primary)_/_0.3)]",
                        pkg.inStock ? "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white" : "bg-muted text-muted-foreground"
                      )}>
                         <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AnimatedSection>
      </div>

      {/* ── Steps & Trust ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 pt-20 border-t border-white/5">
        <div className="space-y-8">
           <h3 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/60">Fulfillment Guide</h3>
           <div className="space-y-4">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-[20px] bg-card border border-border text-left shadow-sm">
                  <div className="h-12 w-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground uppercase text-sm tracking-tight">{title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
             ))}
           </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/60">Buyer Protection</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, title: "Secure", desc: "Paystack Vault" },
                { icon: Zap,         title: "Instant", desc: "< 1s Delivery" },
                { icon: Clock,       title: "24/7",   desc: "Always Online" },
                { icon: Wifi,        title: "Active",  desc: "NCA Licensed" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 md:p-6 rounded-[20px] bg-primary/5 border border-primary/10 flex flex-col gap-3 md:gap-4 text-left">
                  <Icon className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-black text-white uppercase text-xs">{title}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <PurchaseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedPackage={selectedPackage}
        network={selectedNetwork}
      />
    </div>
  );
}
