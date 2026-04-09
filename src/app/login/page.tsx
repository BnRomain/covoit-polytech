"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { isUniversityEmail } from "@/lib/auth";
import { AlertCircle, Check, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const emailValid = email.length > 0 && isUniversityEmail(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isUniversityEmail(email)) {
      setError(
        "Seuls les emails universitaires sont acceptés (@etu.univ-cotedazur.fr, @univ-cotedazur.fr, etc.)"
      );
      return;
    }

    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Un email de réinitialisation a été envoyé à " + email + ". Vérifie ta boîte mail !"
        );
      }
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Un email de confirmation a été envoyé à " + email + ". Vérifie ta boîte mail !"
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect"
            : error.message
        );
      } else {
        window.location.href = "/dashboard";
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Hero */}
      <div className="relative flex min-h-[38vh] items-end overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-8 pb-14 pt-12 md:min-h-screen md:w-1/2 md:items-center md:pb-0">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -left-8 top-1/4 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute bottom-12 right-12 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute left-1/3 top-1/3 h-20 w-20 rounded-full bg-emerald-400/10" />
          {/* Route lines */}
          <svg
            className="absolute bottom-0 left-0 h-full w-full opacity-[0.07]"
            viewBox="0 0 400 600"
            fill="none"
          >
            <path
              d="M-50 550 Q 100 400, 200 300 T 450 100"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="8 8"
            />
            <path
              d="M-20 600 Q 150 450, 250 350 T 500 150"
              stroke="white"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Covoit
            <span className="text-emerald-200">Polytech</span>
          </h1>
          <p className="mt-3 text-lg text-emerald-100/80">
            Partagez la route entre étudiants
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Écologique
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Entre étudiants
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-sm">
              Moins de 1,50 EUR/trajet
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="relative -mt-6 flex flex-1 flex-col justify-center rounded-t-3xl bg-white px-6 py-10 md:mt-0 md:rounded-none md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === "signup" ? "Créer un compte" : mode === "forgot" ? "Mot de passe oublié" : "Se connecter"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "signup"
              ? "Rejoins la communauté CovoitPolytech"
              : mode === "forgot"
              ? "Entre ton email pour recevoir un lien de réinitialisation"
              : "Content de te revoir !"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={mode === "signup"}
                  placeholder="Prénom Nom"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Email universitaire
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="prenom.nom@etu.univ-cotedazur.fr"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {emailValid && (
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Mot de passe
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="6 caractères minimum"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signup" ? (
                "Créer mon compte"
              ) : mode === "forgot" ? (
                "Envoyer le lien"
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {mode === "forgot" ? (
              <button
                onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Retour à la connexion
              </button>
            ) : (
              <>
                {mode === "signup" ? "Déjà inscrit ?" : "Pas encore de compte ?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "signup" ? "login" : "signup");
                    setError("");
                    setMessage("");
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {mode === "signup" ? "Se connecter" : "S'inscrire"}
                </button>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Réservé aux étudiants et personnels de l'Université Côte d'Azur
          </p>
        </div>
      </div>
    </div>
  );
}
