"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, CalendarCheck, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/trips/new", label: "Proposer", icon: PlusCircle },
  { href: "/bookings", label: "Mes trajets", icon: CalendarCheck },
  { href: "/profile", label: "Profil", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)] pt-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
                isActive
                  ? "text-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
              />
              <span
                className={`text-[10px] leading-tight ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
