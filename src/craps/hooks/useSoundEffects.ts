import { useCallback, useRef } from 'react';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, gain = 0.1) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.Q.setValueAtTime(0.8, ctx.currentTime);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(filter).connect(g).connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

export function useSoundEffects() {
  const enabledRef = useRef(true);

  const playDiceRoll = useCallback(() => {
    if (!enabledRef.current) return;
    playNoise(0.6, 0.08);
    // Rattle effect: quick taps
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playTone(300 + Math.random() * 200, 0.05, 'triangle', 0.06), i * 80);
    }
  }, []);

  const playWin = useCallback(() => {
    if (!enabledRef.current) return;
    // Ascending arpeggio: C5, E5, G5, C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 100);
    });
  }, []);

  const playBigWin = useCallback(() => {
    if (!enabledRef.current) return;
    // Fuller arpeggio with harmonics
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.5, 'sine', 0.1);
        playTone(freq * 1.5, 0.3, 'triangle', 0.05);
      }, i * 90);
    });
  }, []);

  const playLoss = useCallback(() => {
    if (!enabledRef.current) return;
    playTone(300, 0.4, 'sine', 0.1);
    setTimeout(() => playTone(220, 0.5, 'sine', 0.08), 150);
  }, []);

  const playChipPlace = useCallback(() => {
    if (!enabledRef.current) return;
    playTone(1800, 0.04, 'square', 0.06);
    setTimeout(() => playTone(2400, 0.03, 'square', 0.04), 20);
  }, []);

  const playReaction = useCallback(() => {
    if (!enabledRef.current) return;
    playTone(800, 0.08, 'sine', 0.08);
    setTimeout(() => playTone(1200, 0.06, 'sine', 0.06), 40);
  }, []);

  return { playDiceRoll, playWin, playBigWin, playLoss, playChipPlace, playReaction, enabledRef };
}
