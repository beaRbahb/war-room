import { db } from "./firebase";
import {
  ref,
  set,
  get,
  onValue,
  update,
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
} from "../types";

// ── Path helpers ──

function roomPath(code: string) {
  return `rooms/${code}`;
}

// ── Room Config ──

export async function createRoom(
  code: string,
  config: RoomConfig
): Promise<void> {
  await set(ref(db, `${roomPath(code)}/config`), config);
}

export async function getRoom(code: string): Promise<RoomConfig | null> {
  const snap = await get(ref(db, `${roomPath(code)}/config`));
  return snap.exists() ? (snap.val() as RoomConfig) : null;
}

export function onRoomConfig(
  code: string,
  cb: (config: RoomConfig | null) => void
): Unsubscribe {
  return onValue(ref(db, `${roomPath(code)}/config`), (snap) => {
    cb(snap.exists() ? (snap.val() as RoomConfig) : null);
  });
}

export async function updateRoomStatus(
  code: string,
  status: RoomConfig["status"]
): Promise<void> {
  await update(ref(db, `${roomPath(code)}/config`), { status });
}

// ── Users ──

export async function addUser(code: string, user: RoomUser): Promise<void> {
  await set(ref(db, `${roomPath(code)}/users/${user.id}`), user);
}

export async function getUsers(
  code: string
): Promise<Record<string, RoomUser>> {
  const snap = await get(ref(db, `${roomPath(code)}/users`));
  return snap.exists() ? (snap.val() as Record<string, RoomUser>) : {};
}

export function onUsers(
  code: string,
  cb: (users: Record<string, RoomUser>) => void
): Unsubscribe {
  return onValue(ref(db, `${roomPath(code)}/users`), (snap) => {
    cb(snap.exists() ? (snap.val() as Record<string, RoomUser>) : {});
  });
}

// ── Brackets ──

export async function saveBracket(
  code: string,
  userName: string,
  bracket: UserBracket
): Promise<void> {
  await set(ref(db, `${roomPath(code)}/brackets/${userName}`), bracket);
}

export async function getBracket(
  code: string,
  userName: string
): Promise<UserBracket | null> {
  const snap = await get(ref(db, `${roomPath(code)}/brackets/${userName}`));
  return snap.exists() ? (snap.val() as UserBracket) : null;
}

export function onBrackets(
  code: string,
  cb: (brackets: Record<string, UserBracket>) => void
): Unsubscribe {
  return onValue(ref(db, `${roomPath(code)}/brackets`), (snap) => {
    cb(snap.exists() ? (snap.val() as Record<string, UserBracket>) : {});
  });
}

// ── Live State ──

export async function setLiveState(
  code: string,
  state: LiveState
): Promise<void> {
  await set(ref(db, `${roomPath(code)}/live`), state);
}

export async function updateLiveState(
  code: string,
  partial: Partial<LiveState>
): Promise<void> {
  await update(ref(db, `${roomPath(code)}/live`), partial);
}

export function onLiveState(
  code: string,
  cb: (state: LiveState | null) => void
): Unsubscribe {
  return onValue(ref(db, `${roomPath(code)}/live`), (snap) => {
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
  return onValue(
    ref(db, `${roomPath(code)}/live_guesses/pick${pickNum}`),
    (snap) => {
      cb(snap.exists() ? (snap.val() as Record<string, string>) : {});
    }
  );
}

export async function getGuessCount(
  code: string,
  pickNum: number
): Promise<number> {
  const snap = await get(
    ref(db, `${roomPath(code)}/live_guesses/pick${pickNum}`)
  );
  return snap.exists() ? Object.keys(snap.val()).length : 0;
}

// ── Results (confirmed picks) ──

export async function confirmPick(
  code: string,
  pick: ConfirmedPick
): Promise<void> {
  await set(
    ref(db, `${roomPath(code)}/results/pick${pick.pick}`),
    pick
  );
}

export function onResults(
  code: string,
  cb: (results: Record<string, ConfirmedPick>) => void
): Unsubscribe {
  return onValue(ref(db, `${roomPath(code)}/results`), (snap) => {
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
  return onValue(
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
  return onValue(ref(db, `${roomPath(code)}/reactions`), (snap) => {
    cb(
      snap.exists()
        ? (snap.val() as Record<string, Record<string, UserReaction>>)
        : {}
    );
  });
}

// ── Scores ──

export async function updateScores(
  code: string,
  userName: string,
  scores: UserScores
): Promise<void> {
  await set(ref(db, `${roomPath(code)}/scores/${userName}`), scores);
}

export function onScores(
  code: string,
  cb: (scores: Record<string, UserScores>) => void
): Unsubscribe {
  return onValue(ref(db, `${roomPath(code)}/scores`), (snap) => {
    cb(snap.exists() ? (snap.val() as Record<string, UserScores>) : {});
  });
}
