import { useState } from "react";
import { useGetDataPackages, useBulkPurchase } from "@workspace/api-client-react";
import type { DataPackage, BulkOrderItem } from "@workspace/api-client-react";
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type NetworkId = "YELLO" | "TELECEL" | "AT_PREMIUM";

const NETWORKS: { id: NetworkId; name: string }[] = [
  { id: "YELLO", name: "MTN" },
  { id: "TELECEL", name: "Telecel" },
  { id: "AT_PREMIUM", name: "AT" },
];

export default function BulkPurchase() {
  const [rows, setRows] = useState<{ id: string; phoneNumber: string; network: NetworkId; capacity: string }[]>([
    { id: "1", phoneNumber: "", network: "YELLO", capacity: "" },
  ]);

  const { data: packagesRes, isLoading: packagesLoading } = useGetDataPackages();
  const packagesData = packagesRes?.data;

  const bulkPurchaseMutation = useBulkPurchase();
  const [results, setResults] = useState<any>(null);
  const [errorData, setErrorData] = useState<any>(null);

  const addRow = () => {
    if (rows.length >= 50) return;
    setRows([...rows, { id: Math.random().toString(), phoneNumber: "", network: "YELLO", capacity: "" }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const calculateTotalCost = () => {
    let total = 0;
    rows.forEach((row) => {
      if (row.network && row.capacity && packagesData) {
        const pkgs = packagesData[row.network] || [];
        const pkg = pkgs.find((p: DataPackage) => p.capacity.toString() === row.capacity);
        if (pkg) {
          total += Number(pkg.price);
        }
      }
    });
    return total;
  };

  const isFormValid = rows.every((r) => r.phoneNumber.length >= 10 && r.network && r.capacity) && rows.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setErrorData(null);
    setResults(null);

    const orders: BulkOrderItem[] = rows.map((r, i) => ({
      phoneNumber: r.phoneNumber,
      network: r.network as any,
      capacity: r.capacity,
      ref: `bulk-${i}-${Date.now()}`
    }));

    bulkPurchaseMutation.mutate(
      { data: { orders } },
      {
        onSuccess: (res) => {
          setResults(res.data);
        },
        onError: (err: any) => {
          if (err.status === 400 && err.data) {
            setErrorData(err.data);
          }
        },
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
      <div className="mt-4 md:mt-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Bulk Purchase</h1>
        <p className="text-muted-foreground">Submit up to 50 data orders at once.</p>
      </div>

      {errorData && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold">Insufficient Balance</p>
            <p className="text-sm mt-1">
              Required: GHS {Number(errorData.totalCost ?? 0).toFixed(2)} | Current: GHS {Number(errorData.walletBalance ?? 0).toFixed(2)} | Shortfall: GHS {Number(errorData.shortfall ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {!results ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden">
            <div className="p-3.5 sm:p-6 space-y-4">
              {rows.map((row, index) => {
                const availablePackages = packagesData ? packagesData[row.network] || [] : [];
                return (
                  <div key={row.id} className="flex flex-col sm:flex-row gap-3 items-end p-3.5 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="w-full sm:w-12 text-center text-sm font-medium text-muted-foreground shrink-0 pb-3 sm:pb-0">
                      #{index + 1}
                    </div>
                    <div className="w-full space-y-1.5 flex-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
                      <input
                        type="text"
                        required
                        placeholder="0241234567"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={row.phoneNumber}
                        onChange={(e) => updateRow(row.id, "phoneNumber", e.target.value)}
                      />
                    </div>
                    <div className="w-full space-y-1.5 flex-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Network</label>
                      <select
                        required
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={row.network}
                        onChange={(e) => {
                          updateRow(row.id, "network", e.target.value);
                          updateRow(row.id, "capacity", ""); // reset capacity
                        }}
                      >
                        {NETWORKS.map((n) => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full space-y-1.5 flex-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Capacity</label>
                      <select
                        required
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        value={row.capacity}
                        onChange={(e) => updateRow(row.id, "capacity", e.target.value)}
                        disabled={packagesLoading}
                      >
                        <option value="" disabled>Select Package</option>
                        {availablePackages.map((p: DataPackage) => (
                          <option key={p.capacity} value={p.capacity}>
                            {p.capacity} GB - GHS {Number(p.price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-auto mt-3 sm:mt-0 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {rows.length < 50 && (
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline px-2 py-1"
                >
                  <Plus className="h-4 w-4" /> Add Row
                </button>
              )}
            </div>
            
            <div className="bg-muted/50 p-3.5 sm:p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium space-x-4">
                <span>Total Orders: <span className="font-bold">{rows.length}</span></span>
                <span>Estimated Cost: <span className="font-bold text-primary">GHS {calculateTotalCost().toFixed(2)}</span></span>
              </div>
              <button
                type="submit"
                disabled={!isFormValid || bulkPurchaseMutation.isPending}
                className="w-full sm:w-auto h-10 px-8 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {bulkPurchaseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Bulk Order"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border rounded-[20px] p-4 md:p-5 bg-card shadow-sm text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Processed</p>
              <p className="text-3xl font-bold mt-1">{results.summary?.total || 0}</p>
            </div>
            <div className="border border-border rounded-[20px] p-4 md:p-5 bg-card shadow-sm text-center">
              <p className="text-sm font-medium text-green-600 dark:text-green-500">Successful</p>
              <p className="text-3xl font-bold mt-1">{results.summary?.successful || 0}</p>
            </div>
            <div className="border border-border rounded-[20px] p-4 md:p-5 bg-card shadow-sm text-center">
              <p className="text-sm font-medium text-red-600 dark:text-red-500">Failed</p>
              <p className="text-3xl font-bold mt-1">{results.summary?.failed || 0}</p>
            </div>
          </div>

          <div className="border border-border rounded-[20px] bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Order Results</h3>
              <button 
                onClick={() => {
                  setResults(null);
                  setRows([{ id: Math.random().toString(), phoneNumber: "", network: "YELLO", capacity: "" }]);
                }}
                className="text-sm text-primary font-medium hover:underline"
              >
                New Bulk Order
              </button>
            </div>
            <div className="divide-y divide-border">
              {results.results?.map((res: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                      #{res.index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{res.phoneNumber}</p>
                      <p className="text-xs text-muted-foreground">{res.network} • {res.capacity}GB</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {res.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                    {res.error && <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate">{res.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
