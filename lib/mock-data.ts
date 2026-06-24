// Mock data for Firsta Cake operational system.
// Modeled after the project ERD: POS, Inventory, HR/Payroll, Equipment Maintenance.

export const CURRENCY = "IDR"

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

/* ----------------------------- POS / Products ----------------------------- */

export type ProductCategory = "Tart" | "Mille Crepe" | "Bento" | "Pudding" | "Brownies"

export interface Product {
  id: string
  name: string
  category: ProductCategory
  sellingPrice: number
  currentStock: number
  minStock: number
  isActive: boolean
}

export const products: Product[] = [
  { id: "PRD-001", name: "Tart Coklat Premium", category: "Tart", sellingPrice: 185000, currentStock: 12, minStock: 5, isActive: true },
  { id: "PRD-002", name: "Tart Keju Klasik", category: "Tart", sellingPrice: 195000, currentStock: 8, minStock: 5, isActive: true },
  { id: "PRD-003", name: "Mille Crepe Coklat", category: "Mille Crepe", sellingPrice: 165000, currentStock: 6, minStock: 4, isActive: true },
  { id: "PRD-004", name: "Mille Crepe Taro", category: "Mille Crepe", sellingPrice: 170000, currentStock: 3, minStock: 4, isActive: true },
  { id: "PRD-005", name: "Bento Cake Ultah", category: "Bento", sellingPrice: 65000, currentStock: 20, minStock: 8, isActive: true },
  { id: "PRD-006", name: "Bento Cake Couple", category: "Bento", sellingPrice: 70000, currentStock: 14, minStock: 8, isActive: true },
  { id: "PRD-007", name: "Pudding Coklat Cup", category: "Pudding", sellingPrice: 25000, currentStock: 40, minStock: 15, isActive: true },
  { id: "PRD-008", name: "Pudding Mangga Cup", category: "Pudding", sellingPrice: 25000, currentStock: 2, minStock: 15, isActive: true },
  { id: "PRD-009", name: "Brownies Fudgy Loaf", category: "Brownies", sellingPrice: 55000, currentStock: 18, minStock: 10, isActive: true },
  { id: "PRD-010", name: "Brownies Kacang Box", category: "Brownies", sellingPrice: 60000, currentStock: 0, minStock: 10, isActive: true },
]

export type OrderChannel = "Offline" | "WhatsApp" | "Instagram" | "Grab"
export type PaymentMethod = "Tunai" | "Transfer"
export type TransactionStatus = "Paid" | "Pending" | "Void"

export interface TransactionItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Transaction {
  id: string
  date: string
  channel: OrderChannel
  paymentMethod: PaymentMethod
  cashier: string
  items: TransactionItem[]
  subtotal: number
  amountPaid: number
  change: number
  status: TransactionStatus
}

export const transactions: Transaction[] = [
  {
    id: "TRX-20260623-001",
    date: "2026-06-23T08:42:00",
    channel: "Offline",
    paymentMethod: "Tunai",
    cashier: "Aisy",
    items: [
      { productId: "PRD-001", productName: "Tart Coklat Premium", quantity: 1, unitPrice: 185000 },
      { productId: "PRD-007", productName: "Pudding Coklat Cup", quantity: 2, unitPrice: 25000 },
    ],
    subtotal: 235000,
    amountPaid: 250000,
    change: 15000,
    status: "Paid",
  },
  {
    id: "TRX-20260623-002",
    date: "2026-06-23T09:15:00",
    channel: "WhatsApp",
    paymentMethod: "Transfer",
    cashier: "Aisy",
    items: [{ productId: "PRD-005", productName: "Bento Cake Ultah", quantity: 3, unitPrice: 65000 }],
    subtotal: 195000,
    amountPaid: 195000,
    change: 0,
    status: "Paid",
  },
  {
    id: "TRX-20260623-003",
    date: "2026-06-23T10:03:00",
    channel: "Grab",
    paymentMethod: "Transfer",
    cashier: "Cecil",
    items: [
      { productId: "PRD-009", productName: "Brownies Fudgy Loaf", quantity: 2, unitPrice: 55000 },
      { productId: "PRD-003", productName: "Mille Crepe Coklat", quantity: 1, unitPrice: 165000 },
    ],
    subtotal: 275000,
    amountPaid: 275000,
    change: 0,
    status: "Paid",
  },
  {
    id: "TRX-20260623-004",
    date: "2026-06-23T11:20:00",
    channel: "Instagram",
    paymentMethod: "Transfer",
    cashier: "Cecil",
    items: [{ productId: "PRD-002", productName: "Tart Keju Klasik", quantity: 1, unitPrice: 195000 }],
    subtotal: 195000,
    amountPaid: 195000,
    change: 0,
    status: "Pending",
  },
  {
    id: "TRX-20260622-018",
    date: "2026-06-22T16:48:00",
    channel: "Offline",
    paymentMethod: "Tunai",
    cashier: "Aisy",
    items: [{ productId: "PRD-007", productName: "Pudding Coklat Cup", quantity: 5, unitPrice: 25000 }],
    subtotal: 125000,
    amountPaid: 150000,
    change: 25000,
    status: "Paid",
  },
]

