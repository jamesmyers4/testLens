import { cn } from "@/lib/utils"

type Status = "passed" | "failed" | "flaky" | "skipped"

const statusConfig: Record<Status, { label: string; className: string }> = {
  passed: { label: "passed", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  failed: { label: "failed", className: "text-red-500 bg-red-500/10 border-red-500/20" },
  flaky: { label: "flaky", className: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  skipped: { label: "skipped", className: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
