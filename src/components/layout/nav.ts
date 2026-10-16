import {
  BookOpen,
  Database,
  FileText,
  FolderOpen,
  HeartPulse,
  History,
  Map as MapIcon,
  Scale,
  Settings,
  Sparkles,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  title: string;
  icon: LucideIcon;
  mobile?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Map", title: "Map workspace", icon: MapIcon, mobile: true },
  { to: "/analysis", label: "Areas", title: "Saved areas", icon: FolderOpen, mobile: true },
  { to: "/change-detection", label: "Change", title: "Imagery change", icon: History },
  { to: "/livability", label: "Livability", title: "Livability index", icon: HeartPulse },
  { to: "/planning", label: "Suitability", title: "Development suitability", icon: Scale },
  { to: "/ai-copilot", label: "Copilot", title: "Planning copilot", icon: Sparkles, mobile: true },
  { to: "/reports", label: "Report", title: "Planning report", icon: FileText, mobile: true },
  { to: "/ingest", label: "Import", title: "Import boundary or imagery", icon: Upload },
];

export const SECONDARY_NAV: NavItem[] = [
  { to: "/data", label: "Data", title: "Data sources", icon: Database },
  { to: "/settings", label: "Settings", title: "Settings", icon: Settings },
  { to: "/help", label: "Method", title: "Methodology", icon: BookOpen },
];

export const isActive = (pathname: string, to: string) =>
  to === "/" ? pathname === "/" : pathname.startsWith(to);
