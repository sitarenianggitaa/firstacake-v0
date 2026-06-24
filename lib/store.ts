// lib/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ========== TIPE DATA ==========
export interface RawMaterial {
  id: string
  name: string
  unit: string
  price: number
  currentStock: number
  minStock: number
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  currentStock: number
  minStock: number
  recipe: { materialId: string; quantity: number }[]
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
  address: string
}

export interface GoodsReceipt {
  id: string
  supplierId: string
  supplierName: string
  materialId: string
  materialName: string
  quantity: number
  date: string
  receivedBy: string
}

export interface StockMovement {
  id: string
  entityType: string
  entityName: string
  movementType: 'Masuk' | 'Keluar' | 'Penyesuaian'
  quantityChange: number
  stockBefore: number
  stockAfter: number
  performedBy: string
  notes: string
  date: string
}

export interface Transaction {
  id: string
  date: string
  items: { productId: string; productName: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: 'Tunai' | 'Transfer'
  salesChannel: 'Offline' | 'WhatsApp' | 'Instagram' | 'Grab'
  customerName: string
  cashier: string
  shift: 'Pagi' | 'Sore'
  status: 'Paid' | 'Pending' | 'Batal'
}

export interface Employee {
  id: string
  fullName: string
  position: string
  department: string
  employmentType: 'Tetap' | 'Daily Worker'
  phone: string
  baseSalary: number
  dailyWage: number
  joinDate: string
}

export interface Attendance {
  id: string
  employeeId: string
  employeeName: string
  date: string
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'Libur'
  checkIn: string
  checkOut: string
  recordedBy: string
  notes?: string
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  position: string
  presentDays: number
  absentDays: number
  baseAmount: number
  allowance: number
  deduction: number
  total: number
  status: 'Draft' | 'Verified' | 'Locked'
}

export interface Equipment {
  id: string
  name: string
  type: string
  acquisitionYear: number
  condition: 'Baik' | 'Perlu Perhatian' | 'Rusak'
  isActive: boolean
  notes?: string
}

export interface DamageReport {
  id: string
  equipmentId: string
  equipmentName: string
  problem: string
  urgency: 'Rendah' | 'Sedang' | 'Tinggi'
  status: 'Dilaporkan' | 'Diproses' | 'Selesai'
  reportedBy: string
  date: string
}

export interface ServiceRecord {
  id: string
  equipmentId: string
  equipmentName: string
  serviceDate: string
  technician: string
  serviceType: 'Perbaikan' | 'Perawatan'
  description: string
  cost: number
  approvedBy: string
}

export interface MaintenanceSchedule {
  id: string
  equipmentId: string
  equipmentName: string
  scheduleName: string
  frequency: string
  lastPerformedDate: string
  nextDueDate: string
}

// ========== STATE GLOBAL ==========
interface AppState {
  // Data
  rawMaterials: RawMaterial[]
  products: Product[]
  suppliers: Supplier[]
  goodsReceipts: GoodsReceipt[]
  stockMovements: StockMovement[]
  transactions: Transaction[]
  employees: Employee[]
  attendances: Attendance[]
  payrollRecords: PayrollRecord[]
  equipments: Equipment[]
  damageReports: DamageReport[]
  serviceRecords: ServiceRecord[]
  maintenanceSchedules: MaintenanceSchedule[]

  // Sesi kas
  cashSession: {
    isOpen: boolean
    shift: 'Pagi' | 'Sore' | null
    cashierId: string | null
    openingBalance: number
    openedAt: string | null
  }

  // ===== FUNGSI CRUD & MUTASI =====
  // --- Raw Materials ---
  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => void
  updateRawMaterialStock: (id: string, newStock: number) => void
  reduceRawMaterialStock: (id: string, qty: number) => void
  addRawMaterialStock: (id: string, qty: number) => void

  // --- Products ---
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProductStock: (id: string, newStock: number) => void
  reduceProductStock: (id: string, qty: number) => void
  addProductStock: (id: string, qty: number) => void

  // --- Production ---
  recordProduction: (productId: string, quantity: number) => void

  // --- Transactions ---
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void

  // --- Goods Receipt ---
  addGoodsReceipt: (receipt: Omit<GoodsReceipt, 'id'>) => void

  // --- Stock Movement ---
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => void

