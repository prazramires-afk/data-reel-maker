export interface AudioTrack {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const AUDIO_TRACKS: AudioTrack[] = [
  { id: "none", name: "No Music", icon: "🔇", description: "Silent video" },
  { id: "epic-rise", name: "Epic Rise", icon: "🎬", description: "Building cinematic tension" },
  { id: "chill-beats", name: "Chill Beats", icon: "🎧", description: "Relaxed lo-fi groove" },
  { id: "digital-pulse", name: "Digital Pulse", icon: "⚡", description: "Electronic & techy" },
  { id: "dramatic-drums", name: "Dramatic Drums", icon: "🥁", description: "Percussive energy" },
];

// Procedural audio generation using Web Audio API
export function createAudioStream(
  trackId: string,
  durationMs: number
): { stream: MediaStream; stop: () => void } | null {
  if (trackId === "none") return null;

  const ctx = new AudioContext({ sampleRate: 44100 });
  const dest = ctx.createMediaStreamDestination();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.35;
  masterGain.connect(dest);

  // Fade in/out envelope
  const fadeIn = 1.5;
  const fadeOut = 2;
  const durSec = durationMs / 1000;
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + fadeIn);
  masterGain.gain.setValueAtTime(0.35, ctx.currentTime + durSec - fadeOut);
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + durSec);

  const nodes: AudioScheduledSourceNode[] = [];

  const scheduleNote = (
    type: OscillatorType,
    freq: number,
    start: number,
    duration: number,
    gain: number
  ) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
    g.gain.setValueAtTime(gain, ctx.currentTime + start + duration - 0.05);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration);
    nodes.push(osc);
  };

  const scheduleNoise = (start: number, duration: number, gain: number) => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 8000;
    g.gain.setValueAtTime(0, ctx.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
    source.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    source.start(ctx.currentTime + start);
    source.stop(ctx.currentTime + start + duration);
    nodes.push(source);
  };

  if (trackId === "epic-rise") {
    // Pad chords with slowly rising pitch
    const chords = [
      [130.81, 164.81, 196.00], // C3 E3 G3
      [146.83, 185.00, 220.00], // D3 F#3 A3
      [164.81, 207.65, 246.94], // E3 G#3 B3
      [174.61, 220.00, 261.63], // F3 A3 C4
    ];
    const beatLen = durSec / (chords.length * 2);
    for (let rep = 0; rep < 2; rep++) {
      chords.forEach((chord, ci) => {
        const t = (rep * chords.length + ci) * beatLen;
        chord.forEach((freq) => {
          scheduleNote("sine", freq * (1 + rep * 0.5), t, beatLen, 0.2);
          scheduleNote("triangle", freq * 2 * (1 + rep * 0.5), t, beatLen, 0.08);
        });
      });
    }
  } else if (trackId === "chill-beats") {
    // Lo-fi style: soft kick + hi-hat pattern with mellow chords
    const bpm = 80;
    const beatDur = 60 / bpm;
    const totalBeats = Math.floor(durSec / beatDur);
    const chordNotes = [
      [261.63, 329.63, 392.00], // C4 E4 G4
      [220.00, 277.18, 329.63], // A3 C#4 E4
      [246.94, 311.13, 369.99], // B3 D#4 F#4
      [196.00, 246.94, 293.66], // G3 B3 D4
    ];
    for (let beat = 0; beat < totalBeats; beat++) {
      const t = beat * beatDur;
      // Kick on 1 and 3
      if (beat % 4 === 0 || beat % 4 === 2) {
        scheduleNote("sine", 55, t, 0.3, 0.4);
      }
      // Hi-hat on every beat
      scheduleNoise(t, 0.08, 0.15);
      // Extra hi-hat on off-beats
      if (beat % 2 === 1) {
        scheduleNoise(t + beatDur * 0.5, 0.05, 0.08);
      }
      // Chord changes every 4 beats
      if (beat % 4 === 0) {
        const chord = chordNotes[(beat / 4) % chordNotes.length];
        chord.forEach((freq) => {
          scheduleNote("triangle", freq, t, beatDur * 4, 0.1);
        });
      }
    }
  } else if (trackId === "digital-pulse") {
    // Electronic arpeggiated synth
    const bpm = 128;
    const beatDur = 60 / bpm;
    const totalBeats = Math.floor(durSec / beatDur);
    const arpNotes = [130.81, 164.81, 196.00, 261.63, 196.00, 164.81];
    for (let beat = 0; beat < totalBeats; beat++) {
      const t = beat * beatDur;
      const noteIdx = beat % arpNotes.length;
      scheduleNote("sawtooth", arpNotes[noteIdx], t, beatDur * 0.7, 0.12);
      // Bass on every 4th
      if (beat % 4 === 0) {
        scheduleNote("sine", 65.41, t, beatDur * 2, 0.3);
      }
      // Hi-hat
      if (beat % 2 === 0) scheduleNoise(t, 0.05, 0.12);
    }
  } else if (trackId === "dramatic-drums") {
    // Heavy percussion pattern
    const bpm = 100;
    const beatDur = 60 / bpm;
    const totalBeats = Math.floor(durSec / beatDur);
    for (let beat = 0; beat < totalBeats; beat++) {
      const t = beat * beatDur;
      // Deep kick
      if (beat % 4 === 0 || beat % 4 === 3) {
        scheduleNote("sine", 50, t, 0.25, 0.5);
        scheduleNote("sine", 100, t, 0.1, 0.25);
      }
      // Snare on 2 and 4
      if (beat % 4 === 2) {
        scheduleNoise(t, 0.15, 0.3);
        scheduleNote("triangle", 200, t, 0.1, 0.15);
      }
      // Hi-hats
      scheduleNoise(t, 0.04, 0.1);
      scheduleNoise(t + beatDur * 0.5, 0.03, 0.06);
      // Tension drone every 8 beats
      if (beat % 8 === 0) {
        scheduleNote("sawtooth", 73.42, t, beatDur * 4, 0.06);
      }
    }
  }

  const stop = () => {
    nodes.forEach((n) => { try { n.stop(); } catch {} });
    ctx.close();
  };

  // Auto-stop after duration
  setTimeout(stop, durationMs + 1000);

  return { stream: dest.stream, stop };
}
