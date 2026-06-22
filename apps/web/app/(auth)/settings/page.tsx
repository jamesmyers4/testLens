import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyManager } from "./key-manager"

export default async function SettingsPage() {
  const { userId } = await auth()

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null

  const keys = dbUser
    ? await prisma.apiKey.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsedAt: true,
        },
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your API keys for CI pipeline integration.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate POST /api/runs from your CI pipeline.
            Keys are hashed before storage and shown only once on creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeyManager keys={keys} />
        </CardContent>
      </Card>
    </div>
  )
}