  // --- Employees ---
  addEmployee: (employee: Omit<Employee, 'id'>) => void

  // --- Attendance ---
  addAttendance: (attendance: Omit<Attendance, 'id'>) => void

  // --- Payroll ---
  generatePayroll: (period: string) => void
  updatePayrollStatus: (id: string, status: 'Draft' | 'Verified' | 'Locked') => void

  // --- Equipment ---
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void
  addDamageReport: (report: Omit<DamageReport, 'id'>) => void
  addServiceRecord: (service: Omit<ServiceRecord, 'id'>) => void
  addMaintenanceSchedule: (schedule: Omit<MaintenanceSchedule, 'id'>) => void

  // --- Cash Session ---
  openCashSession: (shift: 'Pagi' | 'Sore', cashierId: string, openingBalance: number) => void
  closeCashSession: () => void

  // ===== DELETE FUNCTIONS =====
  deleteRawMaterial: (id: string) => void
  deleteProduct: (id: string) => void
  deleteSupplier: (id: string) => void
  deleteGoodsReceipt: (id: string) => void
  deleteStockMovement: (id: string) => void
  deleteTransaction: (id: string) => void
  deleteEmployee: (id: string) => void
  deleteAttendance: (id: string) => void
  deletePayrollRecord: (id: string) => void
  deleteEquipment: (id: string) => void
  deleteDamageReport: (id: string) => void
  deleteServiceRecord: (id: string) => void
  deleteMaintenanceSchedule: (id: string) => void
}

// ========== IMPLEMENTASI STORE ==========
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Data awal
      rawMaterials: [
        { id: 'RM-001', name: 'Tepung Terigu', unit: 'kg', price: 12000, currentStock: 50, minStock: 10 },
        { id: 'RM-002', name: 'Gula Pasir', unit: 'kg', price: 15000, currentStock: 30, minStock: 5 },
        { id: 'RM-003', name: 'Telur', unit: 'butir', price: 2000, currentStock: 100, minStock: 20 },
        { id: 'RM-004', name: 'Mentega', unit: 'kg', price: 45000, currentStock: 15, minStock: 3 },
        { id: 'RM-005', name: 'Susu Cair', unit: 'liter', price: 18000, currentStock: 20, minStock: 5 },
      ],
      products: [
        {
          id: 'P-001',
          name: 'Kue Bolu',
          category: 'Kue',
          price: 50000,
          currentStock: 10,
          minStock: 2,
          recipe: [
            { materialId: 'RM-001', quantity: 0.5 },
            { materialId: 'RM-002', quantity: 0.3 },
            { materialId: 'RM-003', quantity: 3 },
            { materialId: 'RM-004', quantity: 0.2 },
          ]
        },
        {
          id: 'P-002',
          name: 'Roti Tawar',
          category: 'Roti',
          price: 20000,
          currentStock: 15,
          minStock: 3,
          recipe: [
            { materialId: 'RM-001', quantity: 0.8 },
            { materialId: 'RM-002', quantity: 0.1 },
            { materialId: 'RM-003', quantity: 1 },
            { materialId: 'RM-004', quantity: 0.1 },
          ]
        },
        {
          id: 'P-003',
          name: 'Donat',
          category: 'Donat',
          price: 8000,
          currentStock: 20,
          minStock: 5,
          recipe: [
            { materialId: 'RM-001', quantity: 0.3 },
            { materialId: 'RM-002', quantity: 0.1 },
            { materialId: 'RM-003', quantity: 1 },
            { materialId: 'RM-004', quantity: 0.05 },
          ]
        },
      ],
      suppliers: [
        { id: 'SUP-001', name: 'Supplier Tepung Jaya', contactPerson: 'Budi', phone: '08123456789', address: 'Jakarta' },
        { id: 'SUP-002', name: 'Gula Makmur', contactPerson: 'Siti', phone: '08198765432', address: 'Bandung' },
      ],
      goodsReceipts: [],
      stockMovements: [],
      transactions: [
        {
          id: 'TRX-001',
          date: '2026-06-23',
          items: [{ productId: 'P-001', productName: 'Kue Bolu', quantity: 2, price: 50000 }],
          subtotal: 100000,
          tax: 10000,
          total: 110000,
          paymentMethod: 'Tunai',
          salesChannel: 'Offline',
          customerName: 'Umum',
          cashier: 'Aisy',
          shift: 'Pagi',
          status: 'Paid',
        },
      ],
      employees: [
        { id: 'EMP-001', fullName: 'Aisy', position: 'Kasir', department: 'Kasir', employmentType: 'Tetap', phone: '0811111111', baseSalary: 4000000, dailyWage: 0, joinDate: '2024-01-01' },
        { id: 'EMP-002', fullName: 'Cecil', position: 'Kepala Kasir', department: 'Kasir', employmentType: 'Tetap', phone: '0812222222', baseSalary: 5000000, dailyWage: 0, joinDate: '2023-06-01' },
        { id: 'EMP-003', fullName: 'Dina', position: 'Kepala Produksi', department: 'Produksi', employmentType: 'Tetap', phone: '0813333333', baseSalary: 5500000, dailyWage: 0, joinDate: '2023-01-01' },
        { id: 'EMP-004', fullName: 'Rachel', position: 'Tim Produksi', department: 'Produksi', employmentType: 'Daily Worker', phone: '0814444444', baseSalary: 0, dailyWage: 100000, joinDate: '2024-02-01' },
        { id: 'EMP-005', fullName: 'Sita', position: 'Admin/Finance', department: 'Finance', employmentType: 'Tetap', phone: '0815555555', baseSalary: 4500000, dailyWage: 0, joinDate: '2023-07-01' },
      ],
      attendances: [
        { id: 'ATT-001', employeeId: 'EMP-001', employeeName: 'Aisy', date: '2026-06-23', status: 'Hadir', checkIn: '08:00', checkOut: '16:00', recordedBy: 'Sistem' },
        { id: 'ATT-002', employeeId: 'EMP-002', employeeName: 'Cecil', date: '2026-06-23', status: 'Hadir', checkIn: '07:30', checkOut: '15:30', recordedBy: 'Sistem' },
        { id: 'ATT-003', employeeId: 'EMP-003', employeeName: 'Dina', date: '2026-06-23', status: 'Hadir', checkIn: '08:00', checkOut: '16:00', recordedBy: 'Sistem' },
        { id: 'ATT-004', employeeId: 'EMP-004', employeeName: 'Rachel', date: '2026-06-23', status: 'Izin', checkIn: '-', checkOut: '-', recordedBy: 'Sistem', notes: 'Sakit' },
        { id: 'ATT-005', employeeId: 'EMP-005', employeeName: 'Sita', date: '2026-06-23', status: 'Hadir', checkIn: '08:30', checkOut: '16:30', recordedBy: 'Sistem' },
      ],
      payrollRecords: [],
      equipments: [
        { id: 'EQ-001', name: 'Oven Listrik', type: 'Oven', acquisitionYear: 2021, condition: 'Baik', isActive: true },
        { id: 'EQ-002', name: 'Mixer Planetary', type: 'Mixer', acquisitionYear: 2022, condition: 'Perlu Perhatian', isActive: true, notes: 'Suara berisik' },
      ],
      damageReports: [
        { id: 'DR-001', equipmentId: 'EQ-002', equipmentName: 'Mixer Planetary', problem: 'Suara berisik saat berputar', urgency: 'Sedang', status: 'Dilaporkan', reportedBy: 'Dina', date: '2026-06-20' },
      ],
      serviceRecords: [],
      maintenanceSchedules: [
        { id: 'MS-001', equipmentId: 'EQ-001', equipmentName: 'Oven Listrik', scheduleName: 'Pembersihan rutin', frequency: 'Setiap 3 bulan', lastPerformedDate: '2026-03-15', nextDueDate: '2026-06-15' },
        { id: 'MS-002', equipmentId: 'EQ-002', equipmentName: 'Mixer Planetary', scheduleName: 'Servis berkala', frequency: 'Setiap 6 bulan', lastPerformedDate: '2026-01-10', nextDueDate: '2026-07-10' },
      ],

