"use client"

import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Wallet,
  Clock,
  LockOpen,
  Lock,
  TrendingUp,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  XCircle,
  FileDown,
  Sparkles,
} from "lucide-react"
import { PageHeader, StatCard } from "@/components/page-parts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppStore } from "@/lib/store"
import { formatRupiah } from "@/lib/mock-data"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// --- Tipe untuk item keranjang ---
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  isCustom?: boolean
  note?: string
}

export default function PosPage() {
  // ===== Ambil data & fungsi dari store =====
  const products = useAppStore((state) => state.products)
  const employees = useAppStore((state) => state.employees)
  const transactions = useAppStore((state) => state.transactions)
  const cashSession = useAppStore((state) => state.cashSession)
  const addTransaction = useAppStore((state) => state.addTransaction)
  const openCashSession = useAppStore((state) => state.openCashSession)
  const closeCashSession = useAppStore((state) => state.closeCashSession)
  const deleteTransaction = useAppStore((state) => state.deleteTransaction)

  // ===== State transaksi =====
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [paymentMethod, setPaymentMethod] = useState<"Tunai" | "Transfer">("Tunai")
  const [salesChannel, setSalesChannel] = useState<"Offline" | "WhatsApp" | "Instagram" | "Grab">("Offline")
  const [customerName, setCustomerName] = useState("")
  const [cashReceived, setCashReceived] = useState<number>(0)

  // ===== State modal =====
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showOpenCashModal, setShowOpenCashModal] = useState(false)
  const [showCloseCashModal, setShowCloseCashModal] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false) // NEW

  // ===== State custom order =====
  const [customName, setCustomName] = useState("")
  const [customPrice, setCustomPrice] = useState(0)
  const [customNote, setCustomNote] = useState("")

  // ===== Data transaksi terakhir untuk struk =====
  const [lastTransaction, setLastTransaction] = useState<any>(null)

  // ===== State lokal untuk modal buka kas =====
  const [localBalance, setLocalBalance] = useState<string>("0")
  const [localShift, setLocalShift] = useState<"Pagi" | "Sore">("Pagi")
  const [localCashierId, setLocalCashierId] = useState<string>("")

  // ===== Reset state lokal saat modal dibuka =====
  useEffect(() => {
    if (showOpenCashModal) {
      setLocalBalance(String(cashSession.openingBalance || 0))
      setLocalShift(cashSession.shift || "Pagi")
      setLocalCashierId(cashSession.cashierId || "")
    }
  }, [showOpenCashModal, cashSession])

  // ===== Fungsi keranjang =====
  const addToCart = () => {
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return
    const existing = cart.find((item) => item.id === product.id && !item.isCustom)
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id && !item.isCustom
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, quantity, isCustom: false }])
    }
    setSelectedProductId("")
    setQuantity(1)
  }

  // ===== Tambah custom item =====
  const addCustomItem = () => {
    if (!customName.trim() || customPrice <= 0) {
      alert("Nama dan harga harus diisi!")
      return
    }
    const newId = `custom-${Date.now()}`
    setCart([...cart, {
      id: newId,
      name: customName.trim(),
      price: customPrice,
      quantity: 1,
      isCustom: true,
      note: customNote.trim() || undefined,
    }])
    setCustomName("")
    setCustomPrice(0)
    setCustomNote("")
    setShowCustomModal(false)
  }

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(id)
      return
    }
    setCart(cart.map((item) =>
      item.id === id ? { ...item, quantity: newQty } : item
    ))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax
  const change = cashReceived - total

  // ===== Proses pembayaran =====
  const handlePayment = () => {
    if (cart.length === 0) {
      alert("Keranjang kosong!")
      return
    }
    if (!cashSession.isOpen) {
      alert("Sesi kas belum dibuka! Buka kas terlebih dahulu.")
      return
    }
    if (paymentMethod === "Tunai" && cashReceived < total) {
      alert("Uang yang diterima kurang dari total!")
      return
    }

    const transactionData = {
      date: new Date().toISOString().slice(0, 10),
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name + (item.isCustom ? " (Custom)" : ""),
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      tax,
      total,
      paymentMethod,
      salesChannel,
      customerName: customerName || "Umum",
      cashier: cashSession.cashierId
        ? employees.find(e => e.id === cashSession.cashierId)?.fullName || "Unknown"
        : "Unknown",
      shift: cashSession.shift || "Pagi",
      status: "Paid" as const,
    }

    addTransaction(transactionData)

    setLastTransaction({
      ...transactionData,
      id: `TRX-${Date.now()}`,
      change: paymentMethod === "Tunai" ? change : 0,
      items: cart, // simpan asli untuk struk
    })
    setShowReceiptModal(true)
  }

  const clearCart = () => {
    setCart([])
    setCashReceived(0)
    setCustomerName("")
  }

  // ===== Handler buka kas =====
  const handleOpenCash = () => {
    if (!localCashierId) {
      alert("Pilih karyawan terlebih dahulu!")
      return
    }
    const balance = parseInt(localBalance) || 0
    if (balance < 0) {
      alert("Saldo awal tidak valid!")
      return
    }
    openCashSession(localShift, localCashierId, balance)
    setShowOpenCashModal(false)
    alert(`Sesi kas dibuka untuk shift ${localShift} oleh ${employees.find(e => e.id === localCashierId)?.fullName}`)
  }

  // ===== Handler tutup kas =====
  const handleCloseCash = () => {
    closeCashSession()
    setShowCloseCashModal(false)
    alert("Kas ditutup. Rekap harian telah dibuat.")
  }

  // ===== Statistik hari ini =====
  const today = new Date().toISOString().slice(0, 10)
  const todayPaid = transactions.filter((t) => t.date === today && t.status === "Paid")
  const todaySales = todayPaid.reduce((s, t) => s + t.total, 0)
  const cashSales = todayPaid.filter((t) => t.paymentMethod === "Tunai").reduce((s, t) => s + t.total, 0)

  // ===== Info kasir =====
  const getCashierName = () => {
    if (!cashSession.cashierId) return "-"
    return employees.find(e => e.id === cashSession.cashierId)?.fullName || "-"
  }

  // ===== Ekspor PDF Laporan Penjualan Harian =====
  const exportSalesReport = () => {
    if (todayPaid.length === 0) {
      alert("Belum ada transaksi hari ini untuk diekspor.")
      return
    }
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(18)
    doc.text("Laporan Penjualan Harian", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - Point of Sale", pageWidth / 2, 28, { align: "center" })

    const summaryY = 35
    doc.setFontSize(11)
    doc.text(`Total Penjualan: ${formatRupiah(todaySales)}`, 14, summaryY)
    doc.text(`Total Tunai: ${formatRupiah(cashSales)}`, 14, summaryY + 6)
    doc.text(`Total Transfer: ${formatRupiah(todaySales - cashSales)}`, 14, summaryY + 12)
    doc.text(`Jumlah Transaksi: ${todayPaid.length}`, 14, summaryY + 18)

    const columns = ["ID", "Pelanggan", "Metode", "Channel", "Total"]
    const rows = todayPaid.map((t) => [
      t.id,
      t.customerName || "Umum",
      t.paymentMethod,
      t.salesChannel,
      formatRupiah(t.total),
    ])

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: summaryY + 24,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [58, 36, 26], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })

    doc.save(`laporan-penjualan-${today}.pdf`)
  }

  // ============================================================
  // MODAL STRUK
  // ============================================================
  const ReceiptModal = () => (
    <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🧾 Struk Transaksi</DialogTitle>
        </DialogHeader>
        {lastTransaction && (
          <div className="space-y-3 text-sm">
            <div className="border-b pb-2">
              <p><strong>No. Transaksi:</strong> {lastTransaction.id}</p>
              <p><strong>Tanggal:</strong> {lastTransaction.date}</p>
              <p><strong>Kasir:</strong> {lastTransaction.cashier}</p>
              <p><strong>Shift:</strong> {lastTransaction.shift}</p>
              <p><strong>Channel:</strong> {lastTransaction.salesChannel}</p>
              <p><strong>Pelanggan:</strong> {lastTransaction.customerName}</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastTransaction.items.map((item: CartItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.name}
                      {item.isCustom && <span className="ml-1 text-xs text-primary">(Custom)</span>}
                      {item.note && <span className="ml-1 text-xs text-muted-foreground">- {item.note}</span>}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.price * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(lastTransaction.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>PPN 10%</span>
                <span>{formatRupiah(lastTransaction.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatRupiah(lastTransaction.total)}</span>
              </div>
              {lastTransaction.paymentMethod === "Tunai" && (
                <>
                  <div className="flex justify-between">
                    <span>Bayar Tunai</span>
                    <span>{formatRupiah(lastTransaction.total + lastTransaction.change)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Kembalian</span>
                    <span>{formatRupiah(lastTransaction.change)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Metode</span>
                <span>{lastTransaction.paymentMethod}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => {
                setShowReceiptModal(false)
                clearCart()
              }}>
                Tutup
              </Button>
              <Button onClick={() => { alert("Struk sedang dicetak...") }}>
                <Printer className="mr-2 h-4 w-4" /> Cetak
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  // ============================================================
// MODAL CUSTOM ORDER - STABIL (mirip buka kas)
// ============================================================
const CustomOrderModal = () => {
  // State lokal untuk form custom order (tidak memicu re-render global)
  const [localName, setLocalName] = useState("")
  const [localPrice, setLocalPrice] = useState<string>("")
  const [localNote, setLocalNote] = useState("")

  // Reset lokal saat modal dibuka
  useEffect(() => {
    if (showCustomModal) {
      setLocalName(customName || "")
      setLocalPrice(String(customPrice || 0))
      setLocalNote(customNote || "")
    }
  }, [showCustomModal])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "")
    setLocalPrice(raw)
  }

  const handleAddCustom = () => {
    const name = localName.trim()
    const price = parseInt(localPrice) || 0
    if (!name || price <= 0) {
      alert("Nama dan harga harus diisi!")
      return
    }
    const newId = `custom-${Date.now()}`
    setCart([...cart, {
      id: newId,
      name: name,
      price: price,
      quantity: 1,
      isCustom: true,
      note: localNote.trim() || undefined,
    }])
    setCustomName("")
    setCustomPrice(0)
    setCustomNote("")
    setShowCustomModal(false)
  }

  return (
    <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
      <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Tambah Custom Order
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="customName">Nama Item</Label>
            <Input
              id="customName"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Kue Ulang Tahun Custom, dll."
              autoFocus={false}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customPrice">Harga (Rp)</Label>
            <Input
              id="customPrice"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localPrice}
              onChange={handlePriceChange}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
              onWheel={(e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (['e', 'E', '-', '+', '.', ','].includes(e.key)) e.preventDefault()
              }}
              placeholder="0"
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customNote">Catatan (opsional)</Label>
            <Input
              id="customNote"
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              placeholder="Misal: tulisan selamat, desain khusus, dll."
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowCustomModal(false)}>Batal</Button>
          <Button onClick={handleAddCustom}>
            <Plus className="mr-2 h-4 w-4" /> Tambahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

  // ============================================================
  // MODAL BUKA KAS - (tidak diubah)
  // ============================================================
  const OpenCashModal = () => {
    const [localShift, setLocalShift] = useState<"Pagi" | "Sore">("Pagi")
    const [localCashierId, setLocalCashierId] = useState<string>("")
    const [localBalance, setLocalBalance] = useState<string>("0")

    useEffect(() => {
      if (showOpenCashModal) {
        setLocalShift(cashSession.shift || "Pagi")
        setLocalCashierId(cashSession.cashierId || "")
        setLocalBalance(String(cashSession.openingBalance || 0))
      }
    }, [showOpenCashModal, cashSession.shift, cashSession.cashierId, cashSession.openingBalance])

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, "")
      setLocalBalance(raw)
    }

    const handleSubmitOpen = (e: React.FormEvent) => {
      e.preventDefault()
      if (!localCashierId) {
        alert("Pilih karyawan terlebih dahulu!")
        return
      }
      const balance = parseInt(localBalance) || 0
      if (balance < 0) {
        alert("Saldo awal tidak valid!")
        return
      }
      openCashSession(localShift, localCashierId, balance)
      setShowOpenCashModal(false)
      alert(`Sesi kas dibuka untuk shift ${localShift} oleh ${employees.find(e => e.id === localCashierId)?.fullName}`)
    }

    return (
      <Dialog open={showOpenCashModal} onOpenChange={setShowOpenCashModal}>
        <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockOpen className="h-5 w-5 text-green-600" /> Buka Sesi Kas
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOpen} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shift-select">Shift</Label>
              <Select
                value={localShift}
                onValueChange={(val) => setLocalShift((val ?? "Pagi") as "Pagi" | "Sore")}
              >
                <SelectTrigger id="shift-select" className="w-full">
                  <SelectValue placeholder="Pilih shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pagi">Pagi (06:00 - 14:00)</SelectItem>
                  <SelectItem value="Sore">Sore (14:00 - 22:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier-select">Kasir Bertugas</Label>
              <Select
                value={localCashierId}
                onValueChange={(val) => setLocalCashierId(val ?? "")}
              >
                <SelectTrigger id="cashier-select" className="w-full">
                  <SelectValue placeholder="Pilih kasir..." />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(e => e.position?.toLowerCase().includes('kasir') || e.department === 'Kasir')
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} - {emp.position}
                      </SelectItem>
                    ))}
                  {employees
                    .filter(e => !e.position?.toLowerCase().includes('kasir') && e.department !== 'Kasir')
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} - {emp.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance-input">Saldo Awal (Rp)</Label>
              <Input
                id="balance-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localBalance}
                onChange={handleBalanceChange}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                onWheel={(e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (['e', 'E', '-', '+', '.', ','].includes(e.key)) e.preventDefault()
                }}
                placeholder="Masukkan saldo awal..."
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <p className="text-xs text-muted-foreground">Hanya angka, tanpa titik atau koma</p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowOpenCashModal(false)}>Batal</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <LockOpen className="mr-2 h-4 w-4" /> Buka Kas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // ============================================================
  // MODAL TUTUP KAS
  // ============================================================
  const CloseCashModal = () => {
    const todayTotal = todayPaid.reduce((s, t) => s + t.total, 0)
    const cashTotal = todayPaid.filter((t) => t.paymentMethod === "Tunai").reduce((s, t) => s + t.total, 0)
    const transferTotal = todayTotal - cashTotal

    return (
      <Dialog open={showCloseCashModal} onOpenChange={setShowCloseCashModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" /> Tutup Sesi Kas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Rekap Penjualan Hari Ini</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shift</span>
                  <span className="font-medium">{cashSession.shift || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kasir</span>
                  <span className="font-medium">{getCashierName()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Total Penjualan</span>
                  <span className="font-bold">{formatRupiah(todayTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tunai</span>
                  <span>{formatRupiah(cashTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transfer</span>
                  <span>{formatRupiah(transferTotal)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg">
                  <span className="font-medium">Saldo Akhir (estimasi)</span>
                  <span className="font-bold text-green-600">{formatRupiah(cashSession.openingBalance + cashTotal)}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              ⚠️ Tutup kas akan mengunci sesi dan membuat rekap harian. Pastikan semua transaksi sudah selesai.
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCloseCashModal(false)}>Batal</Button>
              <Button variant="destructive" onClick={handleCloseCash}>
                <Lock className="mr-2 h-4 w-4" /> Tutup Kas
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <PageHeader
        title="Point of Sale"
        description="Catat transaksi penjualan, kelola channel order, dan rekap kas harian."
        icon={ShoppingCart}
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Penjualan hari ini"
          value={formatRupiah(todaySales)}
          hint={`${todayPaid.length} transaksi`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Penjualan tunai"
          value={formatRupiah(cashSales)}
          hint="Masuk laci kas"
          icon={Wallet}
        />
        <StatCard
          label="Sesi kas"
          value={cashSession.isOpen ? "🔓 Terbuka" : "🔒 Tertutup"}
          hint={cashSession.isOpen ? getCashierName() : "Buka kas untuk mulai"}
          icon={cashSession.isOpen ? LockOpen : Lock}
          tone={cashSession.isOpen ? "warning" : "default"}
        />
        <StatCard
          label="Saldo awal"
          value={formatRupiah(cashSession.openingBalance)}
          hint={cashSession.isOpen ? `Dibuka ${cashSession.openedAt || "-"}` : "Belum dibuka"}
          icon={Clock}
        />
      </section>

      <Tabs defaultValue="kasir">
        <TabsList>
          <TabsTrigger value="kasir">Kasir</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          <TabsTrigger value="kas">Sesi Kas</TabsTrigger>
        </TabsList>

        {/* Tab Kasir */}
        <TabsContent value="kasir" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <ShoppingCart className="h-4 w-4 text-primary" /> Pilih Produk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-3 mb-4">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs">Cari Produk</Label>
                    <Select
                      value={selectedProductId}
                      onValueChange={(val) => setSelectedProductId(val ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - {formatRupiah(p.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <Button onClick={addToCart} className="h-10">
                    <Plus className="mr-1 h-4 w-4" /> Tambah
                  </Button>
                  {/* Tombol Custom Order */}
                  <Button variant="outline" className="h-10" onClick={() => setShowCustomModal(true)}>
                    <Sparkles className="mr-1 h-4 w-4" /> Custom
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                  {products.slice(0, 12).map((p) => (
                    <Button
                      key={p.id}
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-3 text-center hover:bg-primary/10 hover:border-primary transition-all"
                      onClick={() => {
                        setSelectedProductId(p.id)
                        addToCart()
                      }}
                    >
                      <span className="text-sm font-semibold leading-tight">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{formatRupiah(p.price)}</span>
                    </Button>
                  ))}
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-base">🛒 Keranjang</h3>
                    {cart.length > 0 && (
                      <span className="text-xs text-muted-foreground">{cart.length} item</span>
                    )}
                  </div>
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      Belum ada item. Pilih produk di atas.
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-medium text-sm truncate">
                              {item.name}
                              {item.isCustom && <span className="ml-1 text-xs text-primary">(Custom)</span>}
                              {item.note && <span className="ml-1 text-xs text-muted-foreground">- {item.note}</span>}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-medium">{formatRupiah(item.price * item.quantity)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">💳 Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 bg-muted/40 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PPN 10%</span>
                    <span>{formatRupiah(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Channel Order</Label>
                  <Select
                    value={salesChannel}
                    onValueChange={(val) => setSalesChannel((val ?? "Offline") as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Offline">Offline</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Grab">Grab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Metode Pembayaran</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) => setPaymentMethod((val ?? "Tunai") as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tunai">Tunai</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === "Tunai" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Uang Diterima</Label>
                    <Input
                      type="number"
                      min="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                      placeholder="0"
                    />
                    {cashReceived > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kembalian</span>
                        <span className={change >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                          {formatRupiah(change)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Nama Pelanggan</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Umum"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePayment}
                    disabled={cart.length === 0}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" /> Bayar Sekarang
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={clearCart}>
                    <XCircle className="mr-2 h-4 w-4" /> Kosongkan Keranjang
                  </Button>
                  {!cashSession.isOpen && (
                    <p className="text-center text-xs text-destructive mt-1">
                      ⚠️ Sesi kas belum dibuka. Buka di tab "Sesi Kas".
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Riwayat */}
        <TabsContent value="riwayat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Riwayat Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{t.customerName || "Umum"}</TableCell>
                        <TableCell className="font-medium">{formatRupiah(t.total)}</TableCell>
                        <TableCell>{t.paymentMethod}</TableCell>
                        <TableCell>{t.cashier || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            t.status === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            t.status === "Pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {t.status === "Paid" ? "Lunas" : t.status === "Pending" ? "Pending" : "Batal"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Yakin hapus transaksi ${t.id}?`)) {
                                deleteTransaction(t.id)
                              }
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sesi Kas */}
        <TabsContent value="kas" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  {cashSession.isOpen ? (
                    <LockOpen className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-red-600" />
                  )}
                  Status Sesi Kas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`text-lg font-bold ${cashSession.isOpen ? "text-green-600" : "text-red-600"}`}>
                      {cashSession.isOpen ? "🔓 Terbuka" : "🔒 Tertutup"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Shift</p>
                    <p className="font-medium">{cashSession.isOpen ? cashSession.shift : "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Kasir</p>
                    <p className="font-medium">{getCashierName()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Saldo Awal</p>
                    <p className="font-medium">{formatRupiah(cashSession.openingBalance)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Dibuka</p>
                    <p className="font-medium">{cashSession.openedAt || "-"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Penjualan Tunai</p>
                    <p className="font-medium">{formatRupiah(cashSales)}</p>
                  </div>
                </div>

                <div className="flex justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <span className="font-medium">Saldo Akhir (estimasi)</span>
                  <span className="font-bold text-lg">{formatRupiah(cashSession.openingBalance + cashSales)}</span>
                </div>

                <div className="flex gap-3 pt-2">
                  {!cashSession.isOpen ? (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => setShowOpenCashModal(true)}
                    >
                      <LockOpen className="mr-2 h-4 w-4" /> Buka Kas
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowCloseCashModal(true)}
                    >
                      <Lock className="mr-2 h-4 w-4" /> Tutup Kas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Informasi Kas Hari Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between p-2 border-b">
                    <span className="text-muted-foreground">Total Transaksi</span>
                    <span className="font-medium">{todayPaid.length}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span className="text-muted-foreground">Total Penjualan</span>
                    <span className="font-medium">{formatRupiah(todaySales)}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span className="text-muted-foreground">Tunai</span>
                    <span className="font-medium">{formatRupiah(cashSales)}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span className="text-muted-foreground">Transfer</span>
                    <span className="font-medium">{formatRupiah(todaySales - cashSales)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-muted-foreground">
                    💡 Pastikan untuk menutup kas di akhir shift. Rekap harian akan otomatis dibuat.
                  </p>
                </div>

                {cashSession.isOpen && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-400">
                      ✅ Sesi kas sedang aktif. Silakan melakukan transaksi di tab "Kasir".
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={exportSalesReport}
                  disabled={todayPaid.length === 0}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {todayPaid.length > 0 ? "Download Laporan Penjualan (PDF)" : "Belum ada transaksi"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ReceiptModal />
      <CustomOrderModal />
      <OpenCashModal />
      <CloseCashModal />
    </>
  )
}