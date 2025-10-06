import { useEffect, useRef, useState } from "react";

type BeatProps = {
  bpm: number;
  reactionTime: number;
  running: boolean;
  keyChar: string;
};

const perfect = 25;
const good = 100;

export function BeatCol({ bpm, reactionTime, running, keyChar }: BeatProps) {
  const [elements, setElements] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

      const tick = () => {
        setElements((els) => [...els, Date.now()]);
        setTimeout(() => {
          setElements((els) => els.slice(1));
        }, reactionTime * 1.5);
      };

      intervalRef.current = setInterval(tick, interval);
      tick();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setElements([]);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bpm, running, reactionTime]);

  useEffect(() => {
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
  }, [keyChar, reactionTime, elements]);

  return (
    <div className="flex flex-col items-center text-center w-24">
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

      <div className="w-8 h-full bg-gray-200 relative overflow-hidden">
        {elements.map((el) => (
          <div
            key={el}
            className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full mb-2 animate-top-to-bottom bg-blue-500`}
            style={{ "--duration": `${reactionTime}ms` } as React.CSSProperties}
          ></div>
        ))}
      </div>
    </div>
  );
}
