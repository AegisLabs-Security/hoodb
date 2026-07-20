import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  valueClassName?: string;
  suffixClassName?: string;
  stacked?: boolean;
}

export function AnimatedCounter({
  end,
  duration = 1.5,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  valueClassName,
  suffixClassName,
  stacked = false,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + (end - startValue) * easeOutCubic;
      setCount(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "inline-flex items-end gap-2",
        stacked && "flex-col items-start gap-1",
        className
      )}
    >
      <span className={cn("block", valueClassName)}>
        {prefix}
        {count.toLocaleString(undefined, {
          maximumFractionDigits: decimals,
          minimumFractionDigits: decimals,
        })}
      </span>
      {suffix ? (
        <span className={cn("block", suffixClassName)}>
          {suffix}
        </span>
      ) : null}
    </motion.span>
  );
}
