import { db, ensureAuth } from "./firebase";
import {
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  type Unsubscribe,
} from "firebase/database";
import type {
  RoomConfig,
  RoomUser,
  UserBracket,
  LiveState,
  ConfirmedPick,
  UserReaction,
  UserScores,
  RoastAnswer,
} from "../types";

// Sign in anonymously on first import — all DB operations below
// will wait for auth if called before it resolves.
const authPromise = ensureAuth();

// ── Path helpers ──

function roomPath(code: string) {
  return `rooms/${code}`;
}

/** Wait for anonymous auth before any DB call */
async function waitForAuth() {
  await authPromise;
}

/**
 * Deferred onValue: waits for auth before attaching the Firebase listener.
 * Returns a synchronous Unsubscribe that cancels even if auth hasn't resolved yet.
 */
function deferredOnValue(
  dbRef: ReturnType<typeof ref>,
  cb: (snap: import("firebase/database").DataSnapshot) => void,
): Unsubscribe {
  let innerUnsub: Unsubscribe | null = null;
  let cancelled = false;

  authPromise.then(() => {
    if (!cancelled) {
      innerUnsub = onValue(dbRef, cb);
    }
  });

  return () => {
    cancelled = true;
    innerUnsub?.();
  };
}

// ── Connection State ──

/** Subscribe to Firebase connection state. Returns unsubscribe. */
export function onConnectionState(cb: (connected: boolean) => void): Unsubscribe {
  const connRef = ref(db, ".info/connected");
  return onValue(connRef, (snap) => {
    cb(snap.val() === true);
  });
}

// ── Room Config ──

export async function createRoom(
  code: string,
  config: RoomConfig
): Promise<void> {
  await waitForAuth();
  await set(ref(db, `${roomPath(code)}/config`), config);
}

export async function getRoom(code: string): Promise<RoomConfig | null> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/config`));
  return snap.exists() ? (snap.val() as RoomConfig) : null;
}

export function onRoomConfig(
  code: string,
  cb: (config: RoomConfig | null) => void
): Unsubscribe {
  return deferredOnValue(ref(db, `${roomPath(code)}/config`), (snap) => {
    cb(snap.exists() ? (snap.val() as RoomConfig) : null);
  });
}

export async function updateRoomStatus(
  code: string,
  status: RoomConfig["status"]
): Promise<void> {
  await waitForAuth();
  await update(ref(db, `${roomPath(code)}/config`), { status });
}


export async function setBackupCommissioner(
  code: string,
  backupCommissionerId: string | null
): Promise<void> {
  await waitForAuth();
  await update(ref(db, `${roomPath(code)}/config`), { backupCommissionerId });
}

// ── Users ──

export async function addUser(code: string, user: RoomUser): Promise<void> {
  await waitForAuth();
  await set(ref(db, `${roomPath(code)}/users/${user.id}`), user);
}

export async function getUsers(
  code: string
): Promise<Record<string, RoomUser>> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/users`));
  return snap.exists() ? (snap.val() as Record<string, RoomUser>) : {};
}

export function onUsers(
  code: string,
  cb: (users: Record<string, RoomUser>) => void
): Unsubscribe {
  return deferredOnValue(ref(db, `${roomPath(code)}/users`), (snap) => {
    cb(snap.exists() ? (snap.val() as Record<string, RoomUser>) : {});
  });
}

export async function removeUser(
  code: string,
  userId: string
): Promise<void> {
  await waitForAuth();
  await remove(ref(db, `${roomPath(code)}/users/${userId}`));
}

// ── Brackets ──

export async function saveBracket(
  code: string,
  userName: string,
  bracket: UserBracket
): Promise<void> {
  await waitForAuth();
  await set(ref(db, `${roomPath(code)}/brackets/${userName}`), bracket);
}

