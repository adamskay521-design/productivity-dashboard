"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  FileText,
  Timer,
  CalendarDays,
  Scissors,
  BookOpen,
  Dumbbell,
  Star,
  Package,
  BookMarked,
  DollarSign,
  Archive,
  Wrench,
  CalendarCheck,
  Clapperboard,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/",               label: "Dashboard",         icon: LayoutDashboard },
  { href: "/tasks",          label: "Tasks",              icon: CheckSquare },
  { href: "/habits",         label: "Habits",             icon: Target },
  { href: "/journal",        label: "Journal",            icon: BookMarked },
  { href: "/calendar",       label: "Calendar",           icon: CalendarDays },
  { href: "/fitness",        label: "Fitness",            icon: Dumbbell },
  { href: "/yoga",           label: "Yoga & Mobility",    icon: Sparkles },
  { href: "/goals",          label: "Goals",              icon: Star },
  { href: "/monthly-review", label: "Monthly Review",     icon: CalendarCheck },
  { href: "/budget",         label: "Budget",             icon: DollarSign },
  { href: "/declutter",   label: "Declutter",          icon: Package },
  { href: "/reading",     label: "Reading",            icon: BookOpen },
  { href: "/watchlist",   label: "Watchlist",          icon: Clapperboard },
  { href: "/crochet",     label: "Crochet & Knitting", icon: Scissors },
  { href: "/yarn-stash",  label: "Yarn Stash",         icon: Archive },
  { href: "/tools",       label: "Tools",              icon: Wrench },
  { href: "/notes",       label: "Notes",              icon: FileText },
  { href: "/focus",       label: "Focus Timer",        icon: Timer },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-screen overflow-hidden bg-cream-50 border-r border-cream-200">

      {/* Logo */}
      <div className="px-6 pt-8 pb-5">
        <p className="text-[9px] font-semibold tracking-[0.3em] text-nude-500 uppercase mb-2.5">Personal</p>
        <p className="font-serif text-xl text-stone-900 leading-none tracking-wide">Focus Flow</p>
      </div>

      {/* Divider */}
      <div className="mx-6 mb-4 h-px bg-cream-200" />

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin space-y-0.5 pb-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
                active
                  ? "text-nude-700 bg-nude-100"
                  : "text-stone-500 hover:text-nude-600 hover:bg-nude-50"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-nude-500" />
              )}
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  active ? "text-nude-500" : "text-stone-400"
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-cream-200">
        <p className="text-[9px] tracking-[0.25em] font-medium uppercase text-stone-300">
          your space
        </p>
      </div>
    </aside>
  );
}
