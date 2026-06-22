import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <Button asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-base font-normal">
            No projects yet
          </CardTitle>
          <CardDescription>
            Create a project and start ingesting test runs via the API or file upload.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
