import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/rhc";
import type { GmgnWalletActivity, GmgnResult } from "../types";
import { unwrapGmgnResult } from "../utils";

interface RecentActivityTimelineProps {
  gmgnWalletActivity: GmgnResult<GmgnWalletActivity>;
}

// Helper to get activity title and description
const getActivityInfo = (activity: GmgnWalletActivity["activities"][0]) => {
  switch (activity.type) {
    case "buy":
      return {
        title: `Bought ${activity.token.symbol}`,
        description: `Spent $${activity.cost_usd.toLocaleString()} on ${activity.token.symbol}`,
      };
    case "sell":
      return {
        title: `Sold ${activity.token.symbol}`,
        description: `Received $${activity.cost_usd.toLocaleString()} for selling ${activity.token.symbol}`,
      };
    case "transferIn":
      return {
        title: `Received ${activity.token.symbol}`,
        description: `Received ${activity.token_amount} ${activity.token.symbol}`,
      };
    case "transferOut":
      return {
        title: `Sent ${activity.token.symbol}`,
        description: `Sent ${activity.token_amount} ${activity.token.symbol}`,
      };
    case "add":
      return {
        title: `Added Liquidity`,
        description: `Added liquidity for ${activity.token.symbol}`,
      };
    case "remove":
      return {
        title: `Removed Liquidity`,
        description: `Removed liquidity for ${activity.token.symbol}`,
      };
    default:
      return {
        title: "Activity",
        description: "Wallet activity",
      };
  }
};

export function RecentActivityTimeline({ gmgnWalletActivity }: RecentActivityTimelineProps) {
  const activityData = unwrapGmgnResult(gmgnWalletActivity);
  const activities = activityData?.activities ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
      className="neon-panel rounded-3xl p-8"
    >
      <div className="flex items-center gap-4 mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Timeline of events</p>
        </div>
      </div>

      <div className="space-y-8">
        {activities.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-16 h-16" />}
            title="No Activity Yet"
            description="This wallet hasn't had any recent activity."
          />
        ) : (
          activities.map((activity, i) => {
            const info = getActivityInfo(activity);
            return (
              <motion.div
                key={activity.transaction_hash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.75 + i * 0.1 }}
                className="relative pl-8"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-neon shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
                {/* Timeline line */}
                {i < activities.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gradient-to-b from-neon to-transparent" />
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{info.title}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {timeAgo(activity.timestamp * 1000)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{info.description}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.section>
  );
}
