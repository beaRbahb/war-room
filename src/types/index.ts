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
  trubiskyActive?: boolean;
}

/** An official confirmed pick */
export interface ConfirmedPick {
  pick: number;
  playerName: string;
  teamAbbrev: string;
  confirmedAt: string;
  isBearsPick: boolean;
}

/** Reaction types — draft grades */
export type ReactionType = "a-plus" | "a" | "b" | "c" | "f";

/** Display labels for each grade */
export const REACTION_GRADES: Record<ReactionType, string> = {
  "a-plus": "A+",
  a: "A",
  b: "B",
  c: "C",
  f: "F",
};

/** Color classes for each grade */
export const REACTION_COLORS: Record<ReactionType, string> = {
  "a-plus": "text-green bg-green/10 border-green/30",
  a: "text-green/70 bg-green/5 border-green/20",
  b: "text-amber bg-amber/10 border-amber/30",
  c: "text-muted bg-surface-elevated border-border",
  f: "text-red bg-red/10 border-red/30",
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
  liveHits: number;
  bracketExact: number;
  bracketPartial: number;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  name: string;
  bracketScore: number;
  liveScore: number;
  totalScore: number;
  liveHits: number;
  bracketExact: number;
  bracketPartial: number;
}

/** A wager on a live pick */
export interface Wager {
  amount: number;
  playerName: string;
}

/** App-level user session (stored in localStorage) */
export interface UserSession {
  name: string;
  id: string;
  roomCode: string;
  isCommissioner: boolean;
}
