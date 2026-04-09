"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { calculateCostPerPassenger, formatPrice } from "@/lib/costs";
import AddressInput from "@/components/AddressInput";
import { ArrowLeft, Minus, Plus, Repeat, Loader2 } from "lucide-react";
import Link from "next/link";

const DAYS = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "M" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

export default function NewTripPage() {
  const router = useRouter();
  const supabase = createClient();

  const [origin, setOrigin] = useState({ address: "", lat: 0, lng: 0 });
  const [destination, setDestination] = useState({ address: "", lat: 0, lng: 0 });
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("08:00");
  const [seats, setSeats] = useState(3);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleDay(day: number) {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function calculateDistance(
    lat1: number, lon1: number, lat2: number, lon2: number
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1.3 * 10) / 10;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!origin.lat || !destination.lat) {
      setError("Sélectionne une adresse dans les suggestions pour le départ et l'arrivée.");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Tu dois être connecté pour créer un trajet.");
      setLoading(false);
      return;
    }

    const distanceKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const costPerPerson = calculateCostPerPassenger(distanceKm, seats + 1);
    const departureDateTime = new Date(`${departureDate}T${departureTime}:00`).toISOString();

    const { error: dbError } = await supabase.from("trips").insert({
      driver_id: user.id,
      origin_address: origin.address,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_address: destination.address,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      departure_time: departureDateTime,
      available_seats: seats,
      estimated_cost_per_person: costPerPerson,
      distance_km: distanceKm,
      is_recurring: isRecurring,
      recurrence_days: isRecurring ? recurrenceDays : [],
    });

    if (dbError) {
      setError("Erreur lors de la création du trajet : " + dbError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  const distanceKm =
    origin.lat && destination.lat
      ? calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng)
      : 0;
  const estimatedCost =
    distanceKm > 0 ? calculateCostPerPassenger(distanceKm, seats + 1) : 0;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proposer un trajet</h1>
          <p className="text-sm text-slate-500">Partage ton trajet avec d'autres étudiants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Itineraire */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
            Itinéraire
          </h2>
          <div className="relative space-y-1">
            {/* Ligne verticale entre les deux inputs */}
            <div className="absolute left-[1.35rem] top-[3.2rem] h-[calc(100%-5rem)] w-0.5 bg-gradient-to-b from-emerald-400 to-emerald-200" />
            <AddressInput
              label="Départ"
              placeholder="Adresse de départ..."
              value={origin.address}
              onChange={(address, lat, lng) => setOrigin({ address, lat, lng })}
              icon="origin"
            />
            <div className="h-1" />
            <AddressInput
              label="Destination"
              placeholder="Polytech Sophia Antipolis..."
              value={destination.address}
              onChange={(address, lat, lng) => setDestination({ address, lat, lng })}
              icon="destination"
            />
          </div>
        </div>

        {/* Quand */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
            Quand
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Date</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Heure</label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Recurrent toggle */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isRecurring
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Repeat className="h-4 w-4" />
              Trajet récurrent
            </button>

            {isRecurring && (
              <div className="mt-3 flex gap-2">
                {DAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      recurrenceDays.includes(value)
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Places */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
            Places disponibles
          </h2>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setSeats(Math.max(1, seats - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
              disabled={seats <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-4xl font-bold text-slate-900">{seats}</span>
            <button
              type="button"
              onClick={() => setSeats(Math.min(4, seats + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
              disabled={seats >= 4}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cost preview */}
        {distanceKm > 0 && (
          <div className="rounded-2xl bg-emerald-50 p-5">
            <div className="text-center">
              <p className="text-sm font-semibold text-emerald-700">
                Coût par passager
              </p>
              <p className="mt-1 text-3xl font-extrabold text-emerald-700">
                {formatPrice(estimatedCost)}
              </p>
              <p className="mt-2 text-xs text-emerald-600">
                {distanceKm} km · coût total {formatPrice(distanceKm * 0.10)} réparti entre {seats + 1} personnes
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="fixed bottom-20 left-4 right-4 mx-auto max-w-lg">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Publier le trajet"
            )}
          </button>
        </div>
        {/* Spacer for fixed button */}
        <div className="h-16" />
      </form>
    </div>
  );
}
