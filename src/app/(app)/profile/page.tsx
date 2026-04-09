"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LogOut, Save, Leaf, Route, Star, Loader2, Camera } from "lucide-react";
import Avatar from "@/components/Avatar";
import type { User, UserRole } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<UserRole>("both");
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as User;
        setProfile(p);
        setFullName(p.full_name);
        setPhone(p.phone || "");
        setBio(p.bio || "");
        setRole(p.role);
        setAvatarUrl(p.avatar_url);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null, bio: bio || null, role })
      .eq("id", profile.id);

    setMessage(error ? "Erreur lors de la sauvegarde" : "Profil mis à jour !");
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setMessage("Erreur lors de l'upload de la photo");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const url = `${publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", profile.id);

    setAvatarUrl(url);
    setProfile({ ...profile, avatar_url: url });
    setMessage("Photo de profil mise à jour !");
    setUploading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 pb-16 pt-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center gap-4">
          <label className="group relative cursor-pointer">
            <Avatar
              src={avatarUrl}
              name={profile?.full_name || ""}
              size="xl"
              className="border-2 border-white shadow-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <div>
            <h1 className="text-xl font-bold text-white">{profile?.full_name}</h1>
            <p className="text-sm text-emerald-200">{profile?.email}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                role === "driver"
                  ? "bg-amber-400/20 text-amber-200"
                  : role === "passenger"
                    ? "bg-blue-400/20 text-blue-200"
                    : "bg-white/15 text-white"
              }`}
            >
              {role === "both" ? "Conducteur & Passager" : role === "driver" ? "Conducteur" : "Passager"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="relative -mt-8 grid grid-cols-3 gap-3 px-4">
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <Leaf className="mb-1 h-5 w-5 text-emerald-500" />
          <span className="text-lg font-bold text-slate-900">
            {profile && profile.co2_saved > 0
              ? `${(profile.co2_saved / 1000).toFixed(1)}`
              : "0"}
          </span>
          <span className="text-[10px] font-medium text-slate-500">kg CO2</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <Route className="mb-1 h-5 w-5 text-blue-500" />
          <span className="text-lg font-bold text-slate-900">
            {profile?.rating_count || 0}
          </span>
          <span className="text-[10px] font-medium text-slate-500">Trajets</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <Star className="mb-1 h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-lg font-bold text-slate-900">
            {profile && profile.rating_avg > 0
              ? profile.rating_avg.toFixed(1)
              : "-"}
          </span>
          <span className="text-[10px] font-medium text-slate-500">Note</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="mt-6 space-y-4 px-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Nom complet
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Téléphone (optionnel)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Bio (optionnel)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Quelques mots sur toi..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Je suis...
          </label>
          <div className="flex gap-2">
            {([
              { value: "both", label: "Les deux" },
              { value: "driver", label: "Conducteur" },
              { value: "passenger", label: "Passager" },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  role === value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div
            className={`rounded-xl p-3.5 text-sm ${
              message.includes("Erreur")
                ? "bg-rose-50 text-rose-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </form>

      <div className="px-4 pb-8">
        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
