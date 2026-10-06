"use client";

import { useEffect, useState } from "react";
import { EZOIC_ENABLED, runEzoic } from "@/lib/ezoic";

// `id` is a placeholder id created in the Ezoic dashboard
// (EzoicAds -> Ad Locations -> Placeholders). Don't use ids 900-999: Ezoic
// generates those itself.
export default function EzoicAd({ id, className = "" }) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!EZOIC_ENABLED) return;
    setRendered(true);
    runEzoic(() => window.ezstandalone?.showAds(id));
    return () => runEzoic(() => window.ezstandalone?.destroyPlaceholders(id));
  }, [id]);

  if (!EZOIC_ENABLED) return null;
  return (
    <div className={className}>
      {rendered && <div id={`ezoic-pub-ad-placeholder-${id}`} />}
    </div>
  );
}
