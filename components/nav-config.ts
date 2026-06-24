import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description: string
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Ringkasan operasional",
  },
  {
    title: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    description: "Transaksi & kasir",
  },
  {
    title: "Inventaris",
    href: "/inventory",
    icon: Boxes,
    description: "Stok & bahan baku",
  },
  {
    title: "HR / Payroll",
    href: "/hr",
    icon: Users,
    description: "Karyawan & gaji",
  },
  {
    title: "Servis Alat",
    href: "/equipment",
    icon: Wrench,
    description: "Perawatan peralatan",
  },
]