export async function getBracket(
  code: string,
  userName: string
): Promise<UserBracket | null> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/brackets/${userName}`));
  return snap.exists() ? (snap.val() as UserBracket) : null;
}

export function onBrackets(
  code: string,
  cb: (brackets: Record<string, UserBracket>) => void
): Unsubscribe {
  return deferredOnValue(ref(db, `${roomPath(code)}/brackets`), (snap) => {
    cb(snap.exists() ? (snap.val() as Record<string, UserBracket>) : {});
  });
}

// ── Reset Draft (testing only) ──

export async function resetDraft(code: string): Promise<void> {
  await waitForAuth();
  await Promise.all([
    remove(ref(db, `${roomPath(code)}/live`)),
    remove(ref(db, `${roomPath(code)}/live_guesses`)),
    remove(ref(db, `${roomPath(code)}/results`)),
    remove(ref(db, `${roomPath(code)}/scores`)),
    remove(ref(db, `${roomPath(code)}/reactions`)),
    remove(ref(db, `${roomPath(code)}/roasts`)),
    remove(ref(db, `${roomPath(code)}/roast_votes`)),
  ]);
  await update(ref(db, `${roomPath(code)}/config`), { status: "bracket" });
}

// ── Live State ──

export async function setLiveState(
  code: string,
  state: LiveState
): Promise<void> {
  await waitForAuth();
  await set(ref(db, `${roomPath(code)}/live`), state);
}

export async function updateLiveState(
  code: string,
  partial: Partial<LiveState>
): Promise<void> {
  await waitForAuth();
  await update(ref(db, `${roomPath(code)}/live`), partial);
}

export function onLiveState(
  code: string,
  cb: (state: LiveState | null) => void
): Unsubscribe {
  return deferredOnValue(ref(db, `${roomPath(code)}/live`), (snap) => {
    cb(snap.exists() ? (snap.val() as LiveState) : null);
  });
}

// ── Live Guesses ──

export async function submitGuess(
  code: string,
  pickNum: number,
  userName: string,
  playerName: string
): Promise<void> {
  await waitForAuth();
  await set(
    ref(db, `${roomPath(code)}/live_guesses/pick${pickNum}/${userName}`),
    playerName
  );
}

export function onGuesses(
  code: string,
  pickNum: number,
  cb: (guesses: Record<string, string>) => void
): Unsubscribe {
  return deferredOnValue(
    ref(db, `${roomPath(code)}/live_guesses/pick${pickNum}`),
    (snap) => {
      cb(snap.exists() ? (snap.val() as Record<string, string>) : {});
    }
  );
}

/** Single read of all guesses for a confirmed pick */
export async function getGuessesForPick(
  code: string,
  pickNum: number
): Promise<Record<string, string>> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/live_guesses/pick${pickNum}`));
  return snap.exists() ? (snap.val() as Record<string, string>) : {};
}

export async function clearGuesses(
  code: string,
  pickNum: number
): Promise<void> {
  await waitForAuth();
  await remove(ref(db, `${roomPath(code)}/live_guesses/pick${pickNum}`));
}

export async function getGuessCount(
  code: string,
  pickNum: number
): Promise<number> {
  await waitForAuth();
  const snap = await get(
    ref(db, `${roomPath(code)}/live_guesses/pick${pickNum}`)
  );
  return snap.exists() ? Object.keys(snap.val()).length : 0;
}

// ── Results (confirmed picks) ──

/** Atomic: confirm pick + advance live state in a single Firebase write */
export async function confirmPickAndAdvance(
  code: string,
  pick: ConfirmedPick,
  liveUpdates: Partial<LiveState>
): Promise<void> {
  await waitForAuth();
  const updates: Record<string, unknown> = {
    [`results/pick${pick.pick}`]: pick,
  };
  for (const [key, value] of Object.entries(liveUpdates)) {
    updates[`live/${key}`] = value ?? null;
  }
  await update(ref(db, roomPath(code)), updates);
}

export function onResults(
  code: string,
  cb: (results: Record<string, ConfirmedPick>) => void
): Unsubscribe {
  return deferredOnValue(ref(db, `${roomPath(code)}/results`), (snap) => {
    cb(snap.exists() ? (snap.val() as Record<string, ConfirmedPick>) : {});
  });
}

// ── Reactions ──

export async function submitReaction(
  code: string,
  pickNum: number,
  userName: string,
  reaction: UserReaction
): Promise<void> {
  await waitForAuth();
  await set(
    ref(db, `${roomPath(code)}/reactions/pick${pickNum}/${userName}`),
    reaction
  );
}

