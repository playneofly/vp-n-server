// Minimal external store — domain/uuid entered once flow into every section
// (forge output, fragment JSONs, subscription links) automatically.

import { useSyncExternalStore } from "react";
import type { ScanItem, PortScan } from "./net";

export const DEFAULT_UUID = "b3311f0d-72e4-4f9c-9a3d-5c6b7a8f9e0d";

export interface StoreState {
  domain: string;
  uuid: string;
  scans: ScanItem[];
  portScans: PortScan[];
  bestHost: string | null;
  scannedAt: number;
}

let state: StoreState = {
  domain: "",
  uuid: DEFAULT_UUID,
  scans: [],
  portScans: [],
  bestHost: null,
  scannedAt: 0,
};

const subs = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<StoreState>) {
    state = { ...state, ...patch };
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};

export function useStore(): StoreState {
  return useSyncExternalStore(store.subscribe, store.get);
}
