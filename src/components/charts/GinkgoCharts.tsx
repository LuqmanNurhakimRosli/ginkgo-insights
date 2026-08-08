import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { LandCoverResult, LivabilityDimension } from "@/types";

export function LivabilityRadar({ dimensions }: { dimensions: LivabilityDimension[] }) {
  const data = dimensions.map((d) => ({
    label: d.label.split(" ")[0],
    value: Math.round((d.score / d.weight) * 100),
  }));
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          />
          <Radar
            dataKey="value"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.28}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LandCoverDonut({ data }: { data: LandCoverResult }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-[168px] w-[168px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data.categories}
              dataKey="pct"
              nameKey="label"
              innerRadius="60%"
              outerRadius="94%"
              paddingAngle={2}
              stroke="none"
            >
              {data.categories.map((c) => (
                <Cell key={c.id} fill={c.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [`${v}%`, n]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--color-border)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5">
        {data.categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-[12.5px]">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: c.color }} />
            <span className="w-24">{c.label}</span>
            <span className="num font-medium">{c.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
