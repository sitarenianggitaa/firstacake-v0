"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StatusPill } from "@/components/page-parts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { transactions, formatRupiah } from "@/lib/mock-data"

const channelTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Offline: "neutral",
  WhatsApp: "success",
  Instagram: "info",
  Grab: "warning",
}
const statusTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Paid: "success",
  Pending: "warning",
  Void: "danger",
}

export function TransactionHistory() {
  const [query, setQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("Semua")

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return transactions.filter((t) => {
      const matchQuery =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.items.some((i) => i.productName.toLowerCase().includes(q))
      const matchChannel = channelFilter === "Semua" || t.channel === channelFilter
      return matchQuery && matchChannel
    })
  }, [query, channelFilter])

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari ID transaksi atau produk..."
              className="pl-9"
            />
          </div>
          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v ?? "Semua")}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {["Semua", "Offline", "WhatsApp", "Instagram", "Grab"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaksi</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Bayar</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {t.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                  </TableCell>
                  <TableCell>
                    <StatusPill label={t.channel} tone={channelTone[t.channel]} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.paymentMethod}</TableCell>
                  <TableCell className="text-muted-foreground">{t.cashier}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(t.subtotal)}</TableCell>
                  <TableCell>
                    <StatusPill label={t.status} tone={statusTone[t.status]} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Tidak ada transaksi yang cocok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