export interface CashSession {
  id: string
  openedBy: string
  openedAt: string
  closedBy?: string
  closedAt?: string
  openingBalance: number
  closingBalance?: number
  status: "Open" | "Closed"
}

export const currentCashSession: CashSession = {
  id: "CSH-20260623",
  openedBy: "Kepala Kasir — Cecil",
  openedAt: "2026-06-23T08:00:00",
  openingBalance: 500000,
  status: "Open",
}

/* ------------------------------- Inventory -------------------------------- */

export interface RawMaterial {
  id: string
  name: string
  unit: string
  currentStock: number
  minStock: number
  isActive: boolean
}

export const rawMaterials: RawMaterial[] = [
  { id: "MAT-001", name: "Tepung Terigu Protein Tinggi", unit: "kg", currentStock: 45, minStock: 20, isActive: true },
  { id: "MAT-002", name: "Gula Pasir Halus", unit: "kg", currentStock: 30, minStock: 15, isActive: true },
  { id: "MAT-003", name: "Mentega Tawar", unit: "kg", currentStock: 8, minStock: 10, isActive: true },
  { id: "MAT-004", name: "Coklat Couverture", unit: "kg", currentStock: 12, minStock: 8, isActive: true },
  { id: "MAT-005", name: "Telur Ayam", unit: "kg", currentStock: 25, minStock: 15, isActive: true },
  { id: "MAT-006", name: "Cream Cheese", unit: "kg", currentStock: 4, minStock: 6, isActive: true },
  { id: "MAT-007", name: "Whipping Cream", unit: "liter", currentStock: 18, minStock: 10, isActive: true },
  { id: "MAT-008", name: "Susu UHT Full Cream", unit: "liter", currentStock: 22, minStock: 12, isActive: true },
]

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
  address: string
}

export const suppliers: Supplier[] = [
  { id: "SUP-001", name: "Toko Bahan Kue Makmur", contactPerson: "Pak Hadi", phone: "0812-3456-7890", address: "Jl. Pasar Baru No. 12" },
  { id: "SUP-002", name: "CV Dairy Sejahtera", contactPerson: "Bu Lina", phone: "0813-9988-7766", address: "Jl. Industri Blok C5" },
  { id: "SUP-003", name: "Sumber Coklat Nusantara", contactPerson: "Pak Yusuf", phone: "0856-1122-3344", address: "Jl. Cokelat Raya No. 8" },
]

export interface GoodsReceipt {
  id: string
  supplier: string
  receivedBy: string
  date: string
  itemCount: number
  notes: string
}

export const goodsReceipts: GoodsReceipt[] = [
  { id: "GR-20260622-01", supplier: "Toko Bahan Kue Makmur", receivedBy: "Dina (Kepala Produksi)", date: "2026-06-22T07:30:00", itemCount: 3, notes: "Tepung & gula stok mingguan" },
  { id: "GR-20260621-02", supplier: "CV Dairy Sejahtera", receivedBy: "Dina (Kepala Produksi)", date: "2026-06-21T08:10:00", itemCount: 2, notes: "Cream cheese & whipping cream" },
  { id: "GR-20260620-01", supplier: "Sumber Coklat Nusantara", receivedBy: "Dina (Kepala Produksi)", date: "2026-06-20T09:00:00", itemCount: 1, notes: "Coklat couverture" },
]

