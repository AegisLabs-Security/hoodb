import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      {icon && (
        <div className="mb-6 text-neon opacity-80">
          {icon}
        </div>
      )}
      <h3 className="font-display text-2xl font-bold mb-3">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-md">
          {description}
        </p>
      )}
      <div className="mt-8 grid-bg opacity-30 w-full h-32 rounded-2xl border border-border/30" />
    </motion.div>
  );
}
