"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Cake } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems } from "@/components/nav-config"
import { Button } from "@/components/ui/button"

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span>{item.title}</span>
              <span
                className={cn(
                  "text-xs font-normal",
                  active ? "text-sidebar-primary-foreground/80" : "text-sidebar-foreground/55",
                )}
              >
                {item.description}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-1">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Cake className="h-5 w-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-base font-bold text-sidebar-foreground">Firsta Cake</span>
        <span className="text-xs text-sidebar-foreground/60">Sistem Operasional</span>
      </span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="pt-2">
          <Brand />
        </div>
        <NavLinks />
       
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 bg-sidebar p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Buka menu</span>
          </Button>
          <Brand />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
