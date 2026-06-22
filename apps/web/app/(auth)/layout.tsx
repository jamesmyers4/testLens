import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold text-foreground hover:text-muted-foreground transition-colors"
          >
            testLens
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
