"use client"

import { useState } from "react"
import {
  Wrench,
  Cog,
  TriangleAlert,
  CalendarClock,
  ClipboardList,
  BellRing,
  PlusCircle,
  AlertTriangle,
  Trash2,
  FileDown,
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
import { formatRupiah, formatDate } from "@/lib/mock-data"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// --- Helper functions ---
const conditionTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Baik: "success",
  "Perlu Perhatian": "warning",
  Rusak: "danger",
}
const urgencyTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Rendah: "neutral",
  Sedang: "warning",
  Tinggi: "danger",
}
const damageStatusTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Dilaporkan: "warning",
  Diproses: "info",
  Selesai: "success",
}
const serviceTypeTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Perbaikan: "warning",
  Perawatan: "info",
}

const TODAY = new Date("2026-06-23")
function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - TODAY.getTime()) / 86400000)
}

export default function EquipmentPage() {
  // ===== Ambil data & fungsi dari store =====
  const equipments = useAppStore((state) => state.equipments)
  const damageReports = useAppStore((state) => state.damageReports)
  const serviceRecords = useAppStore((state) => state.serviceRecords)
  const maintenanceSchedules = useAppStore((state) => state.maintenanceSchedules)
  const addEquipment = useAppStore((state) => state.addEquipment)
  const addDamageReport = useAppStore((state) => state.addDamageReport)
  const addServiceRecord = useAppStore((state) => state.addServiceRecord)
  const addMaintenanceSchedule = useAppStore((state) => state.addMaintenanceSchedule)
  const deleteEquipment = useAppStore((state) => state.deleteEquipment)
  const deleteDamageReport = useAppStore((state) => state.deleteDamageReport)
  const deleteServiceRecord = useAppStore((state) => state.deleteServiceRecord)
  const deleteMaintenanceSchedule = useAppStore((state) => state.deleteMaintenanceSchedule)

  // ===== Statistik =====
  const needAttention = equipments.filter((e) => e.condition !== "Baik").length
  const openReports = damageReports.filter((d) => d.status !== "Selesai").length
  const totalServiceCost = serviceRecords.reduce((s, r) => s + r.cost, 0)
  const upcomingSoon = maintenanceSchedules.filter((m) => daysUntil(m.nextDueDate) <= 3).length

  // --- Toggle states untuk form ---
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [showAddDamage, setShowAddDamage] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showAddSchedule, setShowAddSchedule] = useState(false) // untuk jadwal

  // --- State untuk form Tambah Alat ---
  const [newEquipment, setNewEquipment] = useState<{
    name: string
    type: string
    acquisitionYear: number
    condition: "Baik" | "Perlu Perhatian" | "Rusak"
    isActive: boolean
    notes: string
  }>({
    name: "",
    type: "",
    acquisitionYear: new Date().getFullYear(),
    condition: "Baik",
    isActive: true,
    notes: "",
  })

  // --- State untuk form Lapor Kerusakan ---
  const [newDamage, setNewDamage] = useState<{
    equipmentId: string
    problem: string
    urgency: "Rendah" | "Sedang" | "Tinggi"
    reportedBy: string
    date: string
  }>({
    equipmentId: "",
    problem: "",
    urgency: "Sedang",
    reportedBy: "",
    date: new Date().toISOString().slice(0, 10),
  })

  // --- State untuk form Catat Servis ---
  const [newService, setNewService] = useState<{
    equipmentId: string
    serviceDate: string
    technician: string
    serviceType: "Perbaikan" | "Perawatan"
    description: string
    cost: number
    approvedBy: string
  }>({
    equipmentId: "",
    serviceDate: new Date().toISOString().slice(0, 10),
    technician: "",
    serviceType: "Perbaikan",
    description: "",
    cost: 0,
    approvedBy: "",
  })

  // --- State untuk form Tambah Jadwal Perawatan ---
  const [newSchedule, setNewSchedule] = useState<{
    equipmentId: string
    scheduleName: string
    frequency: string
    lastPerformedDate: string
    nextDueDate: string
  }>({
    equipmentId: "",
    scheduleName: "",
    frequency: "",
    lastPerformedDate: new Date().toISOString().slice(0, 10),
    nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  })

  // --- Handler submit (menyimpan ke store) ---
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault()
    addEquipment({
      name: newEquipment.name,
      type: newEquipment.type,
      acquisitionYear: newEquipment.acquisitionYear,
      condition: newEquipment.condition,
      isActive: newEquipment.isActive,
      notes: newEquipment.notes || undefined,
    })
    alert(`Alat "${newEquipment.name}" berhasil ditambahkan.`)
    setNewEquipment({
      name: "",
      type: "",
      acquisitionYear: new Date().getFullYear(),
      condition: "Baik",
      isActive: true,
      notes: "",
    })
    setShowAddEquipment(false)
  }

  const handleAddDamage = (e: React.FormEvent) => {
    e.preventDefault()
    const equipment = equipments.find((eq) => eq.id === newDamage.equipmentId)
    if (!equipment) {
      alert("Pilih alat terlebih dahulu!")
      return
    }
    addDamageReport({
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      problem: newDamage.problem,
      urgency: newDamage.urgency,
      reportedBy: newDamage.reportedBy,
      date: newDamage.date,
      status: "Dilaporkan",
    })
    alert(`Laporan kerusakan untuk "${equipment.name}" berhasil dikirim.`)
    setNewDamage({
      equipmentId: "",
      problem: "",
      urgency: "Sedang",
      reportedBy: "",
      date: new Date().toISOString().slice(0, 10),
    })
    setShowAddDamage(false)
  }

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    const equipment = equipments.find((eq) => eq.id === newService.equipmentId)
    if (!equipment) {
      alert("Pilih alat terlebih dahulu!")
      return
    }
    addServiceRecord({
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      serviceDate: newService.serviceDate,
      technician: newService.technician,
      serviceType: newService.serviceType,
      description: newService.description,
      cost: newService.cost,
      approvedBy: newService.approvedBy,
    })
    alert(`Servis untuk "${equipment.name}" berhasil dicatat.`)
    setNewService({
      equipmentId: "",
      serviceDate: new Date().toISOString().slice(0, 10),
      technician: "",
      serviceType: "Perbaikan",
      description: "",
      cost: 0,
      approvedBy: "",
    })
    setShowAddService(false)
  }

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    const equipment = equipments.find((eq) => eq.id === newSchedule.equipmentId)
    if (!equipment) {
      alert("Pilih alat terlebih dahulu!")
      return
    }
    addMaintenanceSchedule({
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      scheduleName: newSchedule.scheduleName,
      frequency: newSchedule.frequency,
      lastPerformedDate: newSchedule.lastPerformedDate,
      nextDueDate: newSchedule.nextDueDate,
    })
    alert(`Jadwal perawatan untuk "${equipment.name}" berhasil ditambahkan.`)
    setNewSchedule({
      equipmentId: "",
      scheduleName: "",
      frequency: "",
      lastPerformedDate: new Date().toISOString().slice(0, 10),
      nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    })
    setShowAddSchedule(false)
  }

  // ===== EXPORT PDF =====
  const exportEquipments = () => {
    if (equipments.length === 0) return alert("Tidak ada data alat.")
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text("Daftar Alat Produksi", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - Servis Alat", pageWidth / 2, 28, { align: "center" })
    const columns = ["Kode", "Nama", "Jenis", "Tahun", "Kondisi", "Status", "Catatan"]
    const rows = equipments.map((e) => [
      e.id,
      e.name,
      e.type,
      e.acquisitionYear,
      e.condition,
      e.isActive ? "Aktif" : "Nonaktif",
      e.notes || "-",
    ])
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [58, 36, 26], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })
    doc.save("daftar-alat.pdf")
  }

  const exportDamage = () => {
    if (damageReports.length === 0) return alert("Tidak ada laporan kerusakan.")
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text("Laporan Kerusakan", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - Servis Alat", pageWidth / 2, 28, { align: "center" })
    const columns = ["No.", "Alat", "Pelapor", "Tanggal", "Masalah", "Urgensi", "Status"]
    const rows = damageReports.map((d) => [
      d.id,
      d.equipmentName,
      d.reportedBy,
      formatDate(d.date),
      d.problem,
      d.urgency,
      d.status,
    ])
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [58, 36, 26], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })
    doc.save("laporan-kerusakan.pdf")
  }

  const exportService = () => {
    if (serviceRecords.length === 0) return alert("Tidak ada riwayat servis.")
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text("Riwayat Servis Alat", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - Servis Alat", pageWidth / 2, 28, { align: "center" })
    const columns = ["No.", "Alat", "Tanggal", "Teknisi", "Jenis", "Pekerjaan", "Biaya", "Disetujui"]
    const rows = serviceRecords.map((r) => [
      r.id,
      r.equipmentName,
      formatDate(r.serviceDate),
      r.technician,
      r.serviceType,
      r.description,
      formatRupiah(r.cost),
      r.approvedBy,
    ])
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [58, 36, 26], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })
    doc.save("riwayat-servis.pdf")
  }

  const exportSchedule = () => {
    if (maintenanceSchedules.length === 0) return alert("Tidak ada jadwal perawatan.")
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text("Jadwal Perawatan Rutin", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - Servis Alat", pageWidth / 2, 28, { align: "center" })
    const columns = ["Alat", "Jadwal", "Frekuensi", "Terakhir", "Jatuh Tempo"]
    const rows = maintenanceSchedules.map((m) => [
      m.equipmentName,
      m.scheduleName,
      m.frequency,
      formatDate(m.lastPerformedDate),
      formatDate(m.nextDueDate),
    ])
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [58, 36, 26], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })
    doc.save("jadwal-perawatan.pdf")
  }

  return (
    <>
      <PageHeader
        title="Servis Alat"
        description="Pantau kondisi alat produksi, laporan kerusakan, riwayat servis, dan jadwal perawatan."
        icon={Wrench}
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total alat" value={equipments.length} hint="Terdaftar" icon={Cog} />
        <StatCard
          label="Perlu perhatian"
          value={needAttention}
          hint="Kondisi tidak prima"
          icon={TriangleAlert}
          tone="warning"
        />
        <StatCard
          label="Laporan aktif"
          value={openReports}
          hint="Belum selesai"
          icon={ClipboardList}
          tone="danger"
        />
        <StatCard
          label="Biaya servis"
          value={formatRupiah(totalServiceCost)}
          hint="Akumulasi tercatat"
          icon={Wrench}
        />
      </section>

      {upcomingSoon > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-accent bg-accent/40 p-4">
          <BellRing className="h-5 w-5 shrink-0 text-accent-foreground" />
          <p className="text-sm text-accent-foreground">
            <span className="font-semibold">{upcomingSoon} jadwal perawatan</span> akan jatuh tempo dalam 3 hari
            ke depan. Pengingat dikirim ke Kepala Produksi & Owner.
          </p>
        </div>
      )}

      <Tabs defaultValue="alat">
        <TabsList>
          <TabsTrigger value="alat">Daftar Alat</TabsTrigger>
          <TabsTrigger value="kerusakan">Laporan Kerusakan</TabsTrigger>
          <TabsTrigger value="servis">Riwayat Servis</TabsTrigger>
          <TabsTrigger value="jadwal">Jadwal Perawatan</TabsTrigger>
        </TabsList>

        {/* ===== TAB DAFTAR ALAT ===== */}
        <TabsContent value="alat" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showAddEquipment ? "secondary" : "default"}
              onClick={() => setShowAddEquipment(!showAddEquipment)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {showAddEquipment ? "Tutup Form" : "Tambah Alat"}
            </Button>
            <Button variant="outline" onClick={exportEquipments}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showAddEquipment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <Cog className="h-4 w-4 text-primary" /> Form Tambah Alat Baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddEquipment}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="eqName">Nama Alat</Label>
                    <Input
                      id="eqName"
                      value={newEquipment.name}
                      onChange={(e) =>
                        setNewEquipment({ ...newEquipment, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eqType">Jenis</Label>
                    <Input
                      id="eqType"
                      value={newEquipment.type}
                      onChange={(e) =>
                        setNewEquipment({ ...newEquipment, type: e.target.value })
                      }
                      required
                      placeholder="Oven, Mixer, dll."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eqYear">Tahun Beli</Label>
                    <Input
                      id="eqYear"
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={newEquipment.acquisitionYear}
                      onChange={(e) =>
                        setNewEquipment({
                          ...newEquipment,
                          acquisitionYear: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eqCondition">Kondisi Awal</Label>
                    <Select
                      value={newEquipment.condition}
                      onValueChange={(val) =>
                        setNewEquipment({
                          ...newEquipment,
                          condition: (val ?? "Baik") as "Baik" | "Perlu Perhatian" | "Rusak",
                        })
                      }
                    >
                      <SelectTrigger id="eqCondition">
                        <SelectValue placeholder="Pilih kondisi..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baik">Baik</SelectItem>
                        <SelectItem value="Perlu Perhatian">Perlu Perhatian</SelectItem>
                        <SelectItem value="Rusak">Rusak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="eqNotes">Catatan</Label>
                    <Input
                      id="eqNotes"
                      value={newEquipment.notes}
                      onChange={(e) =>
                        setNewEquipment({ ...newEquipment, notes: e.target.value })
                      }
                      placeholder="Misal: Merek, spesifikasi, dll."
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Simpan Alat</Button>
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
                    <TableHead>Nama Alat</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Tahun</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.id}</TableCell>
                      <TableCell>{e.name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.type}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {e.acquisitionYear}
                      </TableCell>
                      <TableCell>
                        <StatusPill label={e.condition} tone={conditionTone[e.condition]} />
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          label={e.isActive ? "Aktif" : "Nonaktif"}
                          tone={e.isActive ? "success" : "neutral"}
                        />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {e.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus alat "${e.name}"?`)) {
                              deleteEquipment(e.id)
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

        {/* ===== TAB LAPORAN KERUSAKAN ===== */}
        <TabsContent value="kerusakan" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showAddDamage ? "secondary" : "default"}
              onClick={() => setShowAddDamage(!showAddDamage)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              {showAddDamage ? "Tutup Form" : "Lapor Kerusakan"}
            </Button>
            <Button variant="outline" onClick={exportDamage}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showAddDamage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <AlertTriangle className="h-4 w-4 text-primary" /> Form Laporan Kerusakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddDamage}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="damageEquipment">Pilih Alat</Label>
                    <Select
                      value={newDamage.equipmentId}
                      onValueChange={(val) =>
                        setNewDamage({ ...newDamage, equipmentId: val ?? "" })
                      }
                    >
                      <SelectTrigger id="damageEquipment">
                        <SelectValue placeholder="Pilih alat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} - {eq.condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="damageProblem">Deskripsi Masalah</Label>
                    <Input
                      id="damageProblem"
                      value={newDamage.problem}
                      onChange={(e) =>
                        setNewDamage({ ...newDamage, problem: e.target.value })
                      }
                      required
                      placeholder="Mesin tidak menyala, suara berisik, dll."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="damageUrgency">Urgensi</Label>
                    <Select
                      value={newDamage.urgency}
                      onValueChange={(val) =>
                        setNewDamage({
                          ...newDamage,
                          urgency: (val ?? "Sedang") as "Rendah" | "Sedang" | "Tinggi",
                        })
                      }
                    >
                      <SelectTrigger id="damageUrgency">
                        <SelectValue placeholder="Pilih urgensi..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rendah">Rendah</SelectItem>
                        <SelectItem value="Sedang">Sedang</SelectItem>
                        <SelectItem value="Tinggi">Tinggi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="damageReporter">Nama Pelapor</Label>
                    <Input
                      id="damageReporter"
                      value={newDamage.reportedBy}
                      onChange={(e) =>
                        setNewDamage({ ...newDamage, reportedBy: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="damageDate">Tanggal</Label>
                    <Input
                      id="damageDate"
                      type="date"
                      value={newDamage.date}
                      onChange={(e) =>
                        setNewDamage({ ...newDamage, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Kirim Laporan</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <ClipboardList className="h-4 w-4 text-primary" /> Laporan Kerusakan dari Tim Produksi
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Alat</TableHead>
                    <TableHead>Pelapor</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Masalah</TableHead>
                    <TableHead>Urgensi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {damageReports.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.id}</TableCell>
                      <TableCell>{d.equipmentName}</TableCell>
                      <TableCell className="text-muted-foreground">{d.reportedBy}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(d.date)}</TableCell>
                      <TableCell className="max-w-[220px] text-muted-foreground text-pretty">
                        {d.problem}
                      </TableCell>
                      <TableCell>
                        <StatusPill label={d.urgency} tone={urgencyTone[d.urgency]} />
                      </TableCell>
                      <TableCell>
                        <StatusPill label={d.status} tone={damageStatusTone[d.status]} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus laporan "${d.id}"?`)) {
                              deleteDamageReport(d.id)
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

        {/* ===== TAB RIWAYAT SERVIS ===== */}
        <TabsContent value="servis" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showAddService ? "secondary" : "default"}
              onClick={() => setShowAddService(!showAddService)}
            >
              <Wrench className="mr-2 h-4 w-4" />
              {showAddService ? "Tutup Form" : "Catat Servis"}
            </Button>
            <Button variant="outline" onClick={exportService}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showAddService && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <Wrench className="h-4 w-4 text-primary" /> Form Catat Servis Alat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddService}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="serviceEquipment">Pilih Alat</Label>
                    <Select
                      value={newService.equipmentId}
                      onValueChange={(val) =>
                        setNewService({ ...newService, equipmentId: val ?? "" })
                      }
                    >
                      <SelectTrigger id="serviceEquipment">
                        <SelectValue placeholder="Pilih alat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} - {eq.condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="serviceDate">Tanggal Servis</Label>
                    <Input
                      id="serviceDate"
                      type="date"
                      value={newService.serviceDate}
                      onChange={(e) =>
                        setNewService({ ...newService, serviceDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="serviceTechnician">Teknisi / Vendor</Label>
                    <Input
                      id="serviceTechnician"
                      value={newService.technician}
                      onChange={(e) =>
                        setNewService({ ...newService, technician: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="serviceType">Jenis Servis</Label>
                    <Select
                      value={newService.serviceType}
                      onValueChange={(val) =>
                        setNewService({
                          ...newService,
                          serviceType: (val ?? "Perbaikan") as "Perbaikan" | "Perawatan",
                        })
                      }
                    >
                      <SelectTrigger id="serviceType">
                        <SelectValue placeholder="Pilih jenis..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Perbaikan">Perbaikan</SelectItem>
                        <SelectItem value="Perawatan">Perawatan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="serviceDesc">Deskripsi Pekerjaan</Label>
                    <Input
                      id="serviceDesc"
                      value={newService.description}
                      onChange={(e) =>
                        setNewService({ ...newService, description: e.target.value })
                      }
                      required
                      placeholder="Ganti bearing, servis mesin, dll."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="serviceCost">Biaya (Rp)</Label>
                    <Input
                      id="serviceCost"
                      type="number"
                      min="0"
                      value={newService.cost}
                      onChange={(e) =>
                        setNewService({ ...newService, cost: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="serviceApproved">Disetujui oleh</Label>
                    <Input
                      id="serviceApproved"
                      value={newService.approvedBy}
                      onChange={(e) =>
                        setNewService({ ...newService, approvedBy: e.target.value })
                      }
                      required
                      placeholder="Nama penyetuju"
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Simpan Servis</Button>
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
                    <TableHead>No. Servis</TableHead>
                    <TableHead>Alat</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Teknisi</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Pekerjaan</TableHead>
                    <TableHead className="text-right">Biaya</TableHead>
                    <TableHead>Disetujui</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell>{r.equipmentName}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.serviceDate)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.technician}</TableCell>
                      <TableCell>
                        <StatusPill
                          label={r.serviceType}
                          tone={serviceTypeTone[r.serviceType]}
                        />
                      </TableCell>
                      <TableCell className="max-w-[220px] text-muted-foreground text-pretty">
                        {r.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatRupiah(r.cost)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.approvedBy}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus servis "${r.id}"?`)) {
                              deleteServiceRecord(r.id)
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

        {/* ===== TAB JADWAL PERAWATAN ===== */}
        <TabsContent value="jadwal" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showAddSchedule ? "secondary" : "default"}
              onClick={() => setShowAddSchedule(!showAddSchedule)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {showAddSchedule ? "Tutup Form" : "Tambah Jadwal"}
            </Button>
            <Button variant="outline" onClick={exportSchedule}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showAddSchedule && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <CalendarClock className="h-4 w-4 text-primary" /> Form Tambah Jadwal Perawatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddSchedule}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <div className="space-y-1">
                    <Label htmlFor="scheduleEquipment">Pilih Alat</Label>
                    <Select
                      value={newSchedule.equipmentId}
                      onValueChange={(val) =>
                        setNewSchedule({ ...newSchedule, equipmentId: val ?? "" })
                      }
                    >
                      <SelectTrigger id="scheduleEquipment">
                        <SelectValue placeholder="Pilih alat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scheduleName">Nama Jadwal</Label>
                    <Input
                      id="scheduleName"
                      value={newSchedule.scheduleName}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, scheduleName: e.target.value })
                      }
                      required
                      placeholder="Pembersihan rutin, dll."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scheduleFreq">Frekuensi</Label>
                    <Input
                      id="scheduleFreq"
                      value={newSchedule.frequency}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, frequency: e.target.value })
                      }
                      required
                      placeholder="Setiap 3 bulan"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scheduleLast">Terakhir Dilakukan</Label>
                    <Input
                      id="scheduleLast"
                      type="date"
                      value={newSchedule.lastPerformedDate}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, lastPerformedDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scheduleNext">Jatuh Tempo</Label>
                    <Input
                      id="scheduleNext"
                      type="date"
                      value={newSchedule.nextDueDate}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, nextDueDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">Simpan Jadwal</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <CalendarClock className="h-4 w-4 text-primary" /> Jadwal Perawatan Rutin
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alat</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Frekuensi</TableHead>
                    <TableHead>Terakhir</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Pengingat</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceSchedules.map((m) => {
                    const days = daysUntil(m.nextDueDate)
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.equipmentName}</TableCell>
                        <TableCell>{m.scheduleName}</TableCell>
                        <TableCell className="text-muted-foreground">{m.frequency}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(m.lastPerformedDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(m.nextDueDate)}
                        </TableCell>
                        <TableCell>
                          {days <= 3 ? (
                            <StatusPill
                              label={days <= 0 ? "Jatuh tempo" : `${days} hari lagi`}
                              tone="danger"
                            />
                          ) : (
                            <StatusPill label={`${days} hari lagi`} tone="neutral" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Yakin hapus jadwal "${m.scheduleName}"?`)) {
                                deleteMaintenanceSchedule(m.id)
                              }
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}