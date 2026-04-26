import { useState } from "react";
import { useCreateWithdrawal, useGetWithdrawalStatus } from "@workspace/api-client-react";
import { CreditCard, AlertCircle, Loader2, Search, CheckCircle2, Clock, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const NETWORKS = [
  { id: "MTN", name: "MTN Mobile Money" },
  { id: "TELECEL", name: "Telecel Cash" },
  { id: "AIRTELTIGO", name: "AT Money" },
] as const;

export default function Withdrawals() {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState<typeof NETWORKS[number]["id"]>("MTN");
  const [checkRef, setCheckRef] = useState("");
  const [searchRef, setSearchRef] = useState("");

  const withdrawalMutation = useCreateWithdrawal();
  const { data: statusRes, isLoading: statusLoading, isError: statusError } = useGetWithdrawalStatus(searchRef, {
    query: { enabled: !!searchRef, retry: false }
  });

  const { toast } = useToast();
  const [successData, setSuccessData] = useState<any>(null);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) return;

    withdrawalMutation.mutate(
      { data: { amount: numAmount, phoneNumber, network } },
      {
        onSuccess: (res) => {
          setSuccessData(res.data);
          toast({ title: "Withdrawal Initiated", description: res.message });
          setAmount("");
          setPhoneNumber("");
        },
        onError: (err: any) => {
          toast({ title: "Withdrawal Failed", description: err?.message || "An error occurred", variant: "destructive" });
        }
      }
    );
  };

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRef.trim()) return;
    setSearchRef(checkRef.trim());
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
      <div className="mt-4 md:mt-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Withdrawals</h1>
        <p className="text-muted-foreground">Withdraw your wallet balance to mobile money.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Request Withdrawal
              </h3>
            </div>
            
            <div className="p-5 md:p-6">
              <div className="bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 p-4 rounded-lg mb-6 text-sm flex items-start gap-3 border border-blue-200 dark:border-blue-800/30">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Important Information</p>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li>Minimum withdrawal: GHS 10.00</li>
                    <li>Maximum withdrawal: GHS 1,000.00 per transaction</li>
                    <li>A standard 2% processing fee applies to all withdrawals</li>
                  </ul>
                </div>
              </div>

              {successData && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-6 rounded-xl mb-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-lg text-green-800 dark:text-green-300 mb-2">Withdrawal Initiated!</h4>
                  <p className="text-sm text-green-700 dark:text-green-400/80 mb-4">Your request is being processed.</p>
                  <div className="bg-background rounded-lg p-3 inline-block">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Reference Number</p>
                    <p className="font-mono font-bold tracking-wider">{successData.reference}</p>
                  </div>
                  <button 
                    onClick={() => setSuccessData(null)}
                    className="block w-full mt-4 text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
                  >
                    Make another withdrawal
                  </button>
                </div>
              )}

              {!successData && (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Amount (GHS)</label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      step="0.01"
                      required
                      placeholder="50.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Mobile Money Number</label>
                    <input
                      type="text"
                      required
                      placeholder="0241234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Network</label>
                    <select
                      required
                      value={network}
                      onChange={(e) => setNetwork(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {NETWORKS.map((n) => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={withdrawalMutation.isPending}
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-2 disabled:opacity-50"
                  >
                    {withdrawalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw Funds"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                Check Status
              </h3>
            </div>
            <div className="p-5 md:p-6">
              <form onSubmit={handleCheckStatus} className="flex gap-2 mb-6">
                <input
                  type="text"
                  required
                  placeholder="Enter Reference No."
                  value={checkRef}
                  onChange={(e) => setCheckRef(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!checkRef.trim() || statusLoading}
                  className="h-10 px-4 rounded-md bg-secondary text-secondary-foreground font-medium flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                </button>
              </form>

              {searchRef && (
                <div className="border border-border rounded-lg bg-muted/20 p-4 md:p-5">
                  {statusLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                      <p className="text-sm">Fetching status...</p>
                    </div>
                  ) : statusError ? (
                    <div className="text-center py-6 text-muted-foreground space-y-2">
                      <XCircle className="h-8 w-8 mx-auto text-destructive opacity-80" />
                      <p className="text-sm">Could not find withdrawal reference.</p>
                    </div>
                  ) : statusRes?.data ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold">Amount</p>
                          <p className="font-bold text-lg">GHS {statusRes.data.amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</p>
                          <StatusBadge status={statusRes.data.status} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-0.5">Phone Number</p>
                          <p className="font-medium">{statusRes.data.phoneNumber}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-0.5">Network</p>
                          <p className="font-medium">{statusRes.data.network}</p>
                        </div>
                        {statusRes.data.fee && (
                          <div>
                            <p className="text-muted-foreground mb-0.5">Fee Applied</p>
                            <p className="font-medium text-destructive">GHS {statusRes.data.fee.toFixed(2)}</p>
                          </div>
                        )}
                        {statusRes.data.createdAt && (
                          <div>
                            <p className="text-muted-foreground mb-0.5">Date</p>
                            <p className="font-medium">{format(new Date(statusRes.data.createdAt), "MMM d, yyyy")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";
  const isProcessing = status === "PROCESSING";
  const isPending = status === "PENDING";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
      isCompleted && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      isFailed && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      isProcessing && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      isPending && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
    )}>
      {isCompleted && <CheckCircle2 className="h-3 w-3" />}
      {isFailed && <XCircle className="h-3 w-3" />}
      {isProcessing && <Activity className="h-3 w-3" />}
      {isPending && <Clock className="h-3 w-3" />}
      {status}
    </span>
  );
}
