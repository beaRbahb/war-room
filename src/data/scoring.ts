/** Bracket scoring: correct player in correct slot */
export const BRACKET_EXACT_MATCH = 10;

/** Bracket scoring: correct player in wrong slot */
export const BRACKET_PLAYER_ONLY = 4;

/** Live pick scoring: correct guess */
export const LIVE_CORRECT = 10;

/** Live pick scoring: correct guess with Bears double points */
export const LIVE_CORRECT_BEARS_DOUBLE = 20;

/** Maximum players per room */
export const MAX_ROOM_PLAYERS = 20;

/** Live guess window duration in seconds */
export const GUESS_WINDOW_SECONDS = 60;

/** Seconds remaining when flash-red warning triggers */
export const FLASH_WARNING_SECONDS = 10;

/** Dramatic pause duration in ms after pick reveal */
export const REVEAL_PAUSE_MS = 1500;

/** Bracket lock time: April 24, 2026 at 8:00pm ET */
export const BRACKET_LOCK_TIME = new Date("2026-04-24T20:00:00-04:00");

/** Room code length */
export const ROOM_CODE_LENGTH = 6;

/** Generate a random room code */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
