import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export default function Card({ children, className, glow, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "glass-card p-6 relative overflow-hidden group transition-all duration-300 hover:border-primary/20",
        glow && "shadow-neon border-primary/20",
        className
      )} 
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-card opacity-50 pointer-events-none" />
      {children}
    </div>
  );
}
