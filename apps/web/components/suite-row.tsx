"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface TestInSuite {
  id: string
  title: string
  status: string
  duration: number
  retries: number
  tags: string[]
}

interface SuiteData {
  id: string
  name: string
  file: string | null
  duration: number
  passed: number
  failed: number
  flaky: number
  skipped: number
  tests: TestInSuite[]
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function CountPill({ count, className }: { count: number; className: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${className}`}>
      {count}
    </span>
  )
}

export function SuiteRow({ suite }: { suite: SuiteData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{suite.name}</p>
          {suite.file != null && (
            <p className="truncate font-mono text-xs text-muted-foreground">{suite.file}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {suite.passed > 0 && (
            <CountPill count={suite.passed} className="bg-emerald-500/10 text-emerald-500" />
          )}
          {suite.failed > 0 && (
            <CountPill count={suite.failed} className="bg-red-500/10 text-red-500" />
          )}
          {suite.flaky > 0 && (
            <CountPill count={suite.flaky} className="bg-amber-400/10 text-amber-400" />
          )}
          {suite.skipped > 0 && (
            <CountPill count={suite.skipped} className="bg-slate-400/10 text-slate-400" />
          )}
          <span className="text-xs text-blue-400 tabular-nums">{formatDuration(suite.duration)}</span>
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-border border-t border-border">
          {suite.tests.map((test) => (
            <div key={test.id} className="flex items-start gap-3 py-3 pl-11 pr-4">
              <StatusBadge status={test.status as "passed" | "failed" | "flaky" | "skipped"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{test.title}</p>
                {test.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {test.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {test.retries > 0 && (
                <span className="shrink-0 text-xs text-amber-400">
                  {test.retries}× retry
                </span>
              )}
              <span className="shrink-0 text-xs text-blue-400 tabular-nums">
                {formatDuration(test.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
