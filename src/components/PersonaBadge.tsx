import { PERSONA_META, PERSONA_COLORS, type PersonaType } from "../lib/personas";

interface PersonaBadgeProps {
  persona: PersonaType;
  size?: "sm" | "lg";
}

/** Inline badge showing a user's draft persona. */
export default function PersonaBadge({ persona, size = "sm" }: PersonaBadgeProps) {
  const meta = PERSONA_META[persona];
  const colors = PERSONA_COLORS[persona];

  if (size === "lg") {
    return (
      <div className={`border rounded-lg px-3 py-2 ${colors}`}>
        <p className="font-display text-lg tracking-wide">{meta.label}</p>
        <p className="font-condensed text-xs opacity-70">{meta.description}</p>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center font-condensed text-xs font-bold uppercase border rounded px-2 py-0.5 ${colors}`}>
      {meta.label}
    </span>
  );
}
