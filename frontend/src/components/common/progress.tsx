import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export default function Progress({ progress }: { progress: number }) {
  const [width, setWidth] = useState(0);
  const barWidth = 2;
  const gap = 2;
  const bars = Math.floor(width / (barWidth + gap));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWidth(containerRef.current?.offsetWidth ?? 0);
  }, []);

  const [shouldUseValue, setShouldUseValue] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShouldUseValue(true), 250);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div ref={containerRef} className="relative flex h-[12px] w-full min-w-4 flex-wrap gap-[2px] overflow-hidden">
      {Array.from(Array(bars)).map((_, index) => {
        const highlight = shouldUseValue ? index / bars < progress / 100 : 0;
        return (
          <div
            className={cn("h-full w-[2px] rounded-[1px] transition-all", {
              "bg-blue-400 duration-75": highlight,
              "bg-white/10 duration-300": !highlight,
            })}
            style={{ transitionDelay: highlight ? `${index * 6}ms` : "0ms" }}
            key={`bar_${index}`}
          />
        );
      })}
    </div>
  );
}
