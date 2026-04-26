import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Wallet, 
  Activity, 
  Settings, 
  Sun, 
  Moon,
  ChevronRight,
  Database,
  Users,
  ArrowUpRight,
  MessageSquare,
  BarChart3,
  Mail,
  Store,
  LogOut,
  Search,
  Menu,
  X,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";

function ColorCircle({ color, name }: { color: string, name: string }) {
  const { setTheme } = useTheme();
  // We use a small hack to detect current primary from CSS variable
  const [isCurrent, setIsCurrent] = useState(false);

  useEffect(() => {
    const current = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    setIsCurrent(current === color);
  }, [color]);

  const handleClick = () => {
    document.documentElement.style.setProperty('--primary', color);
    setIsCurrent(true);
    // Force refresh others
    const event = new CustomEvent('themeChange', { detail: color });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const handleRefresh = (e: any) => {
       setIsCurrent(e.detail === color);
    };
    window.addEventListener('themeChange', handleRefresh);
    return () => window.removeEventListener('themeChange', handleRefresh);
  }, [color]);

  return (
    <button 
      onClick={handleClick}
      title={name}
      className={cn(
        "h-6 w-6 rounded-full transition-all hover:scale-125 border-2",
        isCurrent ? "border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "border-transparent"
      )}
      style={{ backgroundColor: `hsl(${color})` }}
    >
      {isCurrent && <Check size={12} className="mx-auto text-black font-black" />}
    </button>
  );
}

const MAIN_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Database },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

const TOOLS_LINKS = [
  { href: "/promo", label: "Promo Codes", icon: ArrowUpRight, badge: "NEW" },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/bot", label: "WhatsApp Bot", icon: MessageSquare, badge: "BETA" },
  { href: "/email", label: "Email Marketing", icon: Mail },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't show sidebar on login page
  if (location === "/login") {
    return <main className="min-h-screen bg-[#0B0F1A]">{children}</main>;
  }

  return (
    <div className="flex h-screen text-slate-100 overflow-hidden font-sans relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground glow-primary">
            <Store size={18} strokeWidth={2.5} />
          </div>
          <span className="font-black text-sm tracking-tight glow-text uppercase">Falaa Admin</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 glass-sidebar flex flex-col z-[70] transition-transform duration-300 lg:relative lg:w-72 lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand/Search Section */}
        <div className="p-8 pb-4 space-y-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Store size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight block leading-none">Falaa Admin</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-80">Store Control</span>
            </div>
          </Link>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search... (⌘ F)" 
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-primary/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">
          {/* Main Section */}
          <div className="space-y-1">
             {MAIN_LINKS.map((link) => (
                <SidebarLink 
                  key={link.href} 
                  {...link} 
                  isActive={isActive(location, link.href)} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
             ))}
          </div>

          {/* Tools Section */}
          <div className="space-y-1">
             <div className="flex items-center justify-between px-4 mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tools</p>
                <Settings size={12} className="text-slate-500" />
             </div>
             {TOOLS_LINKS.map((link) => (
                <SidebarLink 
                  key={link.href} 
                  {...link} 
                  isActive={isActive(location, link.href)} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
             ))}
          </div>

          {/* Brand Color Section */}
          <div className="px-6 space-y-4">
             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Brand Color</p>
             <div className="flex flex-wrap gap-2.5">
                {[
                  { name: 'Cyan',    value: '170 100% 50%' },
                  { name: 'Indigo',  value: '230 100% 65%' },
                  { name: 'Emerald', value: '150 100% 50%' },
                  { name: 'Amber',   value: '40 100% 60%' },
                  { name: 'Crimson', value: '350 100% 60%' },
                  { name: 'Rose',    value: '330 100% 65%' },
                  { name: 'Violet',  value: '270 100% 65%' },
                  { name: 'Lime',    value: '80 100% 50%' },
                  { name: 'Orange',  value: '25 100% 55%' },
                  { name: 'Sky',     value: '200 100% 60%' }
                ].map((color) => (
                  <ColorCircle 
                    key={color.name} 
                    color={color.value} 
                    name={color.name}
                  />
                ))}
             </div>
          </div>
        </div>

        <div className="p-8 space-y-4">
          <div className="glass-card bg-primary/5 border-primary/10 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform">
               <Activity size={40} />
            </div>
            <p className="text-xs font-black mb-1 relative z-10">Discover New Features!</p>
            <p className="text-[9px] text-slate-400 font-medium mb-3 relative z-10 leading-relaxed">Check out our latest performance analytics tools.</p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Upgrade Now
            </button>
          </div>

          <button 
            onClick={() => {
              localStorage.removeItem("admin_auth");
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-red-400 transition-all text-sm font-black uppercase tracking-tighter"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="w-full py-6 md:py-10 px-4 md:px-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function isActive(currentPath: string, linkPath: string) {
  if (linkPath === "/") return currentPath === "/";
  return currentPath.startsWith(linkPath);
}

function SidebarLink({ href, label, icon: Icon, isActive, badge, onClick }: { href: string, label: string, icon: any, isActive: boolean, badge?: string, onClick?: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group relative tracking-tight",
        isActive 
          ? "text-primary" 
          : "text-slate-500 hover:text-slate-100"
      )}
    >
      <Icon size={20} className={cn(
        "transition-transform",
        isActive ? "glow-primary" : "group-hover:scale-110"
      )} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={cn(
          "text-[8px] font-black px-2 py-0.5 rounded-md glow-primary",
          badge === "NEW" ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/20 text-primary"
        )}>
          {badge}
        </span>
      )}
      {isActive && (
        <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_20px_rgba(20,184,166,1)]" />
      )}
    </Link>
  );
}
