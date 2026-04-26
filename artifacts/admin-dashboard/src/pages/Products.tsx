import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Search, 
  Edit2, 
  Eye, 
  EyeOff, 
  Zap, 
  CloudOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { customFetch } from "@workspace/api-client-react";

// Types
interface DataPackage {
  id: string;
  capacity: string;
  mb?: string;
  price: string;
  oldPrice?: string;
  showOldPrice?: boolean;
  network: string;
  inStock: boolean;
  isHidden?: boolean;
}

export default function Products() {
  const [activeTab, setActiveTab] = useState<string>("YELLO");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editOldPrice, setEditOldPrice] = useState("");

  const queryClient = useQueryClient();

  // Fetch Packages
  const { data: packagesData, isLoading, refetch } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const data = await customFetch<any>("/api/packages?admin=true");
      return data.data as Record<string, DataPackage[]>;
    }
  });

  // Mutation to update package
  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<DataPackage> & { id: string }) => {
      const parts = updated.id.split("_");
      const network = parts[0];
      const capacity = parts[1]?.replace("GB", "").replace("MB", "");

      return await customFetch("/api/admin/packages/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updated.id,
          network,
          capacity,
          customPrice: updated.price,
          customOldPrice: updated.oldPrice,
          showOldPrice: updated.showOldPrice,
          inStock: updated.inStock,
          isHidden: updated.isHidden
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Changes Saved Live!");
    },
    onError: (err) => {
      toast.error("Save Failed: Try again");
      console.error("DEBUG SAVE ERROR:", err);
    }
  });

  const networks = useMemo(() => ["YELLO", "at", "TELECEL"], []);
  
  const filteredPackages = useMemo(() => {
    if (!packagesData) return [];
    const pkgs = packagesData[activeTab] || [];
    if (!searchTerm) return pkgs;
    const s = searchTerm.toLowerCase();
    return pkgs.filter(p => 
      p.capacity.toLowerCase().includes(s) ||
      p.price.toString().includes(s)
    );
  }, [packagesData, activeTab, searchTerm]);

  const stats = useMemo(() => {
    if (!packagesData) return { total: 0, active: 0, oos: 0 };
    const all = Object.values(packagesData).flat();
    return {
      total: all.length,
      active: all.filter(p => !p.isHidden).length,
      oos: all.filter(p => !p.inStock).length
    };
  }, [packagesData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Syncing Inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter glow-text">Catalog</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Product Inventory</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              placeholder="Search bundles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 glass rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-primary/30 transition-all"
            />
          </div>
          <button 
            onClick={() => refetch()}
            className="h-11 w-11 flex items-center justify-center glass rounded-xl text-slate-400 hover:text-primary transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* ── Network Filters ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {networks.map((net) => (
          <button 
            key={net}
            onClick={() => setActiveTab(net)}
            className={cn(
              "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
              activeTab === net
                ? "bg-primary text-primary-foreground border-primary glow-primary" 
                : "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"
            )}
          >
            {net === "YELLO" ? "MTN" : net === "at" ? "AirtelTigo" : net}
          </button>
        ))}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatsCard label="Total Bundles" value={stats.total} icon={<Package size={14} />} />
        <StatsCard label="Live Online" value={stats.active} icon={<CheckCircle2 size={14} />} color="text-primary" />
        <StatsCard label="Stock Alert" value={stats.oos} icon={<AlertCircle size={14} />} color="text-red-400" />
        <StatsCard label="API Health" value="100%" icon={<Zap size={14} />} color="text-emerald-400" />
      </div>

      {/* ── Table Section ── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 px-8 text-slate-500">Bundle</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500 text-center">Retail (₵)</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500 text-center">Slashed (₵)</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500 text-center">Stock</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-black py-6 text-slate-500 text-center">Visibility</TableHead>
                <TableHead className="text-right py-6 px-8 text-[10px] uppercase font-black tracking-widest text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => {
                const pkgId = `${pkg.network}_${pkg.capacity}${pkg.mb ? 'MB' : 'GB'}`;
                const isEditing = editingId === pkgId;

                return (
                  <TableRow key={pkgId} className="group border-white/5 hover:bg-white/[0.01] transition-all">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl glass flex items-center justify-center font-black text-[10px] border border-white/10 group-hover:border-primary/20 transition-all",
                          pkg.network === "YELLO" ? "text-amber-500" : pkg.network === "at" ? "text-blue-500" : "text-red-500"
                        )}>
                          {pkg.network === "YELLO" ? "MTN" : pkg.network === "at" ? "AT" : "T"}
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight">{pkg.capacity}GB</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">High Speed Data</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {isEditing ? (
                        <input 
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-20 glass border-primary/40 rounded-lg py-1 px-2 text-center font-black text-xs text-primary focus:outline-none"
                        />
                      ) : (
                        <p className="font-black text-sm tracking-tighter">₵{pkg.price}</p>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch 
                          checked={pkg.showOldPrice} 
                          onCheckedChange={(val) => updateMutation.mutate({ ...pkg, showOldPrice: val, id: pkgId })}
                          className="scale-75 data-[state=checked]:bg-primary"
                        />
                        <span className={cn(
                          "text-[10px] font-bold transition-opacity",
                          pkg.showOldPrice ? "text-slate-400 line-through" : "text-slate-700"
                        )}>
                          ₵{pkg.oldPrice || '0.00'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-3">
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest",
                           pkg.inStock ? "text-emerald-500" : "text-red-500"
                         )}>{pkg.inStock ? 'Active' : 'OOS'}</span>
                         <Switch 
                            checked={pkg.inStock} 
                            onCheckedChange={(val) => updateMutation.mutate({ ...pkg, inStock: val, id: pkgId })}
                            className="scale-75 data-[state=checked]:bg-emerald-500"
                          />
                       </div>
                    </TableCell>

                    <TableCell className="text-center">
                         <button 
                           onClick={() => updateMutation.mutate({ ...pkg, isHidden: !pkg.isHidden, id: pkgId })}
                           className={cn(
                             "h-8 w-8 rounded-xl glass border-white/5 flex items-center justify-center transition-all",
                             pkg.isHidden ? "text-red-400" : "text-emerald-400"
                           )}
                         >
                           {pkg.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                         </button>
                    </TableCell>

                    <TableCell className="text-right px-8">
                       {isEditing ? (
                         <div className="flex items-center justify-end gap-2">
                            <button 
                              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105"
                              onClick={() => {
                                updateMutation.mutate({ ...pkg, price: editPrice, id: pkgId });
                                setEditingId(null);
                              }}
                            >
                              SAVE
                            </button>
                            <button className="text-slate-500 hover:text-white" onClick={() => setEditingId(null)}>
                              <CloudOff size={14} />
                            </button>
                         </div>
                       ) : (
                         <button 
                           className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all"
                           onClick={() => { setEditingId(pkgId); setEditPrice(pkg.price); }}
                         >
                           Edit Pricing
                         </button>
                       )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color?: string }) {
  return (
    <div className="glass-card p-6 group cursor-default relative overflow-hidden transition-all hover:border-primary/20">
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <div className="text-slate-600 group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
      <p className={cn("text-2xl font-black tracking-tighter glow-text", color || "text-white")}>{value}</p>
    </div>
  );
}
