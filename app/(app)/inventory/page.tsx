"use client"

import { useState, useRef } from "react"
import {
  Boxes,
  PackageSearch,
  TriangleAlert,
  ArrowDownToLine,
  ArrowLeftRight,
  Truck,
  PlusCircle,
  ClipboardList,
  Factory,
  Trash2,
  FileDown,
  PackagePlus,
} from "lucide-react"
import { PageHeader, StatCard, StatusPill } from "@/components/page-parts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useAppStore } from "@/lib/store"
import { formatDate } from "@/lib/mock-data"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// --- Helper functions ---
function StockBar({ current, min }: { current: number; min: number }) {
  const target = Math.max(min * 2, 1)
  const pct = Math.min(100, Math.round((current / target) * 100))
  const tone =
    current === 0
      ? "bg-destructive"
      : current <= min
        ? "bg-accent-foreground"
        : "bg-chart-2"
  return (
    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
    </div>
  )
}

function stockStatus(current: number, min: number) {
  if (current === 0) return <StatusPill label="Habis" tone="danger" />
  if (current <= min) return <StatusPill label="Menipis" tone="warning" />
  return <StatusPill label="Aman" tone="success" />
}

const movementTone: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  Masuk: "success",
  Keluar: "danger",
  Penyesuaian: "info",
}

