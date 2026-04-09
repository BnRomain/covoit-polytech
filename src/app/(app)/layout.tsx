import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-lg items-center px-4">
          <Link href="/dashboard" className="text-lg font-extrabold tracking-tight text-slate-900">
            Covoit<span className="text-emerald-600">Polytech</span>
          </Link>
        </div>
      </header>
      <main className="pb-24">{children}</main>
      <Navbar />
    </>
  );
}
