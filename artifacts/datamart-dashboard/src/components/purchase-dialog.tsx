import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getBaseUrl } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DataPackage } from "@workspace/api-client-react";
import type { NetworkId } from "@/pages/buy";
import { Loader2, CheckCircle2, ChevronRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NETWORK_LABELS: Record<NetworkId, string> = {
  YELLO: "MTN",
  TELECEL: "Telecel",
  AT_PREMIUM: "AT Premium",
  at: "AirtelTigo",
};

const purchaseSchema = z.object({
  customerName: z
    .string()
    .min(1, "Name is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9]+$/, "Must contain only numbers"),
});

type FormValues = z.infer<typeof purchaseSchema>;

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackage: DataPackage | null;
  network: NetworkId;
}

export function PurchaseDialog({ open, onOpenChange, selectedPackage, network }: PurchaseDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [successData, setSuccessData] = useState<{ reference: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { 
      customerName: "",
      phoneNumber: "" 
    },
  });

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSuccessData(null);
        form.reset();
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(t);
    }
    return;
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    console.log("SUBMITTING ORDER:", values);
    if (!selectedPackage) {
      console.error("No package selected!");
      return;
    }
    setIsLoading(true);

    try {
      const baseUrl = getBaseUrl() || "";
      const endpoint = "/api/paystack/initialize";
      const fullUrl = baseUrl.startsWith("http") ? `${baseUrl}${endpoint}` : endpoint;
      
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: values.customerName,
          phoneNumber: values.phoneNumber,
          network,
          capacity: String(selectedPackage.capacity),
          amount: selectedPackage.price,
        }),
      });

      const data = await response.json();

      if (data.status === "success" && data.data?.authorizationUrl) {
        // Redirect to Paystack checkout
        window.location.href = data.data.authorizationUrl;
      } else {
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: data.error || data.message || "Could not initialize payment.",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Order reference copied to clipboard." });
  };

  const viewOrder = () => {
    if (successData?.reference) {
      setLocation(`/order/${successData.reference}`);
      onOpenChange(false);
    }
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {successData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Purchase Successful</h2>
              <p className="text-muted-foreground">{successData.message}</p>
            </div>

            <div className="bg-muted w-full p-4 rounded-lg flex items-center justify-between border border-border">
              <div className="text-left">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Order Reference</p>
                <p className="font-mono font-bold text-lg">{successData.reference}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(successData.reference)}
                title="Copy reference"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button className="flex-1 group" onClick={viewOrder}>
                Track Order
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete Purchase</DialogTitle>
              <DialogDescription>
                Enter the phone number to receive this data bundle.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 p-4 rounded-lg border border-border mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">Network</span>
                <span className={cn(
                  "font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm border transition-colors",
                  network === "YELLO" && "bg-[#FFCC00] text-slate-900 border-[#FF9500]/50",
                  network === "TELECEL" && "bg-[#E60000] text-white border-red-700/50",
                  network === "at" && "bg-[#0033A0] text-white border-blue-900/50",
                  !["YELLO", "TELECEL", "at"].includes(network) && "bg-background text-foreground border-border"
                )}>
                  {NETWORK_LABELS[network]}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">Package</span>
                <span className="font-bold">{selectedPackage.capacity} GB ({selectedPackage.mb} MB)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                <span className="text-sm font-medium text-muted-foreground">Total Price</span>
                <span className="font-bold text-lg text-primary">
                  GHS {Number(selectedPackage.price).toFixed(2)}
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Recipient Name (e.g. Ama Serwaa)"
                          type="text"
                          {...field}
                          className="text-lg py-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0241234567"
                          type="tel"
                          autoComplete="tel"
                          {...field}
                          className="text-lg py-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-32"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting to Payment...
                      </>
                    ) : (
                      "Pay Now"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
