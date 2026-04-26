import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import {
  Building2, Mail, Phone, CalendarDays, MapPin, Zap,
  ShieldCheck, Clock, Target, CheckCircle2, MessageCircle, PhoneCall,
} from "lucide-react";

function FadeSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(
        "transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

const INFO_ROWS = [
  { icon: Building2, label: "Business Name", value: "Falaa Deals" },
  { icon: Mail,      label: "Email",         value: "falaadeal@gmail.com" },
  { icon: Phone,     label: "Phone",         value: "0593829640" },
  { icon: CalendarDays, label: "Established", value: "January 15, 2026" },
  { icon: Clock,     label: "In Business",   value: "Active since 2026" },
  { icon: MapPin,    label: "Location",      value: "Kasoa, Central Region" },
];

const WHY_CHOOSE = [
  {
    icon: Zap,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    title: "Fast Delivery",
    desc: "Get your data bundles delivered within 10–60 minutes on any network.",
  },
  {
    icon: ShieldCheck,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    title: "Secure Payments",
    desc: "100% secure payment processing with multiple options. Your money is safe.",
  },
  {
    icon: Clock,
    color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    title: "24 / 7 Support",
    desc: "Always here to help via WhatsApp or phone whenever you need us.",
  },
];

const MISSION_POINTS = [
  "Quality service with fast delivery",
  "Affordable pricing for all budgets",
  "Dedicated customer support",
  "All major networks supported",
];

export default function About() {
  return (
    <div className="flex flex-col gap-8 pb-28 md:pb-12 w-full">

      {/* ── Hero ── */}
      <FadeSection className="relative overflow-hidden rounded-[20px] text-white px-6 py-12 md:px-10 md:py-20 shadow-2xl isolate border border-white/10 group">
        {/* Banner with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 z-[-2]" 
          style={{ backgroundImage: 'url("/about-banner.jpg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/95 via-[#0f172a]/80 to-primary/20 z-[-1]" />
        
        <div className="absolute -top-1/2 -left-1/4 w-[80%] h-[150%] rounded-full bg-emerald-600/10 blur-[100px] mix-blend-screen animate-blob pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[80%] rounded-full bg-primary/10 blur-[100px] mix-blend-screen animate-blob pointer-events-none" style={{ animationDelay: '2s' }} />
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,black,transparent)] z-[-1]" />

        <div className="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Building2 className="w-4 h-4 text-emerald-400" />
            About us
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 drop-shadow-lg">
            Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-primary/80 animate-pulse-slow">Story</span>
          </h1>
          <p className="text-indigo-100/80 leading-relaxed font-medium text-base md:text-lg">
            Providing affordable, reliable data bundles to everyone in Ghana — making internet connectivity accessible for work, education, and entertainment.
          </p>
        </div>
      </FadeSection>

      {/* ── Store information ── */}
      <FadeSection delay={80}>
        <div className="bg-card border border-border rounded-[20px] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="font-bold text-base">Store Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y md:divide-y-0 divide-border">
            {INFO_ROWS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-6 hover:bg-muted/20 transition-colors">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </span>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
                  <p className="font-bold text-sm md:text-base tracking-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── Why Choose Us ── */}
      <FadeSection delay={120}>
        <div className="space-y-6">
          <h2 className="font-black text-xl md:text-2xl tracking-tight">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {WHY_CHOOSE.map(({ icon: Icon, color, title, desc }, i) => (
              <div
                key={title}
                className="group relative flex flex-col items-start gap-5 bg-card border border-border rounded-[24px] p-6 md:p-8 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden isolate active:scale-95 active:brightness-95"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-[-1]" />
                <span className={cn("flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-black/5", color)}>
                  <Icon className="w-6 h-6" />
                </span>
                <div className="relative z-10">
                  <p className="font-black text-lg md:text-xl mb-2 group-hover:text-primary transition-colors tracking-tight">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed opacity-80">{desc}</p>
                </div>
                <div className="mt-4 w-full h-1 bg-muted rounded-full overflow-hidden opacity-20">
                    <div className="h-full bg-primary w-0 group-hover:w-full transition-all duration-1000" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── Mission ── */}
      <FadeSection delay={160}>
        <div className="bg-card border border-border rounded-[20px] p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </span>
            <h2 className="font-bold text-base">Our Mission</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To provide affordable and reliable data bundles to everyone, making internet connectivity accessible for work, education, and entertainment.
          </p>
          <ul className="flex flex-col gap-2">
            {MISSION_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </FadeSection>

      {/* ── Contact CTA ── */}
      <FadeSection delay={200}>
        <div className="bg-gradient-to-br from-muted/50 via-card to-muted/80 rounded-[30px] border border-border p-8 md:p-12 text-center space-y-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />
          
          <h2 className="font-black text-2xl md:text-3xl tracking-tight">Have Questions?</h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto">We're here to help you get connected. Reach out to our dedicated support team anytime.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <a
              href="https://wa.me/233593829640"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-base px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-[#25D366]/20 hover:-translate-y-1 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us
            </a>
            <a
              href="tel:+233593829640"
              className="group flex items-center justify-center gap-3 bg-card hover:bg-muted border border-border font-black text-base px-8 py-4 rounded-2xl transition-all hover:-translate-y-1 active:scale-95 shadow-sm"
            >
              <PhoneCall className="w-5 h-5 text-primary" />
              Call Support
            </a>
          </div>
        </div>
      </FadeSection>

    </div>
  );
}
