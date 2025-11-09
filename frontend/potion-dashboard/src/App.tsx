import { useEffect, useState } from "react";
import { getCauldrons, type Cauldron } from "./services/cauldrons";
import { api } from "./lib/api";
import LevelBar from "./components/LevelBar";
import CauldronLevels from "./components/CauldronLevels";

type LatestSnapshot = Record<string, number>;

export default function App() {
  const [cauldrons, setCauldrons] = useState<Cauldron[]>([]);
  const [latest, setLatest] = useState<LatestSnapshot>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const [cRes, lRes] = await Promise.all([
          getCauldrons(),
          api.get<LatestSnapshot>("/api/data/latest"),
        ]);
        setCauldrons(cRes);
        setLatest(lRes.data || {});
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // live refresh of latest levels every 5s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { data } = await api.get<LatestSnapshot>("/api/data/latest");
        setLatest(data || {});
      } catch {
        // ignore transient errors; UI will update on next tick
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <main className="p-8">Loading…</main>;
  if (err) return <main className="p-8 text-red-500">Error: {err}</main>;

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Cauldrons ({cauldrons.length})</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cauldrons.map((c) => {
          const current = latest[c.id]; // undefined until snapshot arrives
          const pct =
            current != null && c.max_volume > 0
              ? Math.max(0, Math.min(100, (current / c.max_volume) * 100))
              : null;

          return (
            <div key={c.id} className="rounded-2xl p-5 bg-zinc-800">
              <div className="text-lg font-semibold">{c.name}</div>
              <div className="text-sm opacity-70">{c.id}</div>
              <div className="mt-2 text-sm">Max volume: {c.max_volume}</div>
              <div className="text-sm">
                Lat/Lng: {c.latitude}, {c.longitude}
              </div>

              <div className="mt-3 text-sm">
                {current != null ? (
                  <>
                    Current level:{" "}
                    <span className="font-semibold">
                      {current.toFixed(2)}
                    </span>
                    {pct != null && (
                      <> · <span>{pct.toFixed(0)}%</span></>
                    )}
                    <LevelBar current={current} max={c.max_volume} />
                  </>
                ) : (
                  <>No level data.</>
                )}
              </div>

              <button
                className="underline mt-2"
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
              >
                {openId === c.id ? "Hide levels" : "View levels"}
              </button>

              {openId === c.id && <CauldronLevels id={c.id} />}
            </div>
          );
        })}
      </div>
    </main>
  );
}
