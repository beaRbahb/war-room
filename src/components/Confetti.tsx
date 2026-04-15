import { useEffect, useState } from "react";

interface ConfettiProps {
  /** Duration in ms before auto-remove */
  duration?: number;
}

interface Piece {
  id: number;
  x: number;
  delay: number;
  size: number;
  color: string;
}

/**
 * Bears confetti — navy + orange pieces falling across the screen.
 * Fires on correct live guess.
 */
export default function Confetti({ duration = 3000 }: ConfettiProps) {
  const [visible, setVisible] = useState(true);

  const pieces: Piece[] = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    size: 6 + Math.random() * 8,
    color: i % 2 === 0 ? "#0b1f4a" : "#e87722",
  }));

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            animation: `confetti-fall ${1.5 + Math.random()}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