export interface StockMovement {
  id: string
  entityType: "Bahan Baku" | "Produk Jadi"
  entityName: string
  movementType: "Masuk" | "Keluar" | "Penyesuaian"
  quantityChange: number
  stockBefore: number
  stockAfter: number
  performedBy: string
  date: string
  notes: string
}

export const stockMovements: StockMovement[] = [
  { id: "MV-0001", entityType: "Produk Jadi", entityName: "Tart Coklat Premium", movementType: "Keluar", quantityChange: -1, stockBefore: 13, stockAfter: 12, performedBy: "Sistem POS", date: "2026-06-23T08:42:00", notes: "Penjualan TRX-20260623-001" },
  { id: "MV-0002", entityType: "Bahan Baku", entityName: "Coklat Couverture", movementType: "Keluar", quantityChange: -2, stockBefore: 14, stockAfter: 12, performedBy: "Dina (Kepala Produksi)", date: "2026-06-23T06:30:00", notes: "Produksi harian tart" },
  { id: "MV-0003", entityType: "Bahan Baku", entityName: "Tepung Terigu Protein Tinggi", movementType: "Masuk", quantityChange: 25, stockBefore: 20, stockAfter: 45, performedBy: "Dina (Kepala Produksi)", date: "2026-06-22T07:30:00", notes: "Penerimaan GR-20260622-01" },
  { id: "MV-0004", entityType: "Produk Jadi", entityName: "Bento Cake Ultah", movementType: "Masuk", quantityChange: 10, stockBefore: 10, stockAfter: 20, performedBy: "Tim Produksi", date: "2026-06-23T07:00:00", notes: "Transfer dapur ke toko" },
  { id: "MV-0005", entityType: "Produk Jadi", entityName: "Pudding Mangga Cup", movementType: "Keluar", quantityChange: -13, stockBefore: 15, stockAfter: 2, performedBy: "Sistem POS", date: "2026-06-22T17:00:00", notes: "Akumulasi penjualan harian" },
]

/* ------------------------------ HR / Payroll ------------------------------ */

export type EmploymentType = "Tetap" | "Daily Worker"

export interface Employee {
  id: string
  fullName: string
  position: string
  department: "Kasir" | "Produksi" | "Admin/Finance"
  phone: string
  employmentType: EmploymentType
  baseSalary: number
  dailyWage: number
  joinDate: string
  isActive: boolean
}

export const employees: Employee[] = [
  // Kasir
  { id: "EMP-001", fullName: "Aisy", position: "Kasir", department: "Kasir", phone: "0811-1111-2222", employmentType: "Tetap", baseSalary: 3200000, dailyWage: 0, joinDate: "2024-01-01", isActive: true },
  { id: "EMP-002", fullName: "Cecil", position: "Kepala Kasir", department: "Kasir", phone: "0812-2222-3333", employmentType: "Tetap", baseSalary: 4200000, dailyWage: 0, joinDate: "2023-06-01", isActive: true },
  // Produksi
  { id: "EMP-003", fullName: "Dina", position: "Kepala Produksi", department: "Produksi", phone: "0813-3333-4444", employmentType: "Tetap", baseSalary: 4500000, dailyWage: 0, joinDate: "2023-01-01", isActive: true },
  { id: "EMP-004", fullName: "Rachel", position: "Tim Produksi", department: "Produksi", phone: "0814-4444-5555", employmentType: "Daily Worker", baseSalary: 0, dailyWage: 135000, joinDate: "2024-02-01", isActive: true },
  // Admin/HR
  { id: "EMP-005", fullName: "Sita", position: "Admin / HR", department: "Admin/Finance", phone: "0815-5555-6666", employmentType: "Tetap", baseSalary: 4000000, dailyWage: 0, joinDate: "2023-03-12", isActive: true },
]

export type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpa" | "Libur"