export default function InventoryPage() {
  // ===== Ambil data & fungsi dari store =====
  const rawMaterials = useAppStore((state) => state.rawMaterials)
  const products = useAppStore((state) => state.products)
  const suppliers = useAppStore((state) => state.suppliers)
  const goodsReceipts = useAppStore((state) => state.goodsReceipts)
  const stockMovements = useAppStore((state) => state.stockMovements)
  const addRawMaterial = useAppStore((state) => state.addRawMaterial)
  const addProduct = useAppStore((state) => state.addProduct)
  const reduceRawMaterialStock = useAppStore((state) => state.reduceRawMaterialStock)
  const addGoodsReceipt = useAppStore((state) => state.addGoodsReceipt)
  const addStockMovement = useAppStore((state) => state.addStockMovement)
  const recordProduction = useAppStore((state) => state.recordProduction)

  // ===== DELETE FUNCTIONS =====
  const deleteRawMaterial = useAppStore((state) => state.deleteRawMaterial)
  const deleteProduct = useAppStore((state) => state.deleteProduct)
  const deleteSupplier = useAppStore((state) => state.deleteSupplier)
  const deleteGoodsReceipt = useAppStore((state) => state.deleteGoodsReceipt)
  const deleteStockMovement = useAppStore((state) => state.deleteStockMovement)

  const lowMaterials = rawMaterials.filter((m) => m.currentStock <= m.minStock).length
  const lowProducts = products.filter((p) => p.currentStock <= p.minStock).length

  // --- Toggle states untuk form ---
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showUsage, setShowUsage] = useState(false)
  const [showProduction, setShowProduction] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false) // NEW

  // --- State untuk form Tambah Bahan Baku ---
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    unit: "",
    price: 0,
    stock: 0,
    minStock: 0,
  })

  // --- State untuk form Pemakaian Bahan ---
  const [usage, setUsage] = useState({
    materialId: "",
    quantity: 0,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  })

  // --- State untuk form Produksi ---
  const [production, setProduction] = useState<{
    productId: string
    quantity: number
    rawUsage: { materialId: string; quantity: number }[]
  }>({
    productId: "",
    quantity: 0,
    rawUsage: [{ materialId: "", quantity: 0 }],
  })

  // --- State untuk form Penerimaan Supplier ---
  const [receipt, setReceipt] = useState({
    supplierId: "",
    materialId: "",
    quantity: 0,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  })

  // --- NEW: State untuk form Tambah Produk ---
  const [newProduct, setNewProduct] = useState<{
    name: string
    category: string
    price: number
    currentStock: number
    minStock: number
    recipe: { materialId: string; quantity: number }[]
  }>({
    name: "",
    category: "",
    price: 0,
    currentStock: 0,
    minStock: 0,
    recipe: [{ materialId: "", quantity: 0 }],
  })

  // ===== REF untuk elemen yang akan di-export PDF =====
  const tableRefs = {
    bahan: useRef<HTMLDivElement>(null),
    produk: useRef<HTMLDivElement>(null),
    penerimaan: useRef<HTMLDivElement>(null),
    mutasi: useRef<HTMLDivElement>(null),
  }

  // ===== FUNGSI EXPORT PDF =====
  const exportPDF = (title: string, columns: string[], rows: any[][], filename: string) => {
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(18)
    doc.text(title, pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text(`Firsta Cake - Sistem Inventaris`, pageWidth / 2, 28, { align: "center" })

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [58, 36, 26], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })

    doc.save(`${filename}.pdf`)
  }

  // ===== FUNGSI EXPORT PER TAB =====
  const exportBahanBaku = () => {
    const columns = ["Kode", "Nama Bahan", "Satuan", "Stok", "Min Stock", "Status"]
    const rows = rawMaterials.map((m) => [
      m.id,
      m.name,
      m.unit,
      m.currentStock,
      m.minStock,
      m.currentStock === 0 ? "Habis" : m.currentStock <= m.minStock ? "Menipis" : "Aman",
    ])
    exportPDF("Laporan Bahan Baku", columns, rows, "laporan-bahan-baku")
  }

  const exportProdukJadi = () => {
    const columns = ["Kode", "Nama Produk", "Kategori", "Stok", "Min Stock", "Status"]
    const rows = products.map((p) => [
      p.id,
      p.name,
      p.category,
      p.currentStock,
      p.minStock,
      p.currentStock === 0 ? "Habis" : p.currentStock <= p.minStock ? "Menipis" : "Aman",
    ])
    exportPDF("Laporan Produk Jadi", columns, rows, "laporan-produk-jadi")
  }

  const exportPenerimaan = () => {
    const columns = ["No. Terima", "Supplier", "Bahan", "Jumlah", "Tanggal"]
    const rows = goodsReceipts.map((g) => [
      g.id,
      g.supplierName,
      g.materialName,
      g.quantity,
      formatDate(g.date),
    ])
    exportPDF("Laporan Penerimaan Bahan", columns, rows, "laporan-penerimaan")
  }

  const exportMutasi = () => {
    const columns = ["Jenis", "Item", "Mutasi", "Perubahan", "Sebelum", "Sesudah", "Oleh", "Keterangan"]
    const rows = stockMovements.map((mv) => [
      mv.entityType,
      mv.entityName,
      mv.movementType,
      mv.quantityChange,
      mv.stockBefore,
      mv.stockAfter,
      mv.performedBy,
      mv.notes,
    ])
    exportPDF("Laporan Mutasi Stok", columns, rows, "laporan-mutasi-stok")
  }

  // ===== HANDLER UNTUK TAMBAH PRODUK =====
  const addRecipeRow = () => {
    setNewProduct((prev) => ({
      ...prev,
      recipe: [...prev.recipe, { materialId: "", quantity: 0 }],
    }))
  }

  const removeRecipeRow = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      recipe: prev.recipe.filter((_, i) => i !== index),
    }))
  }

  const updateRecipe = (index: number, field: string, value: string | number) => {
    const updated = [...newProduct.recipe]
    updated[index] = { ...updated[index], [field]: value }
    setNewProduct({ ...newProduct, recipe: updated })
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    // Validasi: semua bahan harus dipilih
    const hasEmpty = newProduct.recipe.some((r) => !r.materialId || r.quantity <= 0)
    if (hasEmpty) {
      alert("Lengkapi semua bahan baku dan jumlahnya!")
      return
    }
    addProduct({
      name: newProduct.name,
      category: newProduct.category,
      price: newProduct.price,
      currentStock: newProduct.currentStock,
      minStock: newProduct.minStock,
      recipe: newProduct.recipe,
    })
    alert(`Produk "${newProduct.name}" berhasil ditambahkan.`)
    setNewProduct({
      name: "",
      category: "",
      price: 0,
      currentStock: 0,
      minStock: 0,
      recipe: [{ materialId: "", quantity: 0 }],
    })
    setShowAddProduct(false)
  }

  // Handler untuk menambah baris bahan baku pada form produksi
  const addRawUsageRow = () => {
    setProduction((prev) => ({
      ...prev,
      rawUsage: [...prev.rawUsage, { materialId: "", quantity: 0 }],
    }))
  }

  const removeRawUsageRow = (index: number) => {
    setProduction((prev) => ({
      ...prev,
      rawUsage: prev.rawUsage.filter((_, i) => i !== index),
    }))
  }

  const updateRawUsage = (index: number, field: string, value: string | number) => {
    const updated = [...production.rawUsage]
    updated[index] = { ...updated[index], [field]: value }
    setProduction({ ...production, rawUsage: updated })
  }

  // --- Handler submit (menyimpan ke store) ---
  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    addRawMaterial({
      name: newMaterial.name,
      unit: newMaterial.unit,
      price: newMaterial.price,
      currentStock: newMaterial.stock,
      minStock: newMaterial.minStock,
    })
    alert(`Bahan baku "${newMaterial.name}" berhasil ditambahkan.`)
    setNewMaterial({ name: "", unit: "", price: 0, stock: 0, minStock: 0 })
    setShowAddMaterial(false)
  }

  const handleAddUsage = (e: React.FormEvent) => {
    e.preventDefault()
    const material = rawMaterials.find((m) => m.id === usage.materialId)
    if (!material) {
      alert("Pilih bahan terlebih dahulu!")
      return
    }
    if (usage.quantity > material.currentStock) {
      alert("Stok tidak mencukupi!")
      return
    }
    reduceRawMaterialStock(usage.materialId, usage.quantity)
    addStockMovement({
      entityType: "Bahan Baku",
      entityName: material.name,
      movementType: "Keluar",
      quantityChange: -usage.quantity,
      stockBefore: material.currentStock,
      stockAfter: material.currentStock - usage.quantity,
      performedBy: "Sistem",
      notes: usage.notes || "Pemakaian bahan baku",
      date: usage.date,
    })
    alert(`Pemakaian bahan "${material.name}" sebanyak ${usage.quantity} ${material.unit} tercatat.`)
    setUsage({
      materialId: "",
      quantity: 0,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    })
    setShowUsage(false)
  }

  const handleAddProduction = (e: React.FormEvent) => {
    e.preventDefault()
    const product = products.find((p) => p.id === production.productId)
    if (!product) {
      alert("Pilih produk terlebih dahulu!")
      return
    }
    recordProduction(production.productId, production.quantity)
    setProduction({
      productId: "",
      quantity: 0,
      rawUsage: [{ materialId: "", quantity: 0 }],
    })
    setShowProduction(false)
  }

  const handleAddReceipt = (e: React.FormEvent) => {
    e.preventDefault()
    const supplier = suppliers.find((s) => s.id === receipt.supplierId)
    const material = rawMaterials.find((m) => m.id === receipt.materialId)
    if (!supplier || !material) {
      alert("Pilih supplier dan bahan!")
      return
    }
    addGoodsReceipt({
      supplierId: supplier.id,
      supplierName: supplier.name,
      materialId: material.id,
      materialName: material.name,
      quantity: receipt.quantity,
      date: receipt.date,
      receivedBy: "Sistem",
    })
    alert(`Penerimaan dari supplier "${supplier.name}" untuk bahan "${material.name}" sebanyak ${receipt.quantity} ${material.unit} berhasil dicatat.`)
    setReceipt({
      supplierId: "",
      materialId: "",
      quantity: 0,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    })
    setShowReceipt(false)
  }

  return (
    <>
      <PageHeader
        title="Inventaris"
        description="Pantau bahan baku, produk jadi, penerimaan supplier, dan mutasi stok."
        icon={Boxes}
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jenis bahan baku"
          value={rawMaterials.length}
          hint="Item aktif"
          icon={PackageSearch}
        />
        <StatCard
          label="Jenis produk jadi"
          value={products.length}
          hint="Item aktif"
          icon={Boxes}
        />
        <StatCard
          label="Bahan menipis"
          value={lowMaterials}
          hint="Di bawah minimum"
          icon={TriangleAlert}
          tone="warning"
        />
        <StatCard
          label="Produk menipis"
          value={lowProducts}
          hint="Di bawah minimum"
          icon={TriangleAlert}
          tone="danger"
        />
      </section>

      <Tabs defaultValue="bahan">
        <TabsList>
          <TabsTrigger value="bahan">Bahan Baku</TabsTrigger>
          <TabsTrigger value="produk">Produk Jadi</TabsTrigger>
          <TabsTrigger value="penerimaan">Penerimaan</TabsTrigger>
          <TabsTrigger value="mutasi">Mutasi Stok</TabsTrigger>
        </TabsList>

        {/* ===== TAB BAHAN BAKU ===== */}
        <TabsContent value="bahan" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showAddMaterial ? "secondary" : "default"}
                onClick={() => setShowAddMaterial(!showAddMaterial)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {showAddMaterial ? "Tutup Form" : "Tambah Bahan Baku"}
              </Button>
              <Button
                variant={showUsage ? "secondary" : "default"}
                onClick={() => setShowUsage(!showUsage)}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                {showUsage ? "Tutup Form" : "Catat Pemakaian"}
              </Button>
            </div>
            <Button variant="outline" onClick={exportBahanBaku}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showAddMaterial && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <PlusCircle className="h-4 w-4 text-primary" /> Tambah Bahan Baku Baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddMaterial}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="matName">Nama Bahan</Label>
                    <Input
                      id="matName"
                      value={newMaterial.name}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="matUnit">Satuan</Label>
                    <Input
                      id="matUnit"
                      value={newMaterial.unit}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, unit: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="matPrice">Harga (per satuan)</Label>
                    <Input
                      id="matPrice"
                      type="number"
                      min="0"
                      value={newMaterial.price}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          price: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="matStock">Stok Awal</Label>
                    <Input
                      id="matStock"
                      type="number"
                      min="0"
                      value={newMaterial.stock}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          stock: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="matMin">Stok Minimum</Label>
                    <Input
                      id="matMin"
                      type="number"
                      min="0"
                      value={newMaterial.minStock}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          minStock: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Simpan Bahan</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {showUsage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <ClipboardList className="h-4 w-4 text-primary" /> Pemakaian Bahan Baku Hari Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddUsage}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="usageMaterial">Pilih Bahan</Label>
                    <Select
                      value={usage.materialId}
                      onValueChange={(val) =>
                        setUsage({ ...usage, materialId: val ?? "" })
                      }
                    >
                      <SelectTrigger id="usageMaterial">
                        <SelectValue placeholder="Pilih bahan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.unit}) – stok: {m.currentStock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="usageQty">Jumlah</Label>
                    <Input
                      id="usageQty"
                      type="number"
                      min="1"
                      value={usage.quantity}
                      onChange={(e) =>
                        setUsage({ ...usage, quantity: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="usageDate">Tanggal</Label>
                    <Input
                      id="usageDate"
                      type="date"
                      value={usage.date}
                      onChange={(e) =>
                        setUsage({ ...usage, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="usageNotes">Catatan</Label>
                    <Input
                      id="usageNotes"
                      value={usage.notes}
                      onChange={(e) =>
                        setUsage({ ...usage, notes: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Catat Pemakaian</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="overflow-x-auto p-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Bahan</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMaterials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.id}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.unit}</TableCell>
                      <TableCell className="text-right font-medium">{m.currentStock}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{m.minStock}</TableCell>
                      <TableCell>
                        <StockBar current={m.currentStock} min={m.minStock} />
                      </TableCell>
                      <TableCell>{stockStatus(m.currentStock, m.minStock)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus bahan "${m.name}"?`)) {
                              deleteRawMaterial(m.id)
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB PRODUK JADI ===== */}
        <TabsContent value="produk" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showAddProduct ? "secondary" : "default"}
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                {showAddProduct ? "Tutup Form" : "Tambah Produk"}
              </Button>
              <Button
                variant={showProduction ? "secondary" : "default"}
                onClick={() => setShowProduction(!showProduction)}
              >
                <Factory className="mr-2 h-4 w-4" />
                {showProduction ? "Tutup Form" : "Catat Produksi"}
              </Button>
            </div>
            <Button variant="outline" onClick={exportProdukJadi}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {/* Form Tambah Produk */}
          {showAddProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <PackagePlus className="h-4 w-4 text-primary" /> Tambah Produk Baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label htmlFor="prodName">Nama Produk</Label>
                      <Input
                        id="prodName"
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prodCategory">Kategori</Label>
                      <Input
                        id="prodCategory"
                        value={newProduct.category}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, category: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prodPrice">Harga Jual</Label>
                      <Input
                        id="prodPrice"
                        type="number"
                        min="0"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, price: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prodStock">Stok Awal</Label>
                      <Input
                        id="prodStock"
                        type="number"
                        min="0"
                        value={newProduct.currentStock}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, currentStock: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prodMinStock">Stok Minimum</Label>
                      <Input
                        id="prodMinStock"
                        type="number"
                        min="0"
                        value={newProduct.minStock}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, minStock: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Resep (Bahan Baku yang Dibutuhkan)</Label>
                    <div className="space-y-2">
                      {newProduct.recipe.map((row, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"
                        >
                          <div className="min-w-[150px] flex-1">
                            <Select
                              value={row.materialId}
                              onValueChange={(val) =>
                                updateRecipe(index, "materialId", val ?? "")
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih bahan..." />
                              </SelectTrigger>
                              <SelectContent>
                                {rawMaterials.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} ({m.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              placeholder="Jumlah"
                              value={row.quantity}
                              onChange={(e) =>
                                updateRecipe(index, "quantity", Number(e.target.value))
                              }
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRecipeRow(index)}
                            disabled={newProduct.recipe.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRecipeRow}
                    >
                      + Tambah Bahan
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Simpan Produk</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Form Produksi (existing) */}
          {showProduction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <Factory className="h-4 w-4 text-primary" /> Produksi Hari Ini (Kue / Roti)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduction} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="prodProduct">Pilih Produk Jadi</Label>
                      <Select
                        value={production.productId}
                        onValueChange={(val) =>
                          setProduction({ ...production, productId: val ?? "" })
                        }
                      >
                        <SelectTrigger id="prodProduct">
                          <SelectValue placeholder="Pilih produk..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} (stok: {p.currentStock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prodQty">Jumlah Diproduksi</Label>
                      <Input
                        id="prodQty"
                        type="number"
                        min="1"
                        value={production.quantity}
                        onChange={(e) =>
                          setProduction({
                            ...production,
                            quantity: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bahan Baku yang Digunakan (akan mengurangi stok)</Label>
                    <div className="space-y-2">
                      {production.rawUsage.map((row, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"
                        >
                          <div className="min-w-[150px] flex-1">
                            <Select
                              value={row.materialId}
                              onValueChange={(val) =>
                                updateRawUsage(index, "materialId", val ?? "")
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih bahan..." />
                              </SelectTrigger>
                              <SelectContent>
                                {rawMaterials.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} ({m.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              placeholder="Jumlah"
                              value={row.quantity}
                              onChange={(e) =>
                                updateRawUsage(
                                  index,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRawUsageRow(index)}
                            disabled={production.rawUsage.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRawUsageRow}
                    >
                      + Tambah Bahan
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Catat Produksi</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="overflow-x-auto p-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.id}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.category}</TableCell>
                      <TableCell className="text-right font-medium">{p.currentStock}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{p.minStock}</TableCell>
                      <TableCell>
                        <StockBar current={p.currentStock} min={p.minStock} />
                      </TableCell>
                      <TableCell>{stockStatus(p.currentStock, p.minStock)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus produk "${p.name}"?`)) {
                              deleteProduct(p.id)
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB PENERIMAAN ===== */}
        <TabsContent value="penerimaan" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showReceipt ? "secondary" : "default"}
              onClick={() => setShowReceipt(!showReceipt)}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              {showReceipt ? "Tutup Form" : "Catat Penerimaan"}
            </Button>
            <Button variant="outline" onClick={exportPenerimaan}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showReceipt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <ArrowDownToLine className="h-4 w-4 text-primary" /> Form Penerimaan Bahan dari Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddReceipt}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="receiptSupplier">Supplier</Label>
                    <Select
                      value={receipt.supplierId}
                      onValueChange={(val) =>
                        setReceipt({ ...receipt, supplierId: val ?? "" })
                      }
                    >
                      <SelectTrigger id="receiptSupplier">
                        <SelectValue placeholder="Pilih supplier..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiptMaterial">Pilih Bahan</Label>
                    <Select
                      value={receipt.materialId}
                      onValueChange={(val) =>
                        setReceipt({ ...receipt, materialId: val ?? "" })
                      }
                    >
                      <SelectTrigger id="receiptMaterial">
                        <SelectValue placeholder="Pilih bahan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiptQty">Jumlah</Label>
                    <Input
                      id="receiptQty"
                      type="number"
                      min="1"
                      value={receipt.quantity}
                      onChange={(e) =>
                        setReceipt({ ...receipt, quantity: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiptDate">Tanggal</Label>
                    <Input
                      id="receiptDate"
                      type="date"
                      value={receipt.date}
                      onChange={(e) =>
                        setReceipt({ ...receipt, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="receiptNotes">Catatan</Label>
                    <Input
                      id="receiptNotes"
                      value={receipt.notes}
                      onChange={(e) =>
                        setReceipt({ ...receipt, notes: e.target.value })
                      }
                      placeholder="Misal: PO-001, kualitas baik, dll."
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Simpan Penerimaan</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <ArrowDownToLine className="h-4 w-4 text-primary" /> Penerimaan Bahan dari Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Terima</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Bahan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goodsReceipts.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.id}</TableCell>
                      <TableCell>{g.supplierName}</TableCell>
                      <TableCell>{g.materialName}</TableCell>
                      <TableCell className="text-right">{g.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(g.date)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus penerimaan "${g.id}"?`)) {
                              deleteGoodsReceipt(g.id)
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <Truck className="h-4 w-4 text-primary" /> Daftar Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.contactPerson} - {s.phone}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.address}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Yakin hapus supplier "${s.name}"?`)) {
                        deleteSupplier(s.id)
                      }
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB MUTASI STOK ===== */}
        <TabsContent value="mutasi" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={exportMutasi}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <ArrowLeftRight className="h-4 w-4 text-primary" /> Riwayat Mutasi Stok (Audit Trail)
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Mutasi</TableHead>
                    <TableHead className="text-right">Perubahan</TableHead>
                    <TableHead className="text-right">Sebelum</TableHead>
                    <TableHead className="text-right">Sesudah</TableHead>
                    <TableHead>Oleh</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((mv) => (
                    <TableRow key={mv.id}>
                      <TableCell className="text-muted-foreground">{mv.entityType}</TableCell>
                      <TableCell className="font-medium">{mv.entityName}</TableCell>
                      <TableCell>
                        <StatusPill label={mv.movementType} tone={movementTone[mv.movementType]} />
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          mv.quantityChange < 0 ? "text-destructive" : "text-chart-1"
                        }`}
                      >
                        {mv.quantityChange > 0 ? `+${mv.quantityChange}` : mv.quantityChange}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{mv.stockBefore}</TableCell>
                      <TableCell className="text-right">{mv.stockAfter}</TableCell>
                      <TableCell className="text-muted-foreground">{mv.performedBy}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">{mv.notes}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus mutasi stok ini?`)) {
                              deleteStockMovement(mv.id)
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {stockMovements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Belum ada mutasi stok.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}