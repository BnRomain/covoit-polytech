"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/costs";
import MapDynamic from "@/components/MapDynamic";
import {
  ArrowLeft,
  Clock,
  MapPin as MapPinIcon,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import type { Trip, Booking } from "@/types";

const DAYS_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function TripDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [myBooking, setMyBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: tripData } = await supabase
        .from("trips")
        .select("*, driver:profiles!driver_id(*)")
        .eq("id", tripId)
        .single();
      if (tripData) setTrip(tripData as Trip);

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*, passenger:profiles!passenger_id(*)")
        .eq("trip_id", tripId);
      if (bookingsData) {
        setBookings(bookingsData as Booking[]);
        const mine = bookingsData.find((b: Booking) => b.passenger_id === user?.id);
        if (mine) setMyBooking(mine as Booking);
      }

      setLoading(false);
    }
    load();
  }, [tripId]);

  async function handleBook() {
    setActionLoading(true);
    const { error } = await supabase.from("bookings").insert({
      trip_id: tripId,
      passenger_id: currentUserId,
    });
    if (!error) {
      const { data } = await supabase
        .from("bookings")
        .select("*, passenger:profiles!passenger_id(*)")
        .eq("trip_id", tripId)
        .eq("passenger_id", currentUserId)
        .single();
      if (data) {
        setMyBooking(data as Booking);
        setBookings((prev) => [...prev, data as Booking]);
      }
    }
    setActionLoading(false);
  }

  async function handleBookingAction(bookingId: string, status: string) {
    setActionLoading(true);
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (status === "accepted" && trip) {
      await supabase
        .from("trips")
        .update({ available_seats: trip.available_seats - 1 })
        .eq("id", tripId);
    }
    const { data } = await supabase
      .from("bookings")
      .select("*, passenger:profiles!passenger_id(*)")
      .eq("trip_id", tripId);
    if (data) setBookings(data as Booking[]);

    const { data: tripData } = await supabase
      .from("trips")
      .select("*, driver:profiles!driver_id(*)")
      .eq("id", tripId)
      .single();
    if (tripData) setTrip(tripData as Trip);
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 text-center">
        <p className="text-slate-500">Trajet introuvable</p>
        <Link href="/dashboard" className="mt-2 text-sm font-semibold text-emerald-600">
          Retour
        </Link>
      </div>
    );
  }

  const isDriver = currentUserId === trip.driver_id;
  const departureDate = new Date(trip.departure_time);
  const acceptedBookings = bookings.filter((b) => b.status === "accepted");
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  const mapMarkers = [
    { lat: trip.origin_lat, lng: trip.origin_lng, label: "Départ", type: "origin" as const },
    { lat: trip.destination_lat, lng: trip.destination_lng, label: "Arrivée", type: "destination" as const },
  ];
  const route: [number, number][] = [
    [trip.origin_lat, trip.origin_lng],
    [trip.destination_lat, trip.destination_lng],
  ];

  return (
    <div className="mx-auto max-w-lg">
      {/* Map header */}
      <div className="relative">
        <MapDynamic markers={mapMarkers} route={route} className="h-[220px] w-full rounded-none" />
        <Link
          href="/dashboard"
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* Content */}
      <div className="relative -mt-4 rounded-t-3xl bg-slate-50 px-4 pb-8 pt-6">
        {/* Route */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 flex flex-col items-center">
              <div className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-white" />
              <div className="h-10 w-0.5 bg-gradient-to-b from-emerald-400 to-emerald-200" />
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Départ</p>
                <p className="font-semibold text-slate-900">{trip.origin_address}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Arrivée</p>
                <p className="font-semibold text-slate-900">{trip.destination_address}</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[11px] font-medium text-slate-400">Départ</p>
                <p className="text-sm font-semibold text-slate-800">
                  {departureDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} à{" "}
                  {departureDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
              <MapPinIcon className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[11px] font-medium text-slate-400">Distance</p>
                <p className="text-sm font-semibold text-slate-800">{trip.distance_km} km</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
              <Users className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[11px] font-medium text-slate-400">Places</p>
                <p className="text-sm font-semibold text-slate-800">{trip.available_seats} restante{trip.available_seats > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3">
              <span className="text-sm font-bold text-emerald-600">EUR</span>
              <div>
                <p className="text-[11px] font-medium text-emerald-500">Prix/passager</p>
                <p className="text-sm font-extrabold text-emerald-700">{formatPrice(trip.estimated_cost_per_person)}</p>
              </div>
            </div>
          </div>

          {trip.is_recurring && trip.recurrence_days.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
              <Repeat className="h-4 w-4" />
              Récurrent : {trip.recurrence_days.map((d) => DAYS_LABELS[d]).join(", ")}
            </div>
          )}
        </div>

        {/* Driver */}
        {trip.driver && (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Conducteur
            </p>
            <div className="flex items-center gap-3">
              <Avatar src={trip.driver.avatar_url} name={trip.driver.full_name} size="lg" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{trip.driver.full_name}</p>
                {trip.driver.rating_count > 0 && (
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {trip.driver.rating_avg.toFixed(1)} ({trip.driver.rating_count} avis)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Accepted passengers */}
        {acceptedBookings.length > 0 && (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Passagers confirmés ({acceptedBookings.length})
            </p>
            <div className="space-y-2.5">
              {acceptedBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-2.5">
                  <Avatar src={b.passenger?.avatar_url} name={b.passenger?.full_name || "?"} size="md" />
                  <span className="flex-1 text-sm text-slate-700">{b.passenger?.full_name}</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending bookings (driver) */}
        {isDriver && pendingBookings.length > 0 && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Demandes en attente ({pendingBookings.length})
            </p>
            <div className="space-y-3">
              {pendingBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-2.5">
                  <Avatar src={b.passenger?.avatar_url} name={b.passenger?.full_name || "?"} size="md" />
                  <span className="flex-1 text-sm text-slate-700">{b.passenger?.full_name}</span>
                  <button
                    onClick={() => handleBookingAction(b.id, "accepted")}
                    disabled={actionLoading}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleBookingAction(b.id, "rejected")}
                    disabled={actionLoading}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book button */}
        {!isDriver && !myBooking && trip.available_seats > 0 && (
          <button
            onClick={handleBook}
            disabled={actionLoading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Réserver une place"}
          </button>
        )}

        {/* Booking status */}
        {myBooking && (
          <div
            className={`mt-5 rounded-2xl p-5 text-center ${
              myBooking.status === "accepted"
                ? "bg-emerald-50 text-emerald-700"
                : myBooking.status === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-rose-50 text-rose-700"
            }`}
          >
            {myBooking.status === "accepted" && (
              <>
                <CheckCircle className="mx-auto mb-2 h-6 w-6" />
                <p className="font-semibold">Réservation confirmée !</p>
                <p className="mt-1 text-sm opacity-80">
                  N'oublie pas de payer {formatPrice(trip.estimated_cost_per_person)} au conducteur.
                </p>
              </>
            )}
            {myBooking.status === "pending" && (
              <>
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
                <p className="font-semibold">Demande envoyée</p>
                <p className="mt-1 text-sm opacity-80">En attente de confirmation du conducteur</p>
              </>
            )}
            {myBooking.status === "rejected" && (
              <>
                <XCircle className="mx-auto mb-2 h-6 w-6" />
                <p className="font-semibold">Demande refusée</p>
                <p className="mt-1 text-sm opacity-80">Le conducteur a décliné ta demande</p>
              </>
            )}
          </div>
        )}

        {!isDriver && trip.available_seats === 0 && !myBooking && (
          <div className="mt-5 rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-500">
            Ce trajet est complet
          </div>
        )}
      </div>
    </div>
  );
}