export interface Attendance {
  id: string
  employeeName: string
  date: string
  status: AttendanceStatus
  checkIn?: string
  checkOut?: string
  recordedBy: string
  notes?: string
}

export const attendances: Attendance[] = [
  { id: "ATT-001", employeeName: "Aisy", date: "2026-06-23", status: "Hadir", checkIn: "07:50", checkOut: "16:05", recordedBy: "Cecil (Kepala Kasir)" },
  { id: "ATT-002", employeeName: "Cecil", date: "2026-06-23", status: "Hadir", checkIn: "07:45", checkOut: "16:10", recordedBy: "Cecil (Kepala Kasir)" },
  { id: "ATT-003", employeeName: "Dina", date: "2026-06-23", status: "Hadir", checkIn: "06:00", checkOut: "14:30", recordedBy: "Dina (Kepala Produksi)" },
  { id: "ATT-004", employeeName: "Rachel", date: "2026-06-23", status: "Sakit", recordedBy: "Dina (Kepala Produksi)", notes: "Surat dokter diterima" },
  { id: "ATT-005", employeeName: "Sita", date: "2026-06-23", status: "Hadir", checkIn: "08:00", checkOut: "16:00", recordedBy: "Sita" },
]

export type PayrollStatus = "Draft" | "Verified" | "Locked"

export interface PayrollRecord {
  id: string
  employeeName: string
  position: string
  presentDays: number
  absentDays: number
  baseAmount: number
  allowance: number
  deduction: number
  total: number
  status: PayrollStatus
}

export interface PayrollPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  status: "Open" | "Locked"
  records: PayrollRecord[]
}

export const payrollPeriod: PayrollPeriod = {
  id: "PRD-2026-05",
  name: "Periode Mei 2026",
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  status: "Open",
  records: [
    { id: "PR-001", employeeName: "Cecil", position: "Kepala Kasir", presentDays: 25, absentDays: 1, baseAmount: 4200000, allowance: 500000, deduction: 0, total: 4700000, status: "Verified" },
    { id: "PR-002", employeeName: "Aisy", position: "Kasir", presentDays: 24, absentDays: 2, baseAmount: 3200000, allowance: 300000, deduction: 100000, total: 3400000, status: "Verified" },
    { id: "PR-003", employeeName: "Dina", position: "Kepala Produksi", presentDays: 26, absentDays: 0, baseAmount: 4500000, allowance: 600000, deduction: 0, total: 5100000, status: "Locked" },
    { id: "PR-004", employeeName: "Rachel", position: "Tim Produksi (Daily)", presentDays: 25, absentDays: 1, baseAmount: 3375000, allowance: 0, deduction: 0, total: 3375000, status: "Draft" },
    { id: "PR-005", employeeName: "Sita", position: "Admin / HR", presentDays: 26, absentDays: 0, baseAmount: 4000000, allowance: 400000, deduction: 0, total: 4400000, status: "Verified" },
  ],
}

/* -------------------------- Equipment Maintenance ------------------------- */

export type EquipmentCondition = "Baik" | "Perlu Perhatian" | "Rusak"

export interface Equipment {
  id: string
  name: string
  type: string
  acquisitionYear: number
  condition: EquipmentCondition
  isActive: boolean
  notes: string
}

export const equipments: Equipment[] = [
  { id: "EQP-001", name: "Oven Deck Gas 3 Layer", type: "Oven", acquisitionYear: 2022, condition: "Baik", isActive: true, notes: "Unit utama produksi tart" },
  { id: "EQP-002", name: "Mixer Spiral 20L", type: "Mixer", acquisitionYear: 2021, condition: "Perlu Perhatian", isActive: true, notes: "Suara bising saat kecepatan tinggi" },
  { id: "EQP-003", name: "Mixer Planetary 10L", type: "Mixer", acquisitionYear: 2023, condition: "Baik", isActive: true, notes: "" },
  { id: "EQP-004", name: "Chiller Display 2 Pintu", type: "Pendingin", acquisitionYear: 2020, condition: "Rusak", isActive: false, notes: "Kompresor mati, menunggu servis" },
  { id: "EQP-005", name: "Loyang Tart Set", type: "Peralatan", acquisitionYear: 2024, condition: "Baik", isActive: true, notes: "" },
  { id: "EQP-006", name: "Proofer Dough", type: "Proofer", acquisitionYear: 2023, condition: "Baik", isActive: true, notes: "" },
]

