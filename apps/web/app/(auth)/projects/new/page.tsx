import { NewProjectForm } from "./new-project-form"

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Project</h1>
        <p className="mt-1 text-muted-foreground">
          Projects group related test runs together under a single slug.
        </p>
      </div>
      <NewProjectForm />
    </div>
  )
}
