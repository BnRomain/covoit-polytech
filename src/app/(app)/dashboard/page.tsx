"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import TripCard from "@/components/TripCard";
import MapDynamic from "@/components/MapDynamic";
import { Search, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import type { Trip, User } from "@/types";

const FILTERS = [
  { label: "Tous", value: "all" },
  { label: "Aujourd'hui", value: "today" },
  { label: "Demain", value: "tomorrow" },
  { label: "Vers Polytech", value: "to_polytech" },
  { label: "Depuis Polytech", value: "from_polytech" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) setUser(profile as User);
      }

      const { data: tripsData } = await supabase
        .from("trips")
        .select("*, driver:profiles!driver_id(*)")
        .eq("status", "active")
        .gte("departure_time", new Date().toISOString())
        .order("departure_time", { ascending: true })
        .limit(20);

      if (tripsData) setTrips(tripsData as Trip[]);
      setLoading(false);
    }

    loadData();
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 86400000)
    .toISOString()
    .split("T")[0];

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      search === "" ||
      trip.origin_address.toLowerCase().includes(search.toLowerCase()) ||
      trip.destination_address.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const tripDate = trip.departure_time.split("T")[0];

    switch (activeFilter) {
      case "today":
        return tripDate === todayStr;
      case "tomorrow":
        return tripDate === tomorrowStr;
      case "to_polytech":
        return trip.destination_address.toLowerCase().includes("polytech") ||
          trip.destination_address.toLowerCase().includes("sophia");
      case "from_polytech":
        return trip.origin_address.toLowerCase().includes("polytech") ||
          trip.origin_address.toLowerCase().includes("sophia");
      default:
        return true;
    }
  });

  const mapMarkers = filteredTrips
    .filter((t) => t.origin_lat && t.origin_lng)
    .map((t) => ({
      lat: t.origin_lat,
      lng: t.origin_lng,
      label: `${t.origin_address.split(",")[0]} → ${t.destination_address.split(",")[0]}`,
      type: "trip" as const,
    }));

  const firstName = user?.full_name?.split(" ")[0] || "";
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">
          Salut{firstName ? `, ${firstName}` : ""} !
        </h1>
        <p className="mt-0.5 text-sm capitalize text-slate-500">{dateStr}</p>
      </div>

      {/* Map */}
      <div className="mb-4 overflow-hidden rounded-2xl shadow-sm">
        <MapDynamic
          markers={mapMarkers}
          className="h-[180px] w-full"
        />
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Où vas-tu ?"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Filter chips */}
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              activeFilter === value
                ? "bg-emerald-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Trip list */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            <p className="mt-3 text-sm text-slate-400">
              Chargement des trajets...
            </p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <MapPin className="h-7 w-7 text-slate-300" />
            </div>
            <p className="mt-4 font-semibold text-slate-700">
              {search
                ? "Aucun trajet ne correspond"
                : "Aucun trajet disponible"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Essaie avec une autre adresse"
                : "Sois le premier à proposer un trajet !"}
            </p>
            <Link
              href="/trips/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Proposer un trajet
            </Link>
          </div>
        ) : (
          filteredTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
        )}
      </div>
    </div>
  );
}
