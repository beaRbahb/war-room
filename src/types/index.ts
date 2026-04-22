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
  /** Pick overrides — maps pick number to new team abbrev (e.g. { "25": "NYG" }) */
  overrides?: Record<string, string>;
  /** Bumped on team reassignment to signal all clients to reset their guess state */
  guessResetAt?: string | null;
}

/** Room configuration stored in Firebase */
export interface RoomConfig {
  roomCode: string;
  commissionerId: string;
  commissionerName: string;
  lockTime: string; // ISO timestamp
  status: "bracket" | "live" | "done";
  createdAt: string;
  /** User ID of backup commissioner (can open/close/finalize but not kick/reset) */
  backupCommissionerId?: string | null;
}

/** An official confirmed pick */
export interface ConfirmedPick {
  pick: number;
  playerName: string;
  teamAbbrev: string;
  confirmedAt: string;
  isBearsPick: boolean;
}

/** Letter grade types — all picks */
export type GradeType = "a-plus" | "a" | "b" | "c" | "d" | "f";

/** Display labels for grades */
export const GRADE_LABELS: Record<GradeType, string> = {
  "a-plus": "A+",
  a: "A",
  b: "B",
  c: "C",
  d: "D",
  f: "F",
};

/** Color classes for grades */
export const GRADE_COLORS: Record<GradeType, string> = {
  "a-plus": "text-green bg-green/10 border-green/30",
  a: "text-green/70 bg-green/5 border-green/20",
  b: "text-amber bg-amber/10 border-amber/30",
  c: "text-muted bg-surface-elevated border-border",
  d: "text-orange bg-orange/10 border-orange/30",
  f: "text-red bg-red/10 border-red/30",
};

/** Reaction type stored in Firebase */
export type ReactionType = GradeType;

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

/** A user's roast answer for a pick */
export interface RoastAnswer {
  text: string;
  submittedAt: string;
  /** The prompt this user answered */
  prompt: string;
}

/** Tallied roast result for voting reveal */
export interface RoastResult {
  answererName: string;
  text: string;
  voteCount: number;
}

/** App-level user session (stored in localStorage) */
export interface UserSession {
  name: string;
  id: string;
  roomCode: string;
  isCommissioner: boolean;
}
