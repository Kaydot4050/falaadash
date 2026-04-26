import { useState } from "react";
import { useGetUsageStats, getGetUsageStatsQueryKey, useClaimReferralBonus, useGetBalance } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, Wallet, ArrowUpRight, Gift, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Stats() {
  const { data: statsRes, isLoading: statsLoading } = useGetUsageStats();
  const { data: balanceRes, isLoading: balanceLoading } = useGetBalance();
  const claimBonusMutation = useClaimReferralBonus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stats = statsRes?.data;
  const balance = balanceRes?.data;

  const handleClaimBonus = () => {
    claimBonusMutation.mutate(undefined, {
      onSuccess: (res) => {
        toast({
          title: "Bonus Claimed!",
          description: res.message,
        });
        queryClient.invalidateQueries({ queryKey: getGetUsageStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to claim bonus",
          description: err?.message || "An error occurred",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4 md:mt-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard & Stats</h1>
          <p className="text-muted-foreground">Overview of your usage and earnings.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border rounded-[20px] p-3.5 md:p-4 shadow-sm">
          <div className="bg-primary/10 p-3 rounded-full text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
            {balanceLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground">
                GHS {balance?.balance.toFixed(2) || "0.00"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={stats?.totalOrders?.toLocaleString() || "0"} icon={BarChart3} loading={statsLoading} />
        <StatCard title="Total Spent" value={`GHS ${stats?.totalSpent?.toFixed(2) || "0.00"}`} icon={TrendingUp} loading={statsLoading} />
        <StatCard title="Total GB Purchased" value={`${stats?.totalGB?.toLocaleString() || "0"} GB`} icon={Users} loading={statsLoading} />
        <StatCard title="Success Rate" value={`${stats?.successRate?.toFixed(1) || "0"}%`} icon={ArrowUpRight} loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border">
              <h3 className="font-semibold">Network Breakdown</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/20">
                  <tr>
                    <th className="px-6 py-3 font-medium">Network</th>
                    <th className="px-6 py-3 font-medium">Orders</th>
                    <th className="px-6 py-3 font-medium">Volume</th>
                    <th className="px-6 py-3 font-medium text-right">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-3"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-6 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-3 flex justify-end"><Skeleton className="h-4 w-20" /></td>
                      </tr>
                    ))
                  ) : !stats?.networkBreakdown?.length ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No network data available</td>
                    </tr>
                  ) : (
                    stats.networkBreakdown.map((n) => (
                      <tr key={n.network} className="hover:bg-muted/30">
                        <td className="px-6 py-3 font-medium">{n.network}</td>
                        <td className="px-6 py-3 text-muted-foreground">{n.totalOrders.toLocaleString()}</td>
                        <td className="px-6 py-3 text-muted-foreground">{n.totalGB.toLocaleString()} GB</td>
                        <td className="px-6 py-3 text-right font-medium">GHS {n.totalSpent.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border">
              <h3 className="font-semibold">Recent Activity</h3>
            </div>
            <div className="divide-y divide-border">
              {statsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !stats?.recentActivity?.length ? (
                <div className="p-8 text-center text-muted-foreground">No recent activity</div>
              ) : (
                stats.recentActivity.map((act) => (
                  <div key={act.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{act.phoneNumber} • {act.capacity}GB {act.network}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(act.createdAt), "MMM d, HH:mm")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-primary">GHS {act.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 uppercase">{act.orderStatus}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-[20px] bg-card shadow-sm p-5 md:p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <Gift className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Referral Bonus</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Earn bonuses for referring other agents to the platform.
              </p>
              <button
                onClick={handleClaimBonus}
                disabled={claimBonusMutation.isPending}
                className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {claimBonusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim Bonus"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string, value: string | React.ReactNode, icon: any, loading?: boolean }) {
  return (
    <div className="border border-border rounded-[20px] p-4 md:p-5 bg-card shadow-sm flex flex-col justify-center">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground opacity-50" />
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24 mt-1" />
      ) : (
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      )}
    </div>
  );
}
