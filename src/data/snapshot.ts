import json from "./snapshot.json";
import type { Snapshot } from "./types";

/** O snapshot tipado (o JSON é gerado por scripts/build-snapshot.py; os literais de plataforma não são inferidos do JSON). */
export const s = json as unknown as Snapshot;
