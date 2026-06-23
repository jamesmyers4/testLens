import { Skeleton } from "@/components/ui/skeleton"

export default function SuitesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-40" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
