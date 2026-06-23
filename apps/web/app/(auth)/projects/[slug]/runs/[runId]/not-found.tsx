import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RunNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-semibold text-foreground">Run not found</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This run doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/">Back to projects</Link>
      </Button>
    </div>
  )
}
