"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import TripCard from "@/components/TripCard";
import { Car, Armchair, Loader2 } from "lucide-react";
import type { Trip, Booking } from "@/types";

export default function BookingsPage() {
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myBookings, setMyBookings] = useState<(Booking & { trip: Trip })[]>([]);
  const [activeTab, setActiveTab] = useState<"passenger" | "driver">("passenger");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trips } = await supabase
        .from("trips")
        .select("*, driver:profiles!driver_id(*)")
        .eq("driver_id", user.id)
        .order("departure_time", { ascending: false });
      if (trips) setMyTrips(trips as Trip[]);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, trip:trips(*, driver:profiles!driver_id(*))")
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });
      if (bookings) setMyBookings(bookings as (Booking & { trip: Trip })[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const statusConfig = {
    accepted: { label: "Confirmé", bg: "bg-emerald-100", text: "text-emerald-700" },
    pending: { label: "En attente", bg: "bg-amber-100", text: "text-amber-700" },
    rejected: { label: "Refusé", bg: "bg-rose-100", text: "text-rose-700" },
    completed: { label: "Terminé", bg: "bg-slate-100", text: "text-slate-600" },
  } as const;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-5 text-2xl font-bold text-slate-900">Mes trajets</h1>

      {/* Tabs */}
      <div className="mb-5 flex rounded-2xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("passenger")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            activeTab === "passenger"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Armchair className="h-4 w-4" />
          Passager
        </button>
        <button
          onClick={() => setActiveTab("driver")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            activeTab === "driver"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Car className="h-4 w-4" />
          Conducteur
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === "passenger" && (
          <>
            {myBookings.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Armchair className="h-6 w-6 text-slate-300" />
                </div>
                <p className="mt-4 font-semibold text-slate-700">Aucune réservation</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tu n'as pas encore réservé de trajet
                </p>
              </div>
            ) : (
              myBookings.map((b) => {
                const config = statusConfig[b.status as keyof typeof statusConfig] || statusConfig.pending;
                return (
                  <div key={b.id}>
                    <span
                      className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.bg} ${config.text}`}
                    >
                      {config.label}
                    </span>
                    <TripCard trip={b.trip} />
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === "driver" && (
          <>
            {myTrips.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Car className="h-6 w-6 text-slate-300" />
                </div>
                <p className="mt-4 font-semibold text-slate-700">Aucun trajet proposé</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tu n'as pas encore proposé de trajet
                </p>
              </div>
            ) : (
              myTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}
