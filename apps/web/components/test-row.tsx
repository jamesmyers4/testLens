"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface TestData {
  id: string
  title: string
  status: string
  duration: number
  retries: number
  tags: string[]
  errorMsg: string | null
  errorStack: string | null
  suite?: { name: string }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

export function TestRow({
  test,
  showSuite = false,
  alwaysShowError = false,
}: {
  test: TestData
  showSuite?: boolean
  alwaysShowError?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const hasError = test.errorMsg != null
  const hasStack = test.errorStack != null
  const canExpand = alwaysShowError ? hasStack : hasError || hasStack

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-start gap-3 p-4">
        {canExpand ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{test.title}</p>
          {showSuite && test.suite != null && (
            <p className="font-mono text-xs text-muted-foreground">{test.suite.name}</p>
          )}
          {test.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
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

        <div className="flex shrink-0 items-center gap-3">
          {test.retries > 0 && (
            <span className="text-xs text-amber-400 tabular-nums">
              {test.retries}× {test.retries === 1 ? "retry" : "retries"}
            </span>
          )}
          <span className="text-xs text-blue-400 tabular-nums">
            {formatDuration(test.duration)}
          </span>
          <StatusBadge status={test.status as "passed" | "failed" | "flaky" | "skipped"} />
        </div>
      </div>

      {alwaysShowError && hasError && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs text-red-500">
            {test.errorMsg}
          </pre>
        </div>
      )}

      {expanded && (
        <div className="space-y-3 border-t border-border p-4">
          {!alwaysShowError && hasError && (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs text-red-500">
              {test.errorMsg}
            </pre>
          )}
          {hasStack && (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs text-muted-foreground">
              {test.errorStack}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
