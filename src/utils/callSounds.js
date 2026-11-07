/**
 * Audio cue manager for WebRTC call sound effects.
 *
 * Plays authentic OPPO ringtone for incoming calls.
 */

let audioCtx = null;
let activeLoopInterval = null;
let activeOscillators = [];
let activeAudioElement = null;

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

    const start = ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);

    activeOscillators.push(osc);
    osc.onended = () => {
      activeOscillators = activeOscillators.filter((o) => o !== osc);
    };

    return osc;
  } catch {
    return null;
  }
}

/**
 * Stop any ongoing loop or tone immediately.
 */
export function stopAllSounds() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }
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
 * Play authentic OPPO incoming call ringtone loop.
 */
export function playIncomingRing() {
  stopAllSounds();
  if (typeof window === "undefined") return;

  try {
    const audio = new Audio("/sounds/ringtone_oppo.mp3");
    audio.loop = true;
    audio.volume = 0.85;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        console.warn("[callSounds] Audio playback prevented:", err?.message);
      });
    }
    activeAudioElement = audio;
  } catch (err) {
    console.warn("[callSounds] Error creating Audio:", err?.message);
  }
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
 * Play call ended tone (cadence of 400Hz tone pulses).
 */
export function playEndTone() {
  stopAllSounds();
  playTone(425, "sine", 0.18, 0.09, 0);
  playTone(425, "sine", 0.18, 0.09, 0.28);
  playTone(425, "sine", 0.3, 0.09, 0.56);
}