      cashSession: {
        isOpen: false,
        shift: null,
        cashierId: null,
        openingBalance: 0,
        openedAt: null,
      },

      // ===== IMPLEMENTASI FUNGSI =====

      addRawMaterial: (material) => {
        const newId = `RM-${String(get().rawMaterials.length + 1).padStart(3, '0')}`
        set((state) => ({
          rawMaterials: [...state.rawMaterials, { ...material, id: newId }],
        }))
      },

      updateRawMaterialStock: (id, newStock) => {
        set((state) => ({
          rawMaterials: state.rawMaterials.map((m) =>
            m.id === id ? { ...m, currentStock: Math.max(0, newStock) } : m
          ),
        }))
      },

      reduceRawMaterialStock: (id, qty) => {
        set((state) => ({
          rawMaterials: state.rawMaterials.map((m) =>
            m.id === id ? { ...m, currentStock: Math.max(0, m.currentStock - qty) } : m
          ),
        }))
      },

      addRawMaterialStock: (id, qty) => {
        const material = get().rawMaterials.find(m => m.id === id)
        if (material) {
          get().updateRawMaterialStock(id, material.currentStock + qty)
        }
      },

      addProduct: (product) => {
        const newId = `P-${String(get().products.length + 1).padStart(3, '0')}`
        set((state) => ({
          products: [...state.products, { ...product, id: newId }],
        }))
      },

