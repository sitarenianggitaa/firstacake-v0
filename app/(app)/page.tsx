"use client"

import Link from "next/link"
import {
  ShoppingCart,
  Boxes,
  Users,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ArrowRight,
  PackageCheck,
} from "lucide-react"
import { PageHeader, StatCard, StatusPill } from "@/components/page-parts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppStore } from "@/lib/store"
import { formatRupiah, formatDate } from "@/lib/mock-data"

const channelTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Offline: "neutral",
  WhatsApp: "success",
  Instagram: "info",
  Grab: "warning",
}

export default function DashboardPage() {
  // ===== Ambil data dari store =====
  const transactions = useAppStore((state) => state.transactions)
  const products = useAppStore((state) => state.products)
  const rawMaterials = useAppStore((state) => state.rawMaterials)
  const damageReports = useAppStore((state) => state.damageReports)
  const payrollRecords = useAppStore((state) => state.payrollRecords)
  const cashSession = useAppStore((state) => state.cashSession)

  // ===== Statistik =====
  const today = new Date().toISOString().slice(0, 10)
  const todayPaid = transactions.filter(
    (t) => t.date === today && t.status === "Paid"
  )
  const todaySales = todayPaid.reduce((sum, t) => sum + t.total, 0)
  const todayTrxCount = transactions.filter((t) => t.date === today).length

  // Tunai hari ini untuk saldo kas
  const todayCash = todayPaid
    .filter((t) => t.paymentMethod === "Tunai")
    .reduce((sum, t) => sum + t.total, 0)

  const lowStockProducts = products.filter(
    (p) => p.currentStock <= p.minStock
  )
  const lowStockMaterials = rawMaterials.filter(
    (m) => m.currentStock <= m.minStock
  )
  const openDamage = damageReports.filter((d) => d.status !== "Selesai")
  const payrollPending = payrollRecords.filter(
    (r) => r.status !== "Locked"
  ).length

  // Saldo kas = saldo awal + pemasukan tunai hari ini (estimasi)
  const cashBalance = cashSession.openingBalance + todayCash

  // Modul cards
  const moduleCards = [
    {
      title: "Point of Sale",
      href: "/pos",
      icon: ShoppingCart,
      stat: `${todayTrxCount} transaksi hari ini`,
      desc: "Kelola transaksi penjualan, channel order, dan rekap kas harian.",
    },
    {
      title: "Inventaris",
      href: "/inventory",
      icon: Boxes,
      stat: `${lowStockMaterials.length + lowStockProducts.length} item stok menipis`,
      desc: "Pantau bahan baku, produk jadi, dan mutasi stok.",
    },
    {
      title: "HR / Payroll",
      href: "/hr",
      icon: Users,
      stat: `${payrollPending} payroll perlu diproses`,
      desc: "Kelola karyawan, absensi, dan perhitungan gaji.",
    },
    {
      title: "Servis Alat",
      href: "/equipment",
      icon: Wrench,
      stat: `${openDamage.length} laporan kerusakan aktif`,
      desc: "Pantau kondisi alat, servis, dan jadwal perawatan.",
    },
  ]

  // 5 transaksi terbaru (urutkan berdasarkan id atau tanggal)
  const recentTransactions = transactions
    .sort((a, b) => {
      // Asumsikan id di-generate dengan timestamp, atau bandingkan tanggal
      if (a.date > b.date) return -1
      if (a.date < b.date) return 1
      return a.id > b.id ? -1 : 1
    })
    .slice(0, 5)

  return (
    <>
      <PageHeader
        title="Selamat datang di Firsta Cake"
        description="Ringkasan operasional toko, dapur, dan tim."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Penjualan hari ini"
          value={formatRupiah(todaySales)}
          hint={`${todayTrxCount} transaksi tercatat`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Saldo kas berjalan"
          value={formatRupiah(cashBalance)}
          hint={cashSession.isOpen ? "Sesi kas terbuka" : "Kas tertutup"}
          icon={Wallet}
        />
        <StatCard
          label="Stok menipis"
          value={lowStockProducts.length + lowStockMaterials.length}
          hint="Produk & bahan baku"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Kerusakan alat"
          value={openDamage.length}
          hint="Laporan belum selesai"
          icon={Wrench}
          tone="danger"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {moduleCards.map((m) => {
          const Icon = m.icon
          return (
            <Link key={m.href} href={m.href} className="group">
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-card/80">
                <CardContent className="flex items-start gap-4 p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {m.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground text-pretty">
                      {m.desc}
                    </p>
                    <p className="mt-2 text-sm font-medium text-primary">{m.stat}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">ID Transaksi</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead className="text-right pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="pl-6 font-medium">{t.id}</TableCell>
                      <TableCell>
                        <StatusPill
                          label={t.salesChannel}
                          tone={channelTone[t.salesChannel]}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.cashier || "-"}
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium">
                        {formatRupiah(t.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <AlertTriangle className="h-4 w-4 text-accent-foreground" />
              Perlu Perhatian
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lowStockMaterials.slice(0, 2).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-accent/40 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sisa {m.currentStock} {m.unit} (min {m.minStock})
                  </p>
                </div>
                <StatusPill label="Stok rendah" tone="warning" />
              </div>
            ))}
            {openDamage.slice(0, 2).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {d.equipmentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Lapor {formatDate(d.date)}
                  </p>
                </div>
                <StatusPill label={d.urgency} tone="danger" />
              </div>
            ))}
            {payrollPending > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-chart-2/15 p-3">
                <PackageCheck className="h-4 w-4 text-chart-1" />
                <p className="text-xs text-muted-foreground">
                  {payrollPending} payroll perlu diproses
                </p>
              </div>
            )}
            {lowStockMaterials.length === 0 &&
              openDamage.length === 0 &&
              payrollPending === 0 && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  ✅ Semua dalam kondisi baik.
                </div>
              )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}