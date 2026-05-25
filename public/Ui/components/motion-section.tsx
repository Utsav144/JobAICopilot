"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export function MotionSection({
  children,
  className,
  ...props
}: HTMLMotionProps<"section"> & { children: React.ReactNode }) {
  return (
    <motion.section
      className={className}
      {...props}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.section>
  );
}
