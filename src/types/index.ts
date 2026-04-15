/** Room configuration stored in Firebase */
export interface RoomConfig {
  roomCode: string;
  commissionerId: string;
  commissionerName: string;
  lockTime: string; // ISO timestamp
  status: "lobby" | "bracket" | "live" | "done";
  createdAt: string;
}

/** A user in a room */
export interface RoomUser {
  name: string;
  id: string;
  joinedAt: string;
  isCommissioner: boolean;
  isActive: boolean;
}

/** A single bracket pick */
export interface BracketPick {
  slot: number; // 1-32
  playerName: string;
}

/** Full bracket for a user */
export interface UserBracket {
  userName: string;
  picks: BracketPick[];
  submittedAt: string | null;
}

/** Live draft state */
export interface LiveState {
  currentPick: number;
  windowOpen: boolean;
  windowOpenedAt: string | null;
  teamOnClock: string; // team abbreviation
  tradeMode: boolean;
  bearsDoubleActive: boolean;
}

/** An official confirmed pick */
export interface ConfirmedPick {
  pick: number;
  playerName: string;
  teamAbbrev: string;
  confirmedAt: string;
  isBearsPick: boolean;
}

/** Reaction types */
export type ReactionType = "love" | "like" | "meh" | "bad" | "hate";

/** Reaction emoji mapping */
export const REACTION_EMOJI: Record<ReactionType, string> = {
  love: "\u2764\uFE0F",
  like: "\u{1F44D}",
  meh: "\u{1F610}",
  bad: "\u{1F44E}",
  hate: "\u{1F480}",
};

/** Reaction labels */
export const REACTION_LABELS: Record<ReactionType, string> = {
  love: "LOVE",
  like: "LIKE",
  meh: "MEH",
  bad: "BAD",
  hate: "HATE",
};

/** A user's reaction to a pick */
export interface UserReaction {
  reaction: ReactionType;
  bearsTierCompId: string | null;
}

/** User scores */
export interface UserScores {
  bracketScore: number;
  liveScore: number;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  name: string;
  bracketScore: number;
  liveScore: number;
  totalScore: number;
}

/** App-level user session (stored in localStorage) */
export interface UserSession {
  name: string;
  id: string;
  roomCode: string;
  isCommissioner: boolean;
}
