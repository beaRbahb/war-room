import type { PersonaType } from "./personas";
import type { UserRecapStats, RoomRecapStats } from "./recap";
import type { ConfirmedPick, LeaderboardEntry } from "../types";

export interface DraftExportJSON {
  meta: { roomCode: string; exportedAt: string; version: 1 };
  room: RoomRecapStats;
  standings: LeaderboardEntry[];
  users: UserRecapStats[];
  picks: ConfirmedPick[];
  personas: Record<string, PersonaType | null>;
}

/** Build the full export payload. */
export function buildDraftJSON(
  roomCode: string,
  recapData: { users: UserRecapStats[]; room: RoomRecapStats; entries: LeaderboardEntry[] },
  confirmedPicks: ConfirmedPick[],
  personas: Record<string, PersonaType>,
): DraftExportJSON {
  return {
    meta: {
      roomCode,
      exportedAt: new Date().toISOString(),
      version: 1,
    },
    room: recapData.room,
    standings: recapData.entries,
    users: recapData.users,
    picks: confirmedPicks,
    personas,
  };
}

function sanitizeFilename(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Download a JSON blob as a file. */
export function downloadJSON(data: DraftExportJSON): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `ontheclock-${sanitizeFilename(data.meta.roomCode)}-results.json`;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Capture a DOM element as a PNG image.
 * Tries clipboard copy first (requires HTTPS); falls back to PNG download.
 * Returns "copied" or "saved" so the caller can show appropriate feedback.
 */
export async function copyCardImage(element: HTMLElement): Promise<"copied" | "saved"> {
  // Try clipboard (needs secure context — HTTPS or localhost)
  if (navigator.clipboard?.write && window.isSecureContext) {
    const blobPromise = import("modern-screenshot").then(({ domToBlob }) =>
      domToBlob(element, { scale: 2, backgroundColor: "#0a0a0a" })
    );
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blobPromise }),
    ]);
    return "copied";
  }

  // Fallback: download as PNG
  const { domToBlob } = await import("modern-screenshot");
  const blob = await domToBlob(element, { scale: 2, backgroundColor: "#0a0a0a" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = "ontheclock-recap.png";
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
  return "saved";
}
