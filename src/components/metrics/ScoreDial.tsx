interface ScoreDialProps {
  score: number;
  maxScore?: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function ScoreDial({
  score,
  maxScore = 100,
  label,
  sublabel,
  size = 180,
  strokeWidth = 2,
}: ScoreDialProps) {
  const radius = (size - strokeWidth * 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / maxScore, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  let colorClass = "#22C55E";
  if (score < 50) colorClass = "#EF4444";
  else if (score < 70) colorClass = "#EAB308";
  else if (score < 85) colorClass = "#5EEAD4";

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transform">
          {/* Track ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorClass}
            strokeWidth={strokeWidth + 1}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 800ms ease" }}
          />
        </svg>

        {/* Center tabular number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[36px] font-bold num tracking-tighter text-[#F5F5F4]">
            {score}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#9CA3AF]">
            / {maxScore} PTS
          </span>
        </div>
      </div>

      <div className="mt-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F4]">
          {label}
        </span>
        {sublabel && (
          <p className="font-mono text-[10px] uppercase text-[#9CA3AF]">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
