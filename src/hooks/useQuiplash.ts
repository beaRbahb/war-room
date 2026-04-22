import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  onRoastAnswersForPick,
  onRoastVotes,
  submitRoastAnswer,
  submitRoastVote,
} from "../lib/storage";
import { getQuiplashPrompt } from "../data/quiplashPrompts";
import type { LiveState, RoastAnswer } from "../types";

export type QuiplashPhase = "write" | "vote" | "results" | null;

interface UseQuiplashOptions {
  roomCode: string | undefined;
  userName: string | undefined;
  liveState: LiveState | null;
  totalUsers: number;
}

interface UseQuiplashReturn {
  phase: QuiplashPhase;
  prompt: string | null;
  answers: Record<string, RoastAnswer>;
  votes: Record<string, string>;
  draftText: string;
  setDraftText: (text: string) => void;
  answerCount: number;
  totalUsers: number;
  submitAnswer: () => Promise<void>;
  submitVote: (answererName: string) => Promise<void>;
  resetQuiplashState: () => void;
}

const EMPTY_ANSWERS: Record<string, RoastAnswer> = {};
const EMPTY_VOTES: Record<string, string> = {};

export function useQuiplash({
  roomCode,
  userName,
  liveState,
  totalUsers,
}: UseQuiplashOptions): UseQuiplashReturn {
  const [answers, setAnswers] = useState<Record<string, RoastAnswer>>(EMPTY_ANSWERS);
  const [votes, setVotes] = useState<Record<string, string>>(EMPTY_VOTES);
  const [draftText, setDraftText] = useState("");

  const currentPick = liveState?.currentPick ?? 1;
  const isFinalize = !!liveState && !liveState.windowOpen && !!liveState.windowOpenedAt;
  const isTraded = !!liveState?.overrides?.[String(currentPick)];

  // Refs for auto-submit on finalize end
  const prevFinalizeRef = useRef(isFinalize);
  const draftTextRef = useRef(draftText);
  const answersRef = useRef(answers);
  const finalizePromptRef = useRef<string | null>(null);
  const finalizePickRef = useRef<number>(currentPick);
  useEffect(() => { draftTextRef.current = draftText; }, [draftText]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const prompt = useMemo(
    () => getQuiplashPrompt(currentPick, isTraded),
    [currentPick, isTraded],
  );

  // Capture prompt and pick when entering finalize — by the time auto-submit fires,
  // currentPick and prompt have already advanced to the next pick
  useEffect(() => {
    if (isFinalize) {
      finalizePromptRef.current = prompt;
      finalizePickRef.current = currentPick;
    }
  }, [isFinalize, prompt, currentPick]);

  // Derived booleans from Firebase data
  const userSubmitted = !!(userName && answers[userName]);
  const userVoted = !!(userName && votes[userName]);
  const answerCount = Object.keys(answers).length;

  // Phase derivation
  const phase: QuiplashPhase = useMemo(() => {
    if (!isFinalize) return null;
    if (totalUsers < 2) return null;
    if (prompt === null) return null;
    if (!userSubmitted) return "write";
    if (userSubmitted && answerCount >= 2 && !userVoted) return "vote";
    return "results";
  }, [isFinalize, totalUsers, prompt, userSubmitted, answerCount, userVoted]);

  // Subscribe to roast answers — clears on unsubscribe
  useEffect(() => {
    if (!roomCode || !isFinalize) return;
    const unsub = onRoastAnswersForPick(roomCode, currentPick, setAnswers);
    return () => {
      unsub();
      setAnswers(EMPTY_ANSWERS);
    };
  }, [roomCode, currentPick, isFinalize]);

  // Subscribe to roast votes — clears on unsubscribe
  useEffect(() => {
    if (!roomCode || !isFinalize) return;
    const unsub = onRoastVotes(roomCode, currentPick, setVotes);
    return () => {
      unsub();
      setVotes(EMPTY_VOTES);
    };
  }, [roomCode, currentPick, isFinalize]);

  // Reset draft text when pick advances — tracked via ref to avoid setState-in-effect lint
  const prevPickRef = useRef(currentPick);
  if (prevPickRef.current !== currentPick) {
    prevPickRef.current = currentPick;
    setDraftText("");
  }

  // Auto-submit draft text when finalize ends (commissioner confirmed)
  useEffect(() => {
    const wasFinalize = prevFinalizeRef.current;
    prevFinalizeRef.current = isFinalize;

    if (wasFinalize && !isFinalize && roomCode && userName) {
      const text = draftTextRef.current.trim();
      const currentAnswers = answersRef.current;
      // Use refs captured at finalize-entry — by now currentPick/prompt have advanced
      const pickNum = finalizePickRef.current;
      const activePrompt = finalizePromptRef.current;
      if (text && !currentAnswers[userName]) {
        submitRoastAnswer(roomCode, pickNum, userName, {
          text,
          submittedAt: new Date().toISOString(),
          prompt: activePrompt ?? "",
        }).catch(() => {});
      }
    }
  }, [isFinalize]); // eslint-disable-line react-hooks/exhaustive-deps -- only react to finalize changes

  const submitAnswer = useCallback(async () => {
    if (!roomCode || !userName || !draftText.trim() || !prompt) return;
    await submitRoastAnswer(roomCode, currentPick, userName, {
      text: draftText.trim(),
      submittedAt: new Date().toISOString(),
      prompt,
    });
    setDraftText("");
  }, [roomCode, userName, draftText, currentPick, prompt]);

  const handleVote = useCallback(async (answererName: string) => {
    if (!roomCode || !userName) return;
    await submitRoastVote(roomCode, currentPick, userName, answererName);
  }, [roomCode, userName, currentPick]);

  const resetQuiplashState = useCallback(() => {
    setAnswers(EMPTY_ANSWERS);
    setVotes(EMPTY_VOTES);
    setDraftText("");
  }, []);

  return {
    phase,
    prompt,
    answers,
    votes,
    draftText,
    setDraftText,
    answerCount,
    totalUsers,
    submitAnswer,
    submitVote: handleVote,
    resetQuiplashState,
  };
}
