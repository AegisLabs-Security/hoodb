import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ShieldCheck, ExternalLink, FileCode2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { TokenCard } from "./TokenCard.tsx";
import { explorerAddr, explorerTx, timeAgo, type DeployedContract } from "@/lib/rhc";
import type { GmgnCreatedTokens, GmgnResult } from "../types";
import { getGmgnErrorMessage, unwrapGmgnResult } from "../utils";

interface LaunchHistorySectionProps {
  gmgnCreatedTokens: GmgnResult<GmgnCreatedTokens>;
  deployedContracts: DeployedContract[];
}

export function LaunchHistorySection({ gmgnCreatedTokens, deployedContracts }: LaunchHistorySectionProps) {
  const createdTokensData = unwrapGmgnResult(gmgnCreatedTokens);
  const gmgnMessage = getGmgnErrorMessage(gmgnCreatedTokens);
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
          {!createdTokensData && deployedContracts.length > 0 ? (
            <div className="space-y-4">
              {gmgnMessage && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-muted-foreground">
                  {gmgnMessage}
                </div>
              )}
              {deployedContracts.map((contract, i) => (
                <motion.div
                  key={contract.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.05 }}
                  className="group rounded-2xl border border-border p-6 bg-surface/50 hover:bg-surface/80 hover:border-neon/30 transition-all duration-300"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-neon/30 bg-neon/10">
                        <FileCode2 className="h-6 w-6 text-neon" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-xl group-hover:text-neon transition">
                            {contract.name ?? contract.tokenSymbol ?? "Unnamed Contract"}
                          </h3>
                          {contract.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-neon/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neon">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          )}
                          {contract.isToken && (
                            <span className="inline-flex items-center rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300">
                              Token
                            </span>
                          )}
                        </div>
                        <p className="mt-2 font-mono text-sm text-muted-foreground break-all">{contract.address}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Deployed {timeAgo(contract.deployedAt)}</p>
                      </div>
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Type</span>
                        <span className="font-mono font-bold text-neon">{contract.isToken ? "Token" : "Contract"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Symbol</span>
                        <span className="font-mono font-bold text-neon/80">{contract.tokenSymbol ?? "—"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Verification</span>
                        <span className="font-mono font-bold text-neon/60">{contract.verified ? "Verified" : "Unverified"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={explorerAddr(contract.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl border border-border hover:border-neon hover:text-neon transition"
                        title="View contract"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <a
                        href={explorerTx(contract.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl border border-border hover:border-neon hover:text-neon transition"
                        title="View deploy transaction"
                      >
                        <Rocket className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !createdTokensData && gmgnMessage ? (
            <EmptyState
              icon={<Rocket className="w-16 h-16" />}
              title="Launch History Unavailable"
              description={gmgnMessage}
            />
          ) : tokens.length === 0 ? (
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