      updateProductStock: (id, newStock) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, currentStock: Math.max(0, newStock) } : p
          ),
        }))
      },

      reduceProductStock: (id, qty) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, currentStock: Math.max(0, p.currentStock - qty) } : p
          ),
        }))
      },

      addProductStock: (id, qty) => {
        const product = get().products.find(p => p.id === id)
        if (product) {
          get().updateProductStock(id, product.currentStock + qty)
        }
      },

      recordProduction: (productId, quantity) => {
        const product = get().products.find((p) => p.id === productId)
        if (!product || !product.recipe) {
          alert('Produk tidak ditemukan atau tidak memiliki resep!')
          return
        }

        const insufficient = product.recipe.some((item) => {
          const material = get().rawMaterials.find((m) => m.id === item.materialId)
          return !material || material.currentStock < item.quantity * quantity
        })
        if (insufficient) {
          alert('Stok bahan baku tidak cukup!')
          return
        }

        product.recipe.forEach((item) => {
          get().reduceRawMaterialStock(item.materialId, item.quantity * quantity)
        })

        get().addProductStock(productId, quantity)
        alert(`Produksi ${product.name} sebanyak ${quantity} berhasil!`)
      },

      addTransaction: (transaction) => {
        const newId = `TRX-${Date.now()}`
        set((state) => ({
          transactions: [...state.transactions, { ...transaction, id: newId }],
        }))
        transaction.items.forEach((item) => {
          get().reduceProductStock(item.productId, item.quantity)
        })
      },

      addGoodsReceipt: (receipt) => {
        const newId = `GR-${Date.now()}`
        set((state) => ({
          goodsReceipts: [...state.goodsReceipts, { ...receipt, id: newId }],
        }))
        const material = get().rawMaterials.find(m => m.id === receipt.materialId)
        if (material) {
          get().addRawMaterialStock(receipt.materialId, receipt.quantity)
          get().addStockMovement({
            entityType: 'Bahan Baku',
            entityName: receipt.materialName,
            movementType: 'Masuk',
            quantityChange: receipt.quantity,
            stockBefore: material.currentStock,
            stockAfter: material.currentStock + receipt.quantity,
            performedBy: receipt.receivedBy,
            notes: `Penerimaan dari ${receipt.supplierName}`,
            date: receipt.date,
          })
        }
      },

      addStockMovement: (movement) => {
        const newId = `SM-${Date.now()}`
        set((state) => ({
          stockMovements: [...state.stockMovements, { ...movement, id: newId }],
        }))
      },

      addEmployee: (employee) => {
        const newId = `EMP-${String(get().employees.length + 1).padStart(3, '0')}`
        set((state) => ({
          employees: [...state.employees, { ...employee, id: newId }],
        }))
      },

      addAttendance: (attendance) => {
        const newId = `ATT-${Date.now()}`
        set((state) => ({
          attendances: [...state.attendances, { ...attendance, id: newId }],
        }))
      },

      generatePayroll: (period) => {
        const employees = get().employees
        const attendances = get().attendances.filter((a) => a.date.startsWith(period))
        const records: PayrollRecord[] = employees.map((emp) => {
          const present = attendances.filter((a) => a.employeeId === emp.id && a.status === 'Hadir').length
          const absent = attendances.filter((a) => a.employeeId === emp.id && a.status !== 'Hadir').length
          const baseAmount = emp.employmentType === 'Tetap' ? emp.baseSalary : emp.dailyWage * present
          const allowance = Math.round(baseAmount * 0.05)
          const deduction = Math.round(baseAmount * 0.02 * absent)
          const total = baseAmount + allowance - deduction
          return {
            id: `PAY-${Date.now()}-${emp.id}`,
            employeeId: emp.id,
            employeeName: emp.fullName,
            position: emp.position,
            presentDays: present,
            absentDays: absent,
            baseAmount,
            allowance,
            deduction,
            total,
            status: 'Draft' as const,
          }
        })
        set((state) => ({
          payrollRecords: [...state.payrollRecords, ...records],
        }))
        alert(`Payroll periode ${period} berhasil digenerate!`)
      },

      updatePayrollStatus: (id, status) => {
        set((state) => ({
          payrollRecords: state.payrollRecords.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }))
      },

      addEquipment: (equipment) => {
        const newId = `EQ-${String(get().equipments.length + 1).padStart(3, '0')}`
        set((state) => ({
          equipments: [...state.equipments, { ...equipment, id: newId }],
        }))
      },

      addDamageReport: (report) => {
        const newId = `DR-${Date.now()}`
        set((state) => ({
          damageReports: [...state.damageReports, { ...report, id: newId, status: 'Dilaporkan' }],
        }))
      },

      addServiceRecord: (service) => {
        const newId = `SR-${Date.now()}`
        set((state) => ({
          serviceRecords: [...state.serviceRecords, { ...service, id: newId }],
        }))
      },

      addMaintenanceSchedule: (schedule) => {
        const newId = `MS-${Date.now()}`
        set((state) => ({
          maintenanceSchedules: [...state.maintenanceSchedules, { ...schedule, id: newId }],
        }))
      },

      openCashSession: (shift, cashierId, openingBalance) => {
        set({
          cashSession: {
            isOpen: true,
            shift,
            cashierId,
            openingBalance,
            openedAt: new Date().toLocaleTimeString(),
          },
        })
      },

      closeCashSession: () => {
        set({
          cashSession: {
            isOpen: false,
            shift: null,
            cashierId: null,
            openingBalance: 0,
            openedAt: null,
          },
        })
      },

      // ===== DELETE FUNCTIONS =====
      deleteRawMaterial: (id) => {
        set((state) => ({
          rawMaterials: state.rawMaterials.filter((m) => m.id !== id),
        }))
      },
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }))
      },
      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }))
      },
      deleteGoodsReceipt: (id) => {
        set((state) => ({
          goodsReceipts: state.goodsReceipts.filter((g) => g.id !== id),
        }))
      },
      deleteStockMovement: (id) => {
        set((state) => ({
          stockMovements: state.stockMovements.filter((s) => s.id !== id),
        }))
      },
      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }))
      },
      deleteEmployee: (id) => {
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        }))
      },
      deleteAttendance: (id) => {
        set((state) => ({
          attendances: state.attendances.filter((a) => a.id !== id),
        }))
      },
      deletePayrollRecord: (id) => {
        set((state) => ({
          payrollRecords: state.payrollRecords.filter((p) => p.id !== id),
        }))
      },
      deleteEquipment: (id) => {
        set((state) => ({
          equipments: state.equipments.filter((e) => e.id !== id),
        }))
      },
      deleteDamageReport: (id) => {
        set((state) => ({
          damageReports: state.damageReports.filter((d) => d.id !== id),
        }))
      },
      deleteServiceRecord: (id) => {
        set((state) => ({
          serviceRecords: state.serviceRecords.filter((s) => s.id !== id),
        }))
      },
      deleteMaintenanceSchedule: (id) => {
        set((state) => ({
          maintenanceSchedules: state.maintenanceSchedules.filter((m) => m.id !== id),
        }))
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        rawMaterials: state.rawMaterials,
        products: state.products,
        suppliers: state.suppliers,
        goodsReceipts: state.goodsReceipts,
        stockMovements: state.stockMovements,
        transactions: state.transactions,
        employees: state.employees,
        attendances: state.attendances,
        payrollRecords: state.payrollRecords,
        equipments: state.equipments,
        damageReports: state.damageReports,
        serviceRecords: state.serviceRecords,
        maintenanceSchedules: state.maintenanceSchedules,
        cashSession: state.cashSession,
      }),
    }
  )
)