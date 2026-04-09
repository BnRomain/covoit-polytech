"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-2xl bg-slate-100 animate-pulse" style={{ minHeight: "180px" }}>
      <span className="text-sm text-slate-400">Chargement de la carte...</span>
    </div>
  ),
});

export default Map;
