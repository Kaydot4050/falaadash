import { useState } from "react";
import { useGetPurchaseHistory, getGetPurchaseHistoryQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock, Search, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PurchaseHistory() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: historyRes, isLoading } = useGetPurchaseHistory({ page, limit });
  const data = historyRes?.data;
  const purchases = data?.purchases || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
      <div className="mt-4 md:mt-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Purchase History</h1>
        <p className="text-muted-foreground">View all your past data purchases.</p>
      </div>

      <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] md:text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 md:px-6 md:py-4 font-medium whitespace-nowrap">Date</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-medium whitespace-nowrap">Phone Number</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-medium whitespace-nowrap">Package</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-medium whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-medium whitespace-nowrap">Reference</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4 flex justify-end"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  </tr>
                ))
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No purchase history found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const status = p.orderStatus?.toLowerCase() || "";
                  const isCompleted = status === "completed" || status === "delivered" || status === "success" || status === "fulfilled";
                  const isFailed = status === "failed" || status === "cancel";
                  const isPending = status === "pending" || status === "processing";

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-[11px] md:text-sm text-muted-foreground">
                        {format(new Date(p.createdAt), "MMM d, HH:mm")}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap font-bold text-xs md:text-sm">
                        {p.phoneNumber}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <span className="font-extrabold text-[11px] md:text-sm">{p.capacity}GB</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{p.network}</span>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap font-bold text-xs md:text-sm">
                        GHS {p.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap font-mono text-[9px] md:text-xs text-muted-foreground uppercase tracking-wider">
                        {p.orderReference}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          isCompleted && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          isFailed && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          isPending && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                        )}>
                          {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                          {isFailed && <XCircle className="h-3 w-3" />}
                          {isPending && <Clock className="h-3 w-3" />}
                          {p.orderStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page <span className="font-medium text-foreground">{pagination.currentPage}</span> of <span className="font-medium text-foreground">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-9 px-3 flex items-center gap-1.5 rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="h-9 px-3 flex items-center gap-1.5 rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm font-medium"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
