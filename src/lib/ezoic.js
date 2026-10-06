// Ezoic standalone ads: calls go through window.ezstandalone.cmd so they run
// once the Ezoic script has loaded. Off unless NEXT_PUBLIC_EZOIC_ENABLED=true.
export const EZOIC_ENABLED = process.env.NEXT_PUBLIC_EZOIC_ENABLED === "true";

export function runEzoic(fn) {
  if (typeof window === "undefined") return;
  window.ezstandalone = window.ezstandalone || {};
  window.ezstandalone.cmd = window.ezstandalone.cmd || [];
  window.ezstandalone.cmd.push(fn);
}
