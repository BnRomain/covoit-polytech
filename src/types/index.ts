export type UserRole = "driver" | "passenger" | "both";

export type TripStatus = "active" | "completed" | "cancelled";

export type BookingStatus = "pending" | "accepted" | "rejected" | "completed";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  rating_avg: number;
  rating_count: number;
  co2_saved: number;
  created_at: string;
}

export interface Trip {
  id: string;
  driver_id: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  available_seats: number;
  estimated_cost_per_person: number;
  distance_km: number;
  is_recurring: boolean;
  recurrence_days: number[];
  status: TripStatus;
  created_at: string;
  // Joined data
  driver?: User;
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  trip_id: string;
  passenger_id: string;
  status: BookingStatus;
  created_at: string;
  // Joined data
  passenger?: User;
  trip?: Trip;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  trip_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Joined data
  reviewer?: User;
}

export interface Message {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined data
  sender?: User;
}
