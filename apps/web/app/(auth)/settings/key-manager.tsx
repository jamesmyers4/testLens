"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createApiKey, revokeApiKey } from "./actions"

type ApiKey = {
  id: string
  name: string
  createdAt: Date
  lastUsedAt: Date | null
}

type Props = {
  keys: ApiKey[]
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function KeyManager({ keys }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreateClose() {
    setCreateOpen(false)
    setKeyName("")
    setCreatedKey(null)
    setCopied(false)
  }

  function handleCreate() {
    if (!keyName.trim()) return
    startTransition(async () => {
      const { rawKey } = await createApiKey(keyName.trim())
      setCreatedKey(rawKey)
    })
  }

  function handleCopy() {
    if (!createdKey) return
    navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleRevoke() {
    if (!revokeTarget) return
    startTransition(async () => {
      await revokeApiKey(revokeTarget.id)
      setRevokeTarget(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            if (!open) handleCreateClose()
            else setCreateOpen(true)
          }}
        >
          <DialogTrigger asChild>
            <Button>Create Key</Button>
          </DialogTrigger>
          <DialogContent>
            {createdKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Key Created</DialogTitle>
                  <DialogDescription>
                    Copy this key now. It will not be shown again.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                  <Input
                    value={createdKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={handleCopy}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm text-destructive font-medium">
                  Store this key somewhere safe — you won&apos;t be able to view it again.
                </p>
                <DialogFooter>
                  <Button onClick={handleCreateClose}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Give this key a name to identify it later.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="Key name (e.g. GitHub Actions)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                  }}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={handleCreateClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!keyName.trim() || isPending}
                  >
                    {isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No API keys yet.</p>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Last Used
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {key.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(key.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRevokeTarget(key)}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{revokeTarget?.name}&rdquo;. Any CI
              pipelines using it will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isPending}
            >
              {isPending ? "Revoking..." : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
