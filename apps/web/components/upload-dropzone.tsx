"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { validateRunPayload } from "@/lib/schema-validator"

type State =
  | { stage: "idle" | "dragover" | "validating" | "uploading" }
  | { stage: "error"; message: string }

export function UploadDropzone() {
  const router = useRouter()
  const [state, setState] = useState<State>({ stage: "idle" })

  async function processFile(file: File) {
    if (!file.name.endsWith(".json")) {
      setState({ stage: "error", message: "Only .json files are accepted." })
      return
    }

    setState({ stage: "validating" })

    let raw: string
    try {
      raw = await file.text()
    } catch {
      setState({ stage: "error", message: "Failed to read file." })
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      setState({ stage: "error", message: "File is not valid JSON." })
      return
    }

    try {
      validateRunPayload(parsed)
    } catch {
      setState({
        stage: "error",
        message:
          "File does not match the testLens schema. Use testlens-convert to generate a valid file.",
      })
      return
    }

    setState({ stage: "uploading" })

    let res: Response
    try {
      res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      })
    } catch {
      setState({ stage: "error", message: "Network error. Please try again." })
      return
    }

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setState({
        stage: "error",
        message: data.error ?? `Upload failed (${res.status})`,
      })
      return
    }

    const { url } = (await res.json()) as { runId: string; url: string }
    router.push(url)
  }

  const isLoading = state.stage === "validating" || state.stage === "uploading"

  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors",
        state.stage === "dragover" && "border-primary bg-primary/5",
        state.stage === "error" && "border-red-500/50 bg-red-500/5",
        state.stage !== "dragover" && state.stage !== "error" && "border-border"
      )}
      onDragOver={(e) => {
        e.preventDefault()
        if (!isLoading) setState({ stage: "dragover" })
      }}
      onDragLeave={() => {
        if (!isLoading) setState({ stage: "idle" })
      }}
      onDrop={(e) => {
        e.preventDefault()
        if (isLoading) return
        const file = e.dataTransfer.files[0]
        if (file) {
          void processFile(file)
        } else {
          setState({ stage: "idle" })
        }
      }}
    >
      {state.stage === "error" ? (
        <>
          <p className="max-w-sm text-center text-sm font-medium text-red-500">
            {state.message}
          </p>
          <Button variant="outline" size="sm" onClick={() => setState({ stage: "idle" })}>
            Try again
          </Button>
        </>
      ) : state.stage === "validating" || state.stage === "uploading" ? (
        <p className="text-sm text-muted-foreground">
          {state.stage === "validating" ? "Validating…" : "Uploading…"}
        </p>
      ) : (
        <>
          <div className="text-center">
            <p className="font-medium text-foreground">Drop testlens-run.json here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
          </div>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>Browse file</span>
            </Button>
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void processFile(file)
              }}
            />
          </label>
        </>
      )}
    </div>
  )
}