export function onReactions(
  code: string,
  pickNum: number,
  cb: (reactions: Record<string, UserReaction>) => void
): Unsubscribe {
  return deferredOnValue(
    ref(db, `${roomPath(code)}/reactions/pick${pickNum}`),
    (snap) => {
      cb(snap.exists() ? (snap.val() as Record<string, UserReaction>) : {});
    }
  );
}

export function onAllReactions(
  code: string,
  cb: (reactions: Record<string, Record<string, UserReaction>>) => void
): Unsubscribe {
  return deferredOnValue(ref(db, `${roomPath(code)}/reactions`), (snap) => {
    cb(
      snap.exists()
        ? (snap.val() as Record<string, Record<string, UserReaction>>)
        : {}
    );
  });
}

export async function getAllGuesses(
  code: string
): Promise<Record<string, Record<string, string>>> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/live_guesses`));
  return snap.exists()
    ? (snap.val() as Record<string, Record<string, string>>)
    : {};
}

export async function getAllReactions(
  code: string
): Promise<Record<string, Record<string, UserReaction>>> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/reactions`));
  return snap.exists()
    ? (snap.val() as Record<string, Record<string, UserReaction>>)
    : {};
}

// ── Roasts ──

export async function submitRoastAnswer(
  code: string,
  pickNum: number,
  userName: string,
  answer: RoastAnswer
): Promise<void> {
  await waitForAuth();
  await set(
    ref(db, `${roomPath(code)}/roasts/pick${pickNum}/${userName}`),
    answer
  );
}

/** Real-time listener for roast answers on a specific pick */
export function onRoastAnswersForPick(
  code: string,
  pickNum: number,
  cb: (answers: Record<string, RoastAnswer>) => void,
): Unsubscribe {
  return deferredOnValue(
    ref(db, `${roomPath(code)}/roasts/pick${pickNum}`),
    (snap) => cb(snap.exists() ? (snap.val() as Record<string, RoastAnswer>) : {}),
  );
}

export async function getRoastAnswersForPick(
  code: string,
  pickNum: number
): Promise<Record<string, RoastAnswer>> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/roasts/pick${pickNum}`));
  return snap.exists() ? (snap.val() as Record<string, RoastAnswer>) : {};
}

/** Clear all roast answers for a pick (used on trade reassignment) */
export async function clearRoastsForPick(
  code: string,
  pickNum: number,
): Promise<void> {
  await waitForAuth();
  await remove(ref(db, `${roomPath(code)}/roasts/pick${pickNum}`));
}

/** Clear all roast votes for a pick (used on trade reassignment) */
export async function clearRoastVotesForPick(
  code: string,
  pickNum: number,
): Promise<void> {
  await waitForAuth();
  await remove(ref(db, `${roomPath(code)}/roast_votes/pick${pickNum}`));
}

// ── Roast Votes ──

export async function submitRoastVote(
  code: string,
  pickNum: number,
  voterName: string,
  answererName: string,
): Promise<void> {
  await waitForAuth();
  await set(
    ref(db, `${roomPath(code)}/roast_votes/pick${pickNum}/${voterName}`),
    answererName,
  );
}

export function onRoastVotes(
  code: string,
  pickNum: number,
  cb: (votes: Record<string, string>) => void,
): Unsubscribe {
  return deferredOnValue(
    ref(db, `${roomPath(code)}/roast_votes/pick${pickNum}`),
    (snap) => cb(snap.exists() ? (snap.val() as Record<string, string>) : {}),
  );
}

export async function getRoastVotesForPick(
  code: string,
  pickNum: number,
): Promise<Record<string, string>> {
  await waitForAuth();
  const snap = await get(ref(db, `${roomPath(code)}/roast_votes/pick${pickNum}`));
  return snap.exists() ? (snap.val() as Record<string, string>) : {};
}

// ── Scores ──

export async function updateScores(
  code: string,
  userName: string,
  scores: UserScores
): Promise<void> {
  await waitForAuth();
  await set(ref(db, `${roomPath(code)}/scores/${userName}`), scores);
}

export function onScores(
  code: string,
  cb: (scores: Record<string, UserScores>) => void
): Unsubscribe {
  return deferredOnValue(ref(db, `${roomPath(code)}/scores`), (snap) => {
    cb(snap.exists() ? (snap.val() as Record<string, UserScores>) : {});
  });
}
