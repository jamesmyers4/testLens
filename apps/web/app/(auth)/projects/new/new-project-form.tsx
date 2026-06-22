"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createProject } from "./actions"

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function NewProjectForm() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(toSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Project name is required.")
      return
    }
    if (!slug.trim()) {
      setError("Slug is required.")
      return
    }

    setPending(true)
    const result = await createProject(name.trim(), slug.trim())
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>New Project</CardTitle>
        <CardDescription>
          Create a project to start tracking test runs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Project name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Test Suite"
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="slug">
              Slug
            </label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-test-suite"
              className="font-mono"
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs and API calls. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create project"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
