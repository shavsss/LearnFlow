/**
 * Parses TextTrack cues from a <video> element and emits caption lines.
 * Exposes an EventTarget so consumers can listen to "cue" events.
 */
export class SubtitleScanner extends EventTarget {
  private track: TextTrack;
  private last = "";

  constructor(track: TextTrack) {
    super();
    this.track = track;
    this.track.mode = "hidden";
    this.track.addEventListener("cuechange", this.onCue);
  }

  private onCue = () => {
    const cue = this.track.activeCues?.[0] as VTTCue | undefined;
    if (!cue || cue.text === this.last) return;
    this.last = cue.text;
    this.dispatchEvent(new CustomEvent("cue", { detail: cue.text }));
  };

  disconnect() {
    this.track.removeEventListener("cuechange", this.onCue);
  }
}
