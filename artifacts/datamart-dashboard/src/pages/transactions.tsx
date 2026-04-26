import { useGetTransactions } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Transactions() {
  const { data: txRes, isLoading } = useGetTransactions({ page: 1, limit: 20 });
  const transactions = txRes?.data?.transactions || [];

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
      <div className="mt-4 md:mt-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Recent Transactions</h1>
        <p className="text-muted-foreground">View your recent wallet activity and purchases.</p>
      </div>

      <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-5 w-20 ml-auto" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx, idx) => {
              const isCredit = tx.type === "CREDIT" || tx.type === "DEPOSIT";
              const isFailed = tx.status === "FAILED";
              const isPending = tx.status === "PENDING";
              
              return (
                <div key={tx.reference || idx} className="p-4 md:p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full shrink-0",
                      isCredit 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30" 
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    )}>
                      {isCredit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm md:text-base">{tx.type.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] md:text-sm text-muted-foreground flex items-center gap-1.5">
                        {tx.createdAt ? format(new Date(tx.createdAt), "MMM d, h:mm a") : ""}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      isFailed ? "text-muted-foreground line-through" : (isCredit ? "text-green-600 dark:text-green-500" : "")
                    )}>
                      {isCredit ? "+" : "-"} GHS {tx.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      {isFailed ? (
                        <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      ) : isPending ? (
                        <span className="text-xs font-medium text-yellow-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Success
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
