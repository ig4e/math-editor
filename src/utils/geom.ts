// Small math helpers. World↔screen conversion + path-builders moved out
// when the hand-rolled drawing layer was retired; Excalidraw owns those
// transforms now. `clamp` survives because it's universal.

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
