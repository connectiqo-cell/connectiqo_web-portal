"use client";

import { useEffect, useState } from "react";

function splitRemaining(target: Date) {
  const diffMs = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function CountdownTimer({ target }: { target: Date }) {
  const [remaining, setRemaining] = useState(() => splitRemaining(target));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(splitRemaining(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { label: "Day", value: remaining.days },
        { label: "Hrs", value: remaining.hours },
        { label: "Mins", value: remaining.minutes },
        { label: "Secs", value: remaining.seconds },
      ].map((unit) => (
        <div key={unit.label} className="rounded-xl bg-surface-chip py-2">
          <p className="text-sm font-extrabold text-text-primary">{String(unit.value).padStart(2, "0")}</p>
          <p className="text-[10px] text-text-muted">{unit.label}</p>
        </div>
      ))}
    </div>
  );
}