export type UrgencyLevel = "Rendah" | "Sedang" | "Tinggi"
export type DamageStatus = "Dilaporkan" | "Diproses" | "Selesai"

export interface DamageReport {
  id: string
  equipmentName: string
  reportedBy: string
  date: string
  problem: string
  urgency: UrgencyLevel
  status: DamageStatus
}

export const damageReports: DamageReport[] = [
  { id: "DR-001", equipmentName: "Chiller Display 2 Pintu", reportedBy: "Rachel (Tim Produksi)", date: "2026-06-18", problem: "Chiller tidak dingin, kompresor tidak menyala", urgency: "Tinggi", status: "Diproses" },
  { id: "DR-002", equipmentName: "Mixer Spiral 20L", reportedBy: "Rachel (Tim Produksi)", date: "2026-06-20", problem: "Suara bising & getaran berlebih saat speed 3", urgency: "Sedang", status: "Dilaporkan" },
  { id: "DR-003", equipmentName: "Oven Deck Gas 3 Layer", reportedBy: "Dina (Kepala Produksi)", date: "2026-06-10", problem: "Pemanas deck bawah kurang stabil", urgency: "Rendah", status: "Selesai" },
]

export interface ServiceRecord {
  id: string
  equipmentName: string
  serviceDate: string
  technician: string
  description: string
  cost: number
  serviceType: "Perbaikan" | "Perawatan Rutin"
  recordedBy: string
  approvedBy: string
}

export const serviceRecords: ServiceRecord[] = [
  { id: "SVC-001", equipmentName: "Oven Deck Gas 3 Layer", serviceDate: "2026-06-12", technician: "CV Teknik Oven Jaya", description: "Kalibrasi thermostat & ganti elemen pemanas bawah", cost: 750000, serviceType: "Perbaikan", recordedBy: "Dina (Kepala Produksi)", approvedBy: "Owner" },
  { id: "SVC-002", equipmentName: "Mixer Planetary 10L", serviceDate: "2026-05-28", technician: "Pak Andi (Teknisi)", description: "Pelumasan gearbox & pengecekan rutin", cost: 150000, serviceType: "Perawatan Rutin", recordedBy: "Dina (Kepala Produksi)", approvedBy: "Owner" },
  { id: "SVC-003", equipmentName: "Proofer Dough", serviceDate: "2026-05-15", technician: "Pak Andi (Teknisi)", description: "Pembersihan & pengecekan elemen kelembaban", cost: 120000, serviceType: "Perawatan Rutin", recordedBy: "Dina (Kepala Produksi)", approvedBy: "Owner" },
]

export interface MaintenanceSchedule {
  id: string
  equipmentName: string
  scheduleName: string
  frequency: string
  nextDueDate: string
  lastPerformedDate: string
  isActive: boolean
}

export const maintenanceSchedules: MaintenanceSchedule[] = [
  { id: "MS-001", equipmentName: "Oven Deck Gas 3 Layer", scheduleName: "Kalibrasi & Pembersihan", frequency: "Bulanan", nextDueDate: "2026-06-26", lastPerformedDate: "2026-05-26", isActive: true },
  { id: "MS-002", equipmentName: "Mixer Spiral 20L", scheduleName: "Pelumasan Gearbox", frequency: "Bulanan", nextDueDate: "2026-06-25", lastPerformedDate: "2026-05-25", isActive: true },
  { id: "MS-003", equipmentName: "Mixer Planetary 10L", scheduleName: "Pengecekan Rutin", frequency: "Bulanan", nextDueDate: "2026-06-28", lastPerformedDate: "2026-05-28", isActive: true },
  { id: "MS-004", equipmentName: "Proofer Dough", scheduleName: "Pembersihan Elemen", frequency: "Triwulan", nextDueDate: "2026-08-15", lastPerformedDate: "2026-05-15", isActive: true },
]