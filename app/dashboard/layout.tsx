import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardNav } from "@/components/dashboard-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("[v0] DashboardLayout rendering")

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </AuthGuard>
  )
}
