export const SHOTS = {
  open: {from: 0, duration: 360},
  classificationTitle: {from: 360, duration: 60},
  classification: {from: 420, duration: 900},
  rag: {from: 1320, duration: 780},
  toolsTitle: {from: 2100, duration: 60},
  tools: {from: 2160, duration: 1080},
  safetyTitle: {from: 3240, duration: 60},
  safety: {from: 3300, duration: 1050},
  outcomeTitle: {from: 4350, duration: 60},
  outcome: {from: 4410, duration: 990},
} as const;

export const TOTAL_FRAMES = 5400;

export type ShotKey = keyof typeof SHOTS;
