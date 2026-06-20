/**
 * Confluence tone (optional, behind CONFLUENCE_TONE).
 *
 * A soft sine whose pitch and volume track the flow where streams merge —
 * ambient music the user makes without trying. Web Audio only, no assets.
 * Starts fully muted and is only ever resumed on a real user gesture, so it
 * never autoplays. Entirely self-contained: if the flag is off it is never
 * constructed and adds nothing to the running toy.
 */
export class ConfluenceTone {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private started = false;

  /** Call from a user-gesture handler (first pointer down). Safe to call again. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();
    this.osc.type = 'sine';
    this.osc.frequency.value = 110;
    this.gain.gain.value = 0; // muted until flow says otherwise
    this.osc.connect(this.gain).connect(this.ctx.destination);
    this.osc.start();
    this.started = true;
  }

  /** Track the flow: `intensity` and `merge` are both 0..1. */
  update(intensity: number, merge: number): void {
    if (!this.ctx || !this.osc || !this.gain) return;
    const now = this.ctx.currentTime;
    const freq = 90 + merge * 130; // pitch rises where streams converge
    const vol = 0.04 * intensity; // always gentle
    this.osc.frequency.setTargetAtTime(freq, now, 0.4);
    this.gain.gain.setTargetAtTime(vol, now, 0.5);
  }

  stop(): void {
    try {
      this.osc?.stop();
      this.ctx?.close();
    } catch {
      /* already torn down */
    }
    this.ctx = null;
    this.osc = null;
    this.gain = null;
    this.started = false;
  }
}
