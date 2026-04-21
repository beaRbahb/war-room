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
    a.download = `war-room-${sanitizeFilename(data.meta.roomCode)}-results.json`;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Capture a DOM element as a PNG and trigger share (mobile) or download (desktop).
 * html2canvas is dynamically imported to keep it off the main bundle.
 */
export async function captureAndShareCard(element: HTMLElement, filename: string): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#0a0a0a",
    useCORS: true,
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas to blob failed"))), "image/png");
  });

  const file = new File([blob], `${filename}.png`, { type: "image/png" });

  // Mobile: use native share sheet if available
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      // User cancelled share — not an error
      if (err instanceof Error && err.name === "AbortError") return;
      throw err;
    }
    return;
  }

  // Desktop fallback: download the PNG
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.png`;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
