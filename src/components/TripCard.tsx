"use client";

import Link from "next/link";
import { Clock, Users, Repeat, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/costs";
import Avatar from "@/components/Avatar";
import type { Trip } from "@/types";

interface TripCardProps {
  trip: Trip;
}

const DAYS_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function TripCard({ trip }: TripCardProps) {
  const departureDate = new Date(trip.departure_time);
  const timeStr = departureDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = departureDate.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-100"
    >
      {/* Header : heure + badges */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <Clock className="h-3 w-3" />
            {timeStr}
          </span>
          <span className="text-xs text-slate-400">{dateStr}</span>
        </div>
        {trip.is_recurring && trip.recurrence_days.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
            <Repeat className="h-3 w-3" />
            {trip.recurrence_days.map((d) => DAYS_LABELS[d]).join(", ")}
          </span>
        )}
      </div>

      {/* Route : origine → destination */}
      <div className="flex items-start gap-3">
        <div className="mt-1.5 flex flex-col items-center">
          <div className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-white" />
          <div className="h-8 w-0.5 bg-gradient-to-b from-emerald-400 to-emerald-200" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-sm font-semibold text-slate-800">
            {trip.origin_address}
          </p>
          <p className="truncate text-sm font-semibold text-slate-800">
            {trip.destination_address}
          </p>
        </div>
        <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Footer : prix + places + conducteur */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex items-center gap-3">
          {/* Prix */}
          <span className="text-lg font-bold text-emerald-600">
            {formatPrice(trip.estimated_cost_per_person)}
          </span>
          {/* Distance */}
          <span className="text-xs text-slate-400">{trip.distance_km} km</span>
          {/* Places */}
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Users className="h-3 w-3" />
            {trip.available_seats}
          </span>
        </div>

        {/* Conducteur */}
        {trip.driver && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {trip.driver.full_name.split(" ")[0]}
            </span>
            <Avatar src={trip.driver.avatar_url} name={trip.driver.full_name} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}
