"use client"

import { useMemo, useState } from "react"
import { Plus, Minus, Trash2, Receipt, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusPill } from "@/components/page-parts"
import {
  products,
  formatRupiah,
  type Product,
  type OrderChannel,
  type PaymentMethod,
} from "@/lib/mock-data"

const channels: OrderChannel[] = ["Offline", "WhatsApp", "Instagram", "Grab"]
const categories = ["Semua", "Tart", "Mille Crepe", "Bento", "Pudding", "Brownies"] as const

interface CartLine {
  product: Product
  qty: number
}

export function PosTerminal() {
  const [cart, setCart] = useState<CartLine[]>([])
  const [category, setCategory] = useState<(typeof categories)[number]>("Semua")
  const [channel, setChannel] = useState<OrderChannel>("Offline")
  const [payment, setPayment] = useState<PaymentMethod>("Tunai")

  const visibleProducts = useMemo(
    () => (category === "Semua" ? products : products.filter((p) => p.category === category)),
    [category],
  )

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.product.sellingPrice * l.qty, 0), [cart])

  function addToCart(product: Product) {
    if (product.currentStock === 0) {
      toast.error(`Stok ${product.name} habis`, { description: "Transaksi ditolak oleh sistem." })
      return
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        if (existing.qty >= product.currentStock) {
          toast.warning("Melebihi stok tersedia", { description: `Sisa stok ${product.name}: ${product.currentStock}` })
          return prev
        }
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l))
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== id) return l
          const next = l.qty + delta
          if (next > l.product.currentStock) {
            toast.warning("Melebihi stok tersedia")
            return l
          }
          return { ...l, qty: next }
        })
        .filter((l) => l.qty > 0),
    )
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== id))
  }

  function handleCheckout() {
    if (cart.length === 0) return
    toast.success("Transaksi tersimpan", {
      description: `${formatRupiah(subtotal)} via ${channel} - ${payment}. Stok produk dipotong otomatis.`,
    })
    setCart([])
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
      {/* Product picker */}
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleProducts.map((p) => {
            const out = p.currentStock === 0
            const low = p.currentStock > 0 && p.currentStock <= p.minStock
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={out}
                className={cn(
                  "flex flex-col rounded-xl border border-border bg-card p-3 text-left transition-colors",
                  out ? "cursor-not-allowed opacity-55" : "hover:border-primary/50 hover:bg-card/70",
                )}
              >
                <span className="text-xs text-muted-foreground">{p.category}</span>
                <span className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground text-pretty">
                  {p.name}
                </span>
                <span className="mt-2 font-heading text-base font-bold text-primary">
                  {formatRupiah(p.sellingPrice)}
                </span>
                <span className="mt-1 text-xs">
                  {out ? (
                    <StatusPill label="Stok habis" tone="danger" />
                  ) : low ? (
                    <StatusPill label={`Sisa ${p.currentStock}`} tone="warning" />
                  ) : (
                    <span className="text-muted-foreground">Stok {p.currentStock}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cart */}
      <Card className="lg:sticky lg:top-6 h-fit">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Transaksi Baru</h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-8 text-muted-foreground">
                <X className="mr-1 h-4 w-4" /> Kosongkan
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {cart.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">Pilih produk untuk memulai transaksi</p>
              </div>
            )}
            {cart.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2 rounded-lg bg-muted/60 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{l.product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatRupiah(l.product.sellingPrice)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(l.product.id, -1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{l.qty}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(l.product.id, 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeLine(l.product.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Channel order</p>
            <div className="grid grid-cols-2 gap-1.5">
              {channels.map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    channel === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Metode pembayaran</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Tunai", "Transfer"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayment(m)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    payment === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-xl font-bold text-foreground">{formatRupiah(subtotal)}</span>
            </div>
            <Button className="mt-3 w-full" size="lg" disabled={cart.length === 0} onClick={handleCheckout}>
              <Receipt className="mr-2 h-4 w-4" /> Proses & Cetak Struk
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
