"use client"

import { useState } from "react"
import {
  Users,
  UserCheck,
  CalendarClock,
  Wallet,
  Lock,
  ShieldCheck,
  PlusCircle,
  UserPlus,
  Clock,
  FileText,
  RefreshCw,
  Trash2,
  FileDown,
  CheckCircle,
  LockIcon,
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
const attendanceTone: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  Hadir: "success",
  Izin: "info",
  Sakit: "warning",
  Alpa: "danger",
  Libur: "neutral",
}
const payrollTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  Draft: "neutral",
  Verified: "info",
  Locked: "success",
}
const empTypeTone: Record<string, "neutral" | "info"> = {
  Tetap: "info",
  "Daily Worker": "neutral",
}

export default function HrPage() {
  // ===== Ambil data & fungsi dari store =====
  const employees = useAppStore((state) => state.employees)
  const attendances = useAppStore((state) => state.attendances)
  const payrollRecords = useAppStore((state) => state.payrollRecords)
  const addEmployee = useAppStore((state) => state.addEmployee)
  const addAttendance = useAppStore((state) => state.addAttendance)
  const generatePayroll = useAppStore((state) => state.generatePayroll)
  const deleteEmployee = useAppStore((state) => state.deleteEmployee)
  const deleteAttendance = useAppStore((state) => state.deleteAttendance)
  const deletePayrollRecord = useAppStore((state) => state.deletePayrollRecord)
  const updatePayrollStatus = useAppStore((state) => state.updatePayrollStatus) // NEW

  // ===== Statistik =====
  const today = new Date().toISOString().slice(0, 10)
  const todayAttendances = attendances.filter((a) => a.date === today)
  const presentToday = todayAttendances.filter((a) => a.status === "Hadir").length
  const payrollTotal = payrollRecords.reduce((s, r) => s + r.total, 0)
  const lockedCount = payrollRecords.filter((r) => r.status === "Locked").length

  // --- State untuk form Tambah Karyawan ---
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [newEmployee, setNewEmployee] = useState<{
    fullName: string
    position: string
    department: string
    employmentType: "Tetap" | "Daily Worker"
    phone: string
    baseSalary: number
    dailyWage: number
    joinDate: string
  }>({
    fullName: "",
    position: "",
    department: "",
    employmentType: "Tetap",
    phone: "",
    baseSalary: 0,
    dailyWage: 0,
    joinDate: new Date().toISOString().slice(0, 10),
  })

  // --- State untuk form Absensi Harian ---
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [newAttendance, setNewAttendance] = useState<{
    employeeId: string
    status: "Hadir" | "Izin" | "Sakit" | "Alpa" | "Libur"
    checkIn: string
    checkOut: string
    notes: string
  }>({
    employeeId: "",
    status: "Hadir",
    checkIn: "08:00",
    checkOut: "16:00",
    notes: "",
  })

  // ===== State form generate payroll =====
  const [showPayrollForm, setShowPayrollForm] = useState(false)
  const [payrollPeriodInput, setPayrollPeriodInput] = useState({
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    year: String(new Date().getFullYear()),
  })

  // ===== Handler tambah karyawan =====
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    addEmployee({
      fullName: newEmployee.fullName,
      position: newEmployee.position,
      department: newEmployee.department,
      employmentType: newEmployee.employmentType,
      phone: newEmployee.phone,
      baseSalary: newEmployee.baseSalary,
      dailyWage: newEmployee.dailyWage,
      joinDate: newEmployee.joinDate,
    })
    alert(`Karyawan "${newEmployee.fullName}" berhasil ditambahkan.`)
    setNewEmployee({
      fullName: "",
      position: "",
      department: "",
      employmentType: "Tetap",
      phone: "",
      baseSalary: 0,
      dailyWage: 0,
      joinDate: new Date().toISOString().slice(0, 10),
    })
    setShowEmployeeForm(false)
  }

  // ===== Handler tambah absensi =====
  const handleAddAttendance = (e: React.FormEvent) => {
    e.preventDefault()
    const employee = employees.find((emp) => emp.id === newAttendance.employeeId)
    if (!employee) {
      alert("Pilih karyawan terlebih dahulu!")
      return
    }
    addAttendance({
      employeeId: employee.id,
      employeeName: employee.fullName,
      date: today,
      status: newAttendance.status,
      checkIn: newAttendance.checkIn,
      checkOut: newAttendance.checkOut,
      recordedBy: "Sistem",
      notes: newAttendance.notes || undefined,
    })
    alert(`Absensi untuk "${employee.fullName}" berhasil dicatat.`)
    setNewAttendance({
      employeeId: "",
      status: "Hadir",
      checkIn: "08:00",
      checkOut: "16:00",
      notes: "",
    })
    setShowAttendanceForm(false)
  }

  // ===== Handler generate payroll =====
  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault()
    const period = `${payrollPeriodInput.year}-${payrollPeriodInput.month}`
    generatePayroll(period)
    setShowPayrollForm(false)
  }

  // ===== Handler verifikasi payroll =====
  const handleVerifyPayroll = (id: string, employeeName: string) => {
    if (confirm(`Verifikasi payroll untuk "${employeeName}"?`)) {
      updatePayrollStatus(id, "Verified")
      alert(`Payroll "${employeeName}" berhasil diverifikasi.`)
    }
  }

  // ===== Handler lock payroll =====
  const handleLockPayroll = (id: string, employeeName: string) => {
    if (confirm(`Kunci payroll untuk "${employeeName}"? Data tidak bisa diubah lagi.`)) {
      updatePayrollStatus(id, "Locked")
      alert(`Payroll "${employeeName}" berhasil dikunci.`)
    }
  }

  // ===== EXPORT PDF FUNCTIONS =====
  const exportEmployeesPDF = () => {
    if (employees.length === 0) return alert("Tidak ada data karyawan.")
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text("Daftar Karyawan", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - HR / Payroll", pageWidth / 2, 28, { align: "center" })
    const columns = ["Nama", "Jabatan", "Departemen", "Tipe", "Kontak", "Gaji/Upah", "Bergabung"]
    const rows = employees.map((e) => [
      e.fullName,
      e.position,
      e.department,
      e.employmentType,
      e.phone,
      e.employmentType === "Tetap"
        ? `${formatRupiah(e.baseSalary)}/bln`
        : `${formatRupiah(e.dailyWage)}/hari`,
      formatDate(e.joinDate),
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
    doc.save("daftar-karyawan.pdf")
  }

  const exportAttendancePDF = () => {
    const todayAtt = attendances.filter((a) => a.date === today)
    if (todayAtt.length === 0) return alert("Tidak ada absensi hari ini.")
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text("Absensi Harian", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${formatDate(today)}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - HR / Payroll", pageWidth / 2, 28, { align: "center" })
    const columns = ["Karyawan", "Status", "Masuk", "Pulang", "Catatan"]
    const rows = todayAtt.map((a) => [
      a.employeeName,
      a.status,
      a.checkIn || "-",
      a.checkOut || "-",
      a.notes || "-",
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
    doc.save(`absensi-${today}.pdf`)
  }

  const exportPayrollPDF = () => {
    if (payrollRecords.length === 0) return alert("Tidak ada data payroll.")
    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text("Laporan Payroll", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth / 2, 22, { align: "center" })
    doc.text("Firsta Cake - HR / Payroll", pageWidth / 2, 28, { align: "center" })
    const columns = ["Karyawan", "Jabatan", "Hadir", "Absen", "Gaji Pokok", "Tunjangan", "Potongan", "Total", "Status"]
    const rows = payrollRecords.map((r) => [
      r.employeeName,
      r.position,
      r.presentDays,
      r.absentDays,
      formatRupiah(r.baseAmount),
      formatRupiah(r.allowance),
      formatRupiah(r.deduction),
      formatRupiah(r.total),
      r.status,
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
    doc.save("laporan-payroll.pdf")
  }

  return (
    <>
      <PageHeader
        title="HR / Payroll"
        description="Kelola data karyawan, absensi harian, dan perhitungan gaji per periode."
        icon={Users}
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Karyawan aktif"
          value={employees.length}
          hint="Tetap & daily worker"
          icon={Users}
        />
        <StatCard
          label="Hadir hari ini"
          value={`${presentToday}/${todayAttendances.length || 0}`}
          hint="Absensi tercatat"
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Total payroll"
          value={formatRupiah(payrollTotal)}
          hint="Semua periode"
          icon={Wallet}
        />
        <StatCard
          label="Payroll terkunci"
          value={`${lockedCount}/${payrollRecords.length || 0}`}
          hint="Siap dibayar"
          icon={Lock}
          tone="warning"
        />
      </section>

      <Tabs defaultValue="karyawan">
        <TabsList>
          <TabsTrigger value="karyawan">Karyawan</TabsTrigger>
          <TabsTrigger value="absensi">Absensi Harian</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* ===== TAB KARYAWAN ===== */}
        <TabsContent value="karyawan" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showEmployeeForm ? "secondary" : "default"}
              onClick={() => setShowEmployeeForm(!showEmployeeForm)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {showEmployeeForm ? "Tutup Form" : "Tambah Karyawan"}
            </Button>
            <Button variant="outline" onClick={exportEmployeesPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showEmployeeForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <UserPlus className="h-4 w-4 text-primary" /> Form Tambah Karyawan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddEmployee}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <div className="space-y-1">
                    <Label htmlFor="empName">Nama Lengkap</Label>
                    <Input
                      id="empName"
                      value={newEmployee.fullName}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, fullName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="empPosition">Jabatan</Label>
                    <Input
                      id="empPosition"
                      value={newEmployee.position}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, position: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="empDepartment">Departemen</Label>
                    <Input
                      id="empDepartment"
                      value={newEmployee.department}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, department: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="empType">Tipe Karyawan</Label>
                    <Select
                      value={newEmployee.employmentType}
                      onValueChange={(val) =>
                        setNewEmployee({
                          ...newEmployee,
                          employmentType: (val ?? "Tetap") as "Tetap" | "Daily Worker",
                        })
                      }
                    >
                      <SelectTrigger id="empType">
                        <SelectValue placeholder="Pilih tipe..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tetap">Tetap</SelectItem>
                        <SelectItem value="Daily Worker">Daily Worker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="empPhone">Nomor Telepon</Label>
                    <Input
                      id="empPhone"
                      value={newEmployee.phone}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="empJoinDate">Tanggal Bergabung</Label>
                    <Input
                      id="empJoinDate"
                      type="date"
                      value={newEmployee.joinDate}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, joinDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  {newEmployee.employmentType === "Tetap" ? (
                    <div className="space-y-1">
                      <Label htmlFor="empBaseSalary">Gaji Pokok (per bulan)</Label>
                      <Input
                        id="empBaseSalary"
                        type="number"
                        min="0"
                        value={newEmployee.baseSalary}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            baseSalary: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="empDailyWage">Upah Harian</Label>
                      <Input
                        id="empDailyWage"
                        type="number"
                        min="0"
                        value={newEmployee.dailyWage}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            dailyWage: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                  )}
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Simpan Karyawan</Button>
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
                    <TableHead>Nama</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead className="text-right">Gaji / Upah</TableHead>
                    <TableHead>Bergabung</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.fullName}</TableCell>
                      <TableCell>{e.position}</TableCell>
                      <TableCell className="text-muted-foreground">{e.department}</TableCell>
                      <TableCell>
                        <StatusPill label={e.employmentType} tone={empTypeTone[e.employmentType]} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.phone}</TableCell>
                      <TableCell className="text-right font-medium">
                        {e.employmentType === "Tetap"
                          ? `${formatRupiah(e.baseSalary)}/bln`
                          : `${formatRupiah(e.dailyWage)}/hari`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(e.joinDate)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin hapus karyawan "${e.fullName}"?`)) {
                              deleteEmployee(e.id)
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

        {/* ===== TAB ABSENSI HARIAN ===== */}
        <TabsContent value="absensi" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showAttendanceForm ? "secondary" : "default"}
              onClick={() => setShowAttendanceForm(!showAttendanceForm)}
            >
              <Clock className="mr-2 h-4 w-4" />
              {showAttendanceForm ? "Tutup Form" : "Input Absensi"}
            </Button>
            <Button variant="outline" onClick={exportAttendancePDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showAttendanceForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <CalendarClock className="h-4 w-4 text-primary" /> Form Absensi Harian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAddAttendance}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="attEmployee">Karyawan</Label>
                    <Select
                      value={newAttendance.employeeId}
                      onValueChange={(val) =>
                        setNewAttendance({ ...newAttendance, employeeId: val ?? "" })
                      }
                    >
                      <SelectTrigger id="attEmployee">
                        <SelectValue placeholder="Pilih karyawan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.fullName} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="attStatus">Status</Label>
                    <Select
                      value={newAttendance.status}
                      onValueChange={(val) =>
                        setNewAttendance({
                          ...newAttendance,
                          status: (val ?? "Hadir") as
                            | "Hadir"
                            | "Izin"
                            | "Sakit"
                            | "Alpa"
                            | "Libur",
                        })
                      }
                    >
                      <SelectTrigger id="attStatus">
                        <SelectValue placeholder="Pilih status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hadir">Hadir</SelectItem>
                        <SelectItem value="Izin">Izin</SelectItem>
                        <SelectItem value="Sakit">Sakit</SelectItem>
                        <SelectItem value="Alpa">Alpa</SelectItem>
                        <SelectItem value="Libur">Libur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="attCheckIn">Jam Masuk</Label>
                    <Input
                      id="attCheckIn"
                      type="time"
                      value={newAttendance.checkIn}
                      onChange={(e) =>
                        setNewAttendance({ ...newAttendance, checkIn: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="attCheckOut">Jam Pulang</Label>
                    <Input
                      id="attCheckOut"
                      type="time"
                      value={newAttendance.checkOut}
                      onChange={(e) =>
                        setNewAttendance({ ...newAttendance, checkOut: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="attNotes">Catatan</Label>
                    <Input
                      id="attNotes"
                      value={newAttendance.notes}
                      onChange={(e) =>
                        setNewAttendance({ ...newAttendance, notes: e.target.value })
                      }
                      placeholder="Misal: Telat 15 menit, dll."
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <Button type="submit">Simpan Absensi</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <CalendarClock className="h-4 w-4 text-primary" /> Absensi {formatDate(today)}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Pulang</TableHead>
                    <TableHead>Dicatat oleh</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendances
                    .filter((a) => a.date === today)
                    .map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.employeeName}</TableCell>
                        <TableCell>
                          <StatusPill label={a.status} tone={attendanceTone[a.status]} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.checkIn ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{a.checkOut ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{a.recordedBy}</TableCell>
                        <TableCell className="text-muted-foreground">{a.notes ?? "-"}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Yakin hapus absensi untuk "${a.employeeName}"?`)) {
                                deleteAttendance(a.id)
                              }
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {attendances.filter((a) => a.date === today).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Belum ada absensi untuk hari ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB PAYROLL ===== */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant={showPayrollForm ? "secondary" : "default"}
              onClick={() => setShowPayrollForm(!showPayrollForm)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {showPayrollForm ? "Tutup Form" : "Generate Payroll"}
            </Button>
            <Button variant="outline" onClick={exportPayrollPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {showPayrollForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <FileText className="h-4 w-4 text-primary" /> Generate Payroll Periode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleGeneratePayroll}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                  <div className="space-y-1">
                    <Label htmlFor="payMonth">Bulan</Label>
                    <Select
                      value={payrollPeriodInput.month}
                      onValueChange={(val) =>
                        setPayrollPeriodInput({
                          ...payrollPeriodInput,
                          month: val ?? "1",
                        })
                      }
                    >
                      <SelectTrigger id="payMonth">
                        <SelectValue placeholder="Pilih bulan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Januari",
                          "Februari",
                          "Maret",
                          "April",
                          "Mei",
                          "Juni",
                          "Juli",
                          "Agustus",
                          "September",
                          "Oktober",
                          "November",
                          "Desember",
                        ].map((name, i) => {
                          const val = String(i + 1).padStart(2, "0")
                          return (
                            <SelectItem key={val} value={val}>
                              {name}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="payYear">Tahun</Label>
                    <Input
                      id="payYear"
                      type="number"
                      min="2000"
                      value={payrollPeriodInput.year}
                      onChange={(e) =>
                        setPayrollPeriodInput({
                          ...payrollPeriodInput,
                          year: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      Generate Payroll
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {payrollRecords.length > 0
                  ? `Payroll ${payrollRecords[0].id.split("-")[1]}`
                  : "Payroll"}
              </CardTitle>
              <StatusPill
                label={
                  payrollRecords.length > 0
                    ? `Total ${payrollRecords.length} record`
                    : "Belum ada data"
                }
                tone={payrollRecords.length > 0 ? "info" : "neutral"}
              />
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {payrollRecords.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Belum ada data payroll. Generate payroll terlebih dahulu.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead className="text-right">Hadir</TableHead>
                        <TableHead className="text-right">Absen</TableHead>
                        <TableHead className="text-right">Gaji Pokok</TableHead>
                        <TableHead className="text-right">Tunjangan</TableHead>
                        <TableHead className="text-right">Potongan</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.employeeName}</TableCell>
                          <TableCell className="text-muted-foreground">{r.position}</TableCell>
                          <TableCell className="text-right">{r.presentDays}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {r.absentDays}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatRupiah(r.baseAmount)}
                          </TableCell>
                          <TableCell className="text-right text-chart-1">
                            {formatRupiah(r.allowance)}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatRupiah(r.deduction)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatRupiah(r.total)}
                          </TableCell>
                          <TableCell>
                            <StatusPill label={r.status} tone={payrollTone[r.status]} />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {r.status === "Draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                                  onClick={() => handleVerifyPayroll(r.id, r.employeeName)}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Verifikasi
                                </Button>
                              )}
                              {r.status === "Verified" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-300"
                                  onClick={() => handleLockPayroll(r.id, r.employeeName)}
                                >
                                  <LockIcon className="mr-1 h-3 w-3" />
                                  Kunci
                                </Button>
                              )}
                              {r.status === "Locked" && (
                                <span className="text-xs text-green-600 font-medium">✓ Terkunci</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  if (confirm(`Yakin hapus payroll "${r.employeeName}"?`)) {
                                    deletePayrollRecord(r.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-4">
                    <span className="text-sm text-muted-foreground">Total payroll</span>
                    <span className="font-heading text-xl font-bold text-foreground">
                      {formatRupiah(payrollRecords.reduce((s, r) => s + r.total, 0))}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}