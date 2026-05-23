import { cn } from "@/lib/utils";

interface Stakeholder {
  owner: string;
  sharesBps: number;
}

interface CapTableProps {
  stakeholders: Stakeholder[];
}

const COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
];

export function CapTable({ stakeholders }: CapTableProps) {
  if (!stakeholders || stakeholders.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No ownership data</p>;
  }

  const truncate = (s: string) => `${s.slice(0, 6)}...${s.slice(-4)}`;

  return (
    <div className="space-y-4">
      {/* Visual Bar */}
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-secondary/50">
        {stakeholders.map((s, i) => (
          <div
            key={s.owner}
            className={cn(COLORS[i % COLORS.length], "h-full transition-all")}
            style={{ width: `${s.sharesBps / 100}%` }}
            title={`${truncate(s.owner)}: ${s.sharesBps / 100}%`}
          />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border/50 overflow-hidden">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-secondary/30 border-b border-border/30">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Stakeholder</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">BPS</th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {stakeholders.map((s, i) => (
              <tr key={s.owner} className="hover:bg-secondary/20 transition-colors">
                <td className="px-3 py-1.5 flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", COLORS[i % COLORS.length])} />
                  <span className="font-mono">{truncate(s.owner)}</span>
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                  {s.sharesBps}
                </td>
                <td className="px-3 py-1.5 text-right font-semibold text-primary">
                  {(s.sharesBps / 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
