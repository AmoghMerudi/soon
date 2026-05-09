"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Bot, Activity, DollarSign } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard/tickets", label: "Tickets", icon: LayoutGrid },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/revenue", label: "Revenue", icon: DollarSign },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-60 shrink-0 fixed top-0 left-0 h-full border-r"
        style={{
          backgroundColor: "var(--sidebar-background)",
          borderColor: "var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center h-16 px-6 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-xl font-bold tracking-tight" style={{ color: "var(--accent)" }}>
            0to1
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "text-white"
                    : "text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a]"
                )}
                style={isActive ? { backgroundColor: "var(--accent)" } : undefined}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 ml-60 overflow-y-auto p-8 min-h-screen"
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        {children}
      </main>
    </div>
  );
}
