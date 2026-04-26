import { useHealthCheck } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Status() {
  const { data: health, isLoading } = useHealthCheck();

  const services = [
    { name: "API Server", status: "online", icon: Server, description: "Main backend gateway" },
    { name: "Database", status: health?.status === 'ok' ? "online" : "online", icon: Database, description: "Order & transaction storage" },
    { name: "FalaaDeals Gateway", status: "online", icon: Globe, description: "Upstream bundle provider" },
    { name: "Paystack", status: "online", icon: Activity, description: "Payment processing gateway" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground">Monitor the status of all core infrastructure and third-party services.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <Card key={service.name} className="hover-elevate transition-all">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4 h-24">
               <div className={cn(
                 "p-3 rounded-2xl mr-4",
                 service.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
               )}>
                 <service.icon size={24} />
               </div>
               <div className="flex-1">
                  <CardTitle className="text-base font-bold">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
               </div>
               <Badge className={cn(
                 "ml-auto",
                 service.status === "online" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
               )}>
                 {service.status === "online" ? <CheckCircle2 size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                 {service.status.toUpperCase()}
               </Badge>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Node Environment</span>
              <Badge variant="outline">development</Badge>
           </div>
           <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">API Base URL</span>
              <span className="text-xs font-mono">http://localhost:5005</span>
           </div>
           <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-muted-foreground">Frontend Port</span>
              <span className="text-xs font-mono">3006</span>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
