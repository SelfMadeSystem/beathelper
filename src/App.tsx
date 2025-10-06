import { useEffect, useState } from "react";
import { BeatCol } from "./BeatCol";
import "./index.css";

type ColConfig = { keyChar: string; bpm: number };

const STORAGE_KEY = "beathelper-config";

const DEFAULT_CONFIG = {
  cols: 1,
  configs: [{ keyChar: "A", bpm: 120 }],
  reactionTime: 1000,
  metronomeEnabled: false,
  blindMode: false,
};

// Load config from localStorage
const loadConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        cols: parsed.cols || DEFAULT_CONFIG.cols,
        configs: parsed.configs || DEFAULT_CONFIG.configs,
        reactionTime: parsed.reactionTime || DEFAULT_CONFIG.reactionTime,
        metronomeEnabled:
          parsed.metronomeEnabled !== undefined
            ? parsed.metronomeEnabled
            : DEFAULT_CONFIG.metronomeEnabled,
        blindMode: parsed.blindMode || DEFAULT_CONFIG.blindMode,
      };
    }
  } catch (error) {
    console.error("Failed to load config from localStorage:", error);
  }
  return DEFAULT_CONFIG;
};

// Save config to localStorage
const saveConfig = (
  cols: number,
  configs: ColConfig[],
  reactionTime: number,
  metronomeEnabled: boolean,
  blindMode: boolean
) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cols,
        configs,
        reactionTime,
        metronomeEnabled,
        blindMode,
      })
    );
  } catch (error) {
    console.error("Failed to save config to localStorage:", error);
  }
};

export function App() {
  const initialConfig = loadConfig();
  const [cols, setCols] = useState<number>(initialConfig.cols);
  const [configs, setConfigs] = useState<ColConfig[]>(initialConfig.configs);
  const [reactionTime, setReactionTime] = useState<number>(
    initialConfig.reactionTime
  );
  const [running, setRunning] = useState<boolean>(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(
    initialConfig.metronomeEnabled
  );
  const [blindMode, setBlindMode] = useState<boolean>(initialConfig.blindMode);

  // Save to localStorage whenever config changes
  useEffect(() => {
    saveConfig(cols, configs, reactionTime, metronomeEnabled, blindMode);
  }, [cols, configs, reactionTime, metronomeEnabled, blindMode]);

  // keep configs length in sync with cols (1..4)
  useEffect(() => {
    setConfigs((prev) => {
      const next = [...prev];
      if (next.length < cols) {
        const defaults = ["S", "D", "F"].map((k, i) => ({
          keyChar: k,
          bpm: 120,
        }));
        while (next.length < cols)
          next.push(defaults[next.length - 1] || { keyChar: "A", bpm: 120 });
      } else if (next.length > cols) {
        next.length = cols;
      }
      return next;
    });
  }, [cols]);

  const updateConfig = (index: number, patch: Partial<ColConfig>) => {
    setConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  const handleStart = () => {
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="w-full max-w-4xl">
        {!running && (
          <div className="bg-slate-800 p-4 rounded mb-4">
            <div className="flex flex-row">
              <div className="flex items-center gap-4 mb-3">
                <label className="text-sm ml-4">Reaction time (ms)</label>
                <input
                  className="bg-slate-700 text-white p-1 rounded w-28"
                  type="number"
                  min={50}
                  max={5000}
                  step={10}
                  value={reactionTime}
                  onChange={(e) => setReactionTime(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-4 mb-3">
                <label className="text-sm ml-4 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={metronomeEnabled}
                    onChange={(e) => setMetronomeEnabled(e.target.checked)}
                  />
                  Enable metronome tick sound
                </label>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <label className="text-sm ml-4 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={blindMode}
                    onChange={(e) => setBlindMode(e.target.checked)}
                  />
                  Blind mode
                </label>
              </div>
            </div>

            <div className="flex flex-row flex-wrap gap-3">
              {configs.map((cfg, i) => (
                <div key={i} className="bg-slate-700 p-3 rounded">
                  <div className="text-xxs text-gray-300 mb-2">
                    Column {i + 1}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <div>
                      <label className="text-sm mr-2">Key</label>
                      <input
                        className="bg-slate-600 text-white p-1 rounded w-12 text-center uppercase"
                        type="text"
                        maxLength={1}
                        value={cfg.keyChar}
                        onChange={(e) =>
                          updateConfig(i, {
                            keyChar: e.target.value.slice(0, 1).toUpperCase(),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm mr-2">BPM</label>
                      <input
                        className="bg-slate-600 text-white p-1 rounded w-20"
                        type="number"
                        min={30}
                        max={300}
                        value={cfg.bpm}
                        onChange={(e) =>
                          updateConfig(i, { bpm: Number(e.target.value || 0) })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center">
                {cols < 4 && (
                  <button
                    className="bg-green-700 hover:bg-green-600 text-white w-8 h-8 rounded"
                    onClick={() => setCols((c) => Math.min(4, c + 1))}
                  >
                    +
                  </button>
                )}
                {cols > 1 && (
                  <button
                    className="bg-red-700 hover:bg-red-600 text-white w-8 h-8 rounded"
                    onClick={() => setCols((c) => Math.max(1, c - 1))}
                  >
                    -
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
                onClick={handleStart}
              >
                Start
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  setCols(DEFAULT_CONFIG.cols);
                  setConfigs(DEFAULT_CONFIG.configs);
                  setReactionTime(DEFAULT_CONFIG.reactionTime);
                  setMetronomeEnabled(DEFAULT_CONFIG.metronomeEnabled);
                  setBlindMode(DEFAULT_CONFIG.blindMode);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {running && (
          <div className="flex justify-between items-center mb-4">
            <div>
              <button
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded"
                onClick={handleStop}
              >
                Stop
              </button>
            </div>
          </div>
        )}

        <div className="h-120 flex gap-6 items-stretch justify-center">
          {configs.map((cfg, i) => (
            <BeatCol
              key={i}
              bpm={cfg.bpm}
              reactionTime={reactionTime}
              running={running}
              keyChar={cfg.keyChar || "A"}
              metronomeEnabled={metronomeEnabled}
              blindMode={blindMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
