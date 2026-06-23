import { Skeleton } from "@/components/ui/skeleton"

export default function TestsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-28" />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
