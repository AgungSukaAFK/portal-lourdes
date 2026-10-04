import {
  BadgeHelp,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ChartColumn,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  HardHat,
  Megaphone,
  Package,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/data/constants";

export const ICONS: Record<IconName, LucideIcon> = {
  globe: Globe,
  "clipboard-check": ClipboardCheck,
  "hard-hat": HardHat,
  package: Package,
  briefcase: Briefcase,
  building: Building2,
  help: BadgeHelp,
  cart: ShoppingCart,
  book: BookOpen,
  users: Users,
  wrench: Wrench,
  truck: Truck,
  wallet: Wallet,
  chart: ChartColumn,
  shield: Shield,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  megaphone: Megaphone,
  zap: Zap,
  calendar: Calendar,
};

/** Ikon berdasarkan nama ikon (tidak bergantung pada konten, aman dipakai di admin) */
export function NamedIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = ICONS[name] ?? Globe;
  return <Icon className={className} aria-hidden />;
}
