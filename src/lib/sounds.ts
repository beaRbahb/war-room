import chimeUrl from "../assets/sounds/nfl-draft-chime.mp3";

const chime = new Audio(chimeUrl);

/** Play the draft chime sound effect. Rewinds if already playing. */
export function playDraftChime() {
  chime.currentTime = 0;
  chime.play().catch(() => {});
}
