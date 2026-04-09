"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  icon?: "origin" | "destination";
}

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  icon = "origin",
}: AddressInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function searchAddress(q: string) {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=fr&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setSuggestions([]);
    }
  }

  function handleInputChange(val: string) {
    setQuery(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchAddress(val), 400);
  }

  function handleSelect(suggestion: AddressSuggestion) {
    setQuery(suggestion.display_name);
    onChange(
      suggestion.display_name,
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon)
    );
    setShowSuggestions(false);
  }

  const iconColor =
    icon === "destination" ? "text-rose-400" : "text-emerald-500";

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <div
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconColor}`}
        >
          {icon === "destination" ? (
            <MapPin className="h-4 w-4" />
          ) : (
            <div className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-white" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {showSuggestions && (
        <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-emerald-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="line-clamp-2 leading-snug">
                  {s.display_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
