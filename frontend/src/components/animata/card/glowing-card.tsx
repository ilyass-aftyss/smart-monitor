import type React from "react";
import { cn } from "../../../lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
}

export default function GlowingCard({
  fromColor = "#4158D0",
  viaColor = "#C850C0",
  toColor = "#FFCC70",
  className,
  children,
  ...props
}: GlowCardProps) {
  const gradient = `linear-gradient(to right, ${fromColor}, ${viaColor}, ${toColor})`;

  return (
    <div
      className={cn(
        "rounded-3xl p-0.5 transition-[box-shadow,filter] duration-500 ease-in-out hover:shadow-glow hover:brightness-150",
        className,
      )}
      style={{ backgroundImage: gradient }}
      {...props}
    >
      <div className="relative overflow-hidden rounded-[calc(1.5rem-2px)]">
        <div
          aria-hidden
          className="blur-20 pointer-events-none absolute inset-0 rounded-[calc(1.5rem-2px)] transition-[filter] duration-500 ease-in-out"
          style={{ backgroundImage: gradient }}
        />
        <div className="relative flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
