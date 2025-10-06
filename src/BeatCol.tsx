import { useEffect, useRef, useState } from "react";

type BeatProps = {
  bpm: number;
  reactionTime: number;
  running: boolean;
  keyChar: string;
  metronomeEnabled: boolean;
  blindMode: boolean;
};

const perfect = 25;
const good = 100;

// Create a shared audio context to avoid recreating it on every tick
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Create a simple metronome tick sound using Web Audio API
const createTickSound = () => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = 1000; // 1kHz tone
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.05);
};

export function BeatCol({
  bpm,
  reactionTime,
  running,
  keyChar,
  metronomeEnabled,
  blindMode,
}: BeatProps) {
  const [elements, setElements] = useState<number[]>([]);
  const [totalPresses, setTotalPresses] = useState(0);
  const [successfulHits, setSuccessfulHits] = useState(0);
  const [lastOffset, setLastOffset] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<
    "perfect" | "good" | "miss" | null
  >(null);
  const accuracy = totalPresses
    ? Math.round((successfulHits / totalPresses) * 100)
    : 100;

  useEffect(() => {
    if (running) {
      setElements([]);
      setTotalPresses(0);
      setSuccessfulHits(0);
      setLastOffset(null);
      setLastResult(null);

      const interval = (60 / bpm) * 1000;
      const timeouts: NodeJS.Timeout[] = [];

      const tick = () => {
        const now = Date.now();
        setElements((els) => [...els, now]);

        // Play the metronome sound when the beat should be hit
        if (metronomeEnabled) {
          const metronomeTimeout = setTimeout(() => {
            try {
              createTickSound();
            } catch (error) {
              console.error("Failed to play metronome sound:", error);
            }
          }, reactionTime);
          timeouts.push(metronomeTimeout);
        }

        const cleanupTimeout = setTimeout(() => {
          setElements((els) => els.filter((el) => el !== now));
        }, reactionTime * 1.5);
        timeouts.push(cleanupTimeout);
      };

      const cl = setInterval(tick, interval);
      tick();

      return () => {
        clearInterval(cl);
        timeouts.forEach((timeout) => clearTimeout(timeout));
      };
    } else {
      setElements([]);
    }
  }, [bpm, running, reactionTime, metronomeEnabled]);

  useEffect(() => {
    if (!running) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === keyChar.toLowerCase()) {
        setTotalPresses((tp) => tp + 1);
        const now = Date.now();

        let closestOffset = Infinity;
        elements.forEach((el) => {
          const offset = now - el - reactionTime;
          if (
            Math.abs(offset) <= closestOffset &&
            Math.abs(offset) <= reactionTime
          ) {
            closestOffset = offset;
          }
        });

        if (closestOffset !== Infinity) {
          setLastOffset(closestOffset);
          if (Math.abs(closestOffset) <= perfect) {
            setLastResult("perfect");
            setSuccessfulHits((sh) => sh + 1);
          } else if (Math.abs(closestOffset) <= good) {
            setLastResult("good");
            setSuccessfulHits((sh) => sh + 1);
          } else {
            setLastResult("miss");
          }
        } else {
          setLastResult("miss");
          setLastOffset(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keyChar, reactionTime, elements, running]);

  return (
    <div className="flex flex-col items-center text-center w-24 *:text-nowrap">
      <div className="text-xs mb-1">
        <div>
          Key: <span className="font-semibold">{keyChar}</span>
        </div>
        <div>
          Accuracy: <span className="font-semibold">{accuracy}%</span>
        </div>
        <div className="text-xxs text-gray-500">
          {lastResult
            ? `${lastResult.toUpperCase()} ${
                lastOffset !== null
                  ? `(${lastOffset >= 0 ? `+${lastOffset}` : lastOffset}ms)`
                  : ""
              }`
            : "—"}
        </div>
      </div>

      <div
        className={`w-8 h-full bg-gray-200 relative overflow-hidden ${
          blindMode && running ? "blind-mode" : ""
        }`}
        style={{ "--duration": `${reactionTime}ms` } as React.CSSProperties}
      >
        {elements.map((el) => (
          <div
            key={el}
            className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full mb-2 animate-top-to-bottom bg-blue-500`}
          ></div>
        ))}
      </div>
    </div>
  );
}
