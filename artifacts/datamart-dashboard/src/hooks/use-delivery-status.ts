import { useGetDeliveryTracker } from "@workspace/api-client-react";
import { parse, differenceInMinutes } from "date-fns";
import { Activity, Clock, AlertTriangle, Timer, Zap } from "lucide-react";
import React from "react";

export type DeliveryPerformance = "ultra-fast" | "fast" | "moving" | "steady" | "slow";

export function useDeliveryStatus() {
  const { data: trackerRes, isLoading } = useGetDeliveryTracker({
    query: { refetchInterval: 15000 }
  });

  const tracker = trackerRes?.data;
  const summary = tracker?.lastDelivered?.summary;

  const getStatusData = (summary?: string) => {
    if (!summary) return null;

    try {
      const match = summary.match(/placed at (.*?), delivered at (.*)/);
      if (!match) return null;

      const [_, placedStr, deliveredStr] = match;
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const placedAt = parse(`${placedStr} ${currentYear}`, "MMM d, hh:mm a yyyy", new Date());
      const deliveredAt = parse(`${deliveredStr} ${currentYear}`, "MMM d, hh:mm a yyyy", new Date());
      
      const diff = Math.abs(differenceInMinutes(deliveredAt, placedAt));

      if (diff >= 120) {
        return {
          message: "Deliveries are currently slow. Expect your order in 2 to 4hours .",
          status: "slow" as DeliveryPerformance,
          icon: AlertTriangle,
          colorClass: "text-amber-500",
          bgClass: "bg-amber-500/5",
          borderClass: "border-amber-500/20",
          accentColor: "amber-500",
          dotColor: "bg-red-500"
        };
      }

      if (diff >= 60) {
        return {
          message: "Portal is processing steadily. Estimated delivery time: 1 to 2 hours.",
          status: "steady" as DeliveryPerformance,
          icon: Timer,
          colorClass: "text-amber-400",
          bgClass: "bg-amber-500/5",
          borderClass: "border-amber-500/20",
          accentColor: "amber-400",
          dotColor: "bg-amber-500"
        };
      }

      if (diff >= 30) {
        return {
          message: "Deliveries are moving well. Expect your order within the hour",
          status: "moving" as DeliveryPerformance,
          icon: Clock,
          colorClass: "text-emerald-400",
          bgClass: "bg-emerald-500/5",
          borderClass: "border-emerald-500/20",
          accentColor: "emerald-500",
          dotColor: "bg-emerald-500"
        };
      }

      if (diff >= 5) {
        return {
          message: "Deliveries are blazing fast! Your order should arrive within minutes.",
          status: "fast" as DeliveryPerformance,
          icon: Activity,
          colorClass: "text-emerald-400",
          bgClass: "bg-emerald-500/5",
          borderClass: "border-emerald-500/20",
          accentColor: "emerald-500",
          dotColor: "bg-emerald-400"
        };
      }

      return {
        message: "Ultra fast deliveries! Your order should arrive within minutes.",
        status: "ultra-fast" as DeliveryPerformance,
        icon: Zap,
        colorClass: "text-yellow-400",
        bgClass: "bg-yellow-500/10",
        borderClass: "border-yellow-500/30",
        accentColor: "yellow-500",
        dotColor: "bg-yellow-400"
      };
    } catch (err) {
      console.error("Failed to parse delivery times:", err);
      return null;
    }
  };

  const status = getStatusData(summary);

  return {
    status,
    isLoading,
    tracker,
  };
}
