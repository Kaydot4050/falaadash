import { useDeliveryStatus } from "@/hooks/use-delivery-status";
import { Link, useLocation } from "wouter";
import { Activity, CheckCircle2, Clock, AlertTriangle, RefreshCw, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Tracker() {
  const { status: deliveryStatus, isLoading, tracker } = useDeliveryStatus();
  const [location, setLocation] = useLocation();

  const stats = tracker?.stats;
  const scanner = tracker?.scanner;

  return (
    <div className="w-full space-y-10 pb-20">
      {/* ── Glassmorphic Status Card ── */}
      <section className="flex items-center justify-center pt-6 md:pt-10 pb-4 animate-fade-in">
        <div className="w-full max-w-4xl h-auto md:h-48 relative rounded-[24px] md:rounded-[32px] bg-card/60 backdrop-blur-3xl border border-border/50 shadow-2xl flex flex-row items-center justify-between p-4 md:px-12 overflow-hidden group">
          
          {/* Info Side */}
          <div className="flex flex-col items-start text-left space-y-1 md:space-y-4">
             <div className="space-y-0.5 md:space-y-1">
               <h2 className="text-sm md:text-3xl font-bold tracking-tight text-foreground line-clamp-2 md:line-clamp-none max-w-[120px] md:max-w-none leading-tight transition-colors">Delivery Progress</h2>
               <div className="h-0.5 md:h-1 w-8 md:w-12 bg-primary/40 rounded-full" />
             </div>
             <p className="text-xs md:text-lg text-foreground/60 font-medium max-w-[140px] md:max-w-[400px] leading-relaxed line-clamp-2 md:line-clamp-none transition-colors">
               Real-time monitoring of all active bundle dispatches.
             </p>
          </div>

          {/* Status Side */}
          <div className="flex flex-row-reverse items-center gap-3 md:gap-12">
            {/* Status Label */}
            <div className="text-right">
              <p className={cn(
                "text-sm md:text-3xl font-black tracking-[0.1em] md:tracking-[0.2em] uppercase",
                scanner?.active ? "text-green-500" : scanner?.waiting ? "text-amber-500" : "text-white"
              )}>
                {scanner?.active ? "Active" : scanner?.waiting ? "Waiting" : "Idle"}
              </p>
              {scanner?.waiting && (
                <p className="text-[7px] md:text-[10px] text-amber-500/60 font-bold uppercase tracking-tighter md:tracking-widest mt-0.5 md:mt-1">
                  {scanner.waitSeconds}s
                </p>
              )}
            </div>

            {/* Central Ring */}
            <div className="relative flex items-center justify-center">
              <div className={cn(
                "h-14 w-14 md:h-32 md:w-32 rounded-full border-[3px] md:border-[5px] flex flex-col items-center justify-center transition-colors duration-500",
                scanner?.active ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : scanner?.waiting ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "border-border/40"
              )}>
                <span className="text-[6px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-foreground/90 transition-colors">Status</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLoading && !tracker ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-border rounded-xl p-6 bg-card h-32">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-10 w-16" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="max-w-4xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard 
            title="Delivered" 
            value={stats.delivered} 
            icon={CheckCircle2} 
            color="text-green-500" 
            bg="bg-green-500/10" 
          />
          <StatCard 
            title="Pending" 
            value={stats.pending} 
            icon={Clock} 
            color="text-yellow-500" 
            bg="bg-yellow-500/10" 
          />
          <StatCard 
            title="Checked" 
            value={stats.checked} 
            icon={Activity} 
            color="text-primary" 
            bg="bg-primary/20" 
          />
          <StatCard 
            title="Failed" 
            value={stats.failed || 0} 
            icon={AlertTriangle} 
            color="text-red-500" 
            bg="bg-red-500/10" 
          />
        </div>
      ) : null}



      {/* ── Delivery Progress List ── */}
      <section className="max-w-4xl mx-auto w-full space-y-6 pt-4 animate-fade-in-up-delay-2">
        <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[24px] p-6 md:p-10 space-y-8">
          {/* Dynamic Delivery Alert */}
          {deliveryStatus && !tracker?.checkingNow?.summary?.toLowerCase().includes("searching") && (
            <div className={cn("border rounded-2xl p-4 md:p-6 flex items-start md:items-center gap-4 transition-all duration-500", deliveryStatus.bgClass, deliveryStatus.borderClass)}>
              <div className={cn("p-2.5 rounded-xl transition-all duration-700", `bg-${deliveryStatus.accentColor}/10`, deliveryStatus.colorClass, (deliveryStatus.status === 'fast' || deliveryStatus.status === 'ultra-fast') && "scale-110")}>
                <deliveryStatus.icon className={cn("h-5 w-5", (deliveryStatus.status === 'fast' || deliveryStatus.status === 'ultra-fast') ? "animate-pulse-line" : "")} />
              </div>
              <p className={cn("text-sm md:text-lg font-medium leading-tight", deliveryStatus.colorClass)}>
                {deliveryStatus.message}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Last Delivered */}
            {tracker?.lastDelivered?.summary && (
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="mt-1 bg-emerald-500/20 p-1 rounded-full shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm md:text-base font-medium text-emerald-400/90">
                    <span className="font-bold text-emerald-400">Last delivered:</span> {tracker.lastDelivered.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Checking Now */}
            {tracker?.checkingNow?.summary && !tracker?.checkingNow?.summary?.toLowerCase().includes("searching") && (
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-primary/20 p-1 rounded-full shrink-0">
                  <RefreshCw className={cn("h-4 w-4 text-primary", scanner?.active && "animate-spin")} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm md:text-base font-medium text-primary/90">
                    <span className="font-bold text-primary">Checking now:</span> {tracker.checkingNow.summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      

    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: number, icon: any, color: string, bg: string }) {
  let shadowGlow = "";
  if (color.includes("green")) shadowGlow = "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:border-green-500/30";
  if (color.includes("yellow")) shadowGlow = "hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:border-yellow-500/30";
  if (color.includes("primary")) shadowGlow = "hover:shadow-[0_0_20px_hsl(var(--primary)_/_0.15)] hover:border-primary/30";
  if (color.includes("red")) shadowGlow = "hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:border-red-500/30";

  return (
    <div className={cn("group relative overflow-hidden rounded-[16px] border border-border bg-card p-2.5 md:p-3.5 transition-all duration-300 hover:-translate-y-1 shadow-sm animate-scale-in active:scale-95 active:brightness-95", shadowGlow)}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] dark:to-white/[0.02] pointer-events-none" />
      <div className="relative flex items-center gap-2 md:gap-3 z-10">
        <div className={cn("p-2 md:p-2.5 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 border border-transparent group-hover:border-current/10 shrink-0", bg, color)}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0">{title}</p>
          <p className="text-lg md:text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon({ active }: { active?: boolean }) {
  return (
    <div className={cn("relative flex h-5 w-5 items-center justify-center rounded-full border", active ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground")}>
      <Activity className={cn("h-3 w-3", active && "animate-pulse-line")} />
    </div>
  );
}
