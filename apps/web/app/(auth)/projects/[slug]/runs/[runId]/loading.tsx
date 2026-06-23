import { Skeleton } from "@/components/ui/skeleton"

export default function RunSummaryLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-8 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 text-center">
            <Skeleton className="mx-auto h-9 w-16" />
            <Skeleton className="mx-auto mt-1 h-3 w-12" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-none" />
        ))}
      </div>
    </div>
  )
}
