import { motion, AnimatePresence } from "framer-motion";
import { Rocket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { TokenCard } from "./TokenCard.tsx";
import type { GmgnCreatedTokens, GmgnResult } from "../types";
import { unwrapGmgnResult } from "../utils";

interface LaunchHistorySectionProps {
  gmgnCreatedTokens: GmgnResult<GmgnCreatedTokens>;
}

export function LaunchHistorySection({ gmgnCreatedTokens }: LaunchHistorySectionProps) {
  const createdTokensData = unwrapGmgnResult(gmgnCreatedTokens);
  const tokens = createdTokensData?.tokens ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="neon-panel rounded-3xl overflow-hidden"
    >
      <div className="p-8 border-b border-border/60 bg-surface/50 flex items-center gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Launch History</h2>
          <p className="text-xs text-muted-foreground">{tokens.length} tokens deployed</p>
        </div>
      </div>
      <div className="p-4">
        <AnimatePresence>
          {tokens.length === 0 ? (
            <EmptyState
              icon={<Rocket className="w-16 h-16" />}
              title="No Launch History Yet"
              description="This wallet hasn't deployed any tokens yet. Check back later."
            />
          ) : (
            <div className="space-y-4">
              {tokens.map((token, i) => (
                <TokenCard key={token.token_address} token={token} index={i} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
