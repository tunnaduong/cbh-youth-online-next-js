/**
 * Web Audio API synthesizer for WebRTC call sound effects.
 *
 * Synthesizes ringtones and call status cues directly in-browser using AudioContext:
 * - Zero external asset dependencies (no missing .mp3 / 404 network errors).
 * - Instant sub-millisecond response.
 * - Works offline and across all modern browsers.
 */

let audioCtx = null;
let activeLoopInterval = null;
let activeOscillators = [];

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a single synthesized tone with fade envelope.
 */
function playTone(freq, type = "sine", duration = 0.2, gainValue = 0.1, startTime = 0) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration + 0.05);

    activeOscillators.push(osc);
    osc.onended = () => {
      activeOscillators = activeOscillators.filter((o) => o !== osc);
    };
    return osc;
  } catch (err) {
    console.warn("[callSounds] playTone error:", err?.message);
    return null;
  }
}

/**
 * Stop any ongoing loop or tone immediately.
 */
export function stopAllSounds() {
  if (activeLoopInterval) {
    clearInterval(activeLoopInterval);
    activeLoopInterval = null;
  }
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  });
  activeOscillators = [];
}

/**
 * Play standard outgoing ringing sound (cadence of dual 440Hz & 480Hz, 1.2s on, 2.5s pause).
 */
export function playOutgoingRing() {
  stopAllSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const triggerRing = () => {
    playTone(440, "sine", 1.2, 0.08, 0);
    playTone(480, "sine", 1.2, 0.08, 0);
  };

  triggerRing();
  activeLoopInterval = setInterval(triggerRing, 3700);
}

/**
 * Play pleasant melodic incoming call ringtone loop.
 */
export function playIncomingRing() {
  stopAllSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const triggerMelody = () => {
    // A modern gentle four-tone chime sequence (E5, G5, A5, B5)
    playTone(659.25, "sine", 0.18, 0.12, 0);
    playTone(783.99, "sine", 0.18, 0.12, 0.2);
    playTone(880.00, "sine", 0.22, 0.14, 0.4);
    playTone(987.77, "sine", 0.45, 0.15, 0.65);

    // Second flourish
    playTone(880.00, "sine", 0.15, 0.1, 1.3);
    playTone(987.77, "sine", 0.35, 0.12, 1.48);
  };

  triggerMelody();
  activeLoopInterval = setInterval(triggerMelody, 2800);
}

/**
 * Play short connected confirmation chime.
 */
export function playConnectedTone() {
  stopAllSounds();
  playTone(523.25, "sine", 0.12, 0.1, 0);
  playTone(659.25, "sine", 0.25, 0.12, 0.14);
}

/**
 * Play short call ended / drop tone.
 */
export function playEndTone() {
  stopAllSounds();
  playTone(493.88, "sine", 0.15, 0.1, 0);
  playTone(369.99, "sine", 0.25, 0.09, 0.16);
}
