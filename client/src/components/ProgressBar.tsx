import React from "react";

interface Props {
  percent: number;
}

const ProgressBar: React.FC<Props> = ({ percent }) => (
  <div className="sticky top-[72px] z-40 mb-4 rounded-lg border border-border/70 bg-card/95 p-2 shadow-sm">
    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
      <span>התקדמות מילוי טופס</span>
      <span>{percent}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

export default ProgressBar;
