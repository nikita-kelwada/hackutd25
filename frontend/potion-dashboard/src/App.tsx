import { useEffect, useState } from "react";
import { getCauldrons, type Cauldron } from "./services/cauldrons";
import { getTickets, type Ticket } from "./services/tickets";

export default function App() {
  const [items, setItems] = useState<Cauldron[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([getCauldrons(), getTickets()]);
        setItems(c);
        setTickets(t);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="p-8">Loading…</main>;
  if (err) return <main className="p-8 text-red-500">Error: {err}</main>;

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 p-8 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-3">⚠️ Flags ({tickets.length})</h2>
        {tickets.length === 0 ? (
          <p className="opacity-70">No flags right now.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-xl p-4 bg-zinc-800">
                <div className="text-xs uppercase opacity-70">{t.severity}</div>
                <div className="text-base">{t.message}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h1 className="text-3xl font-bold mb-3">Cauldrons ({items.length})</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <div key={c.id} className="rounded-2xl p-5 bg-zinc-800">
              <div className="text-lg font-semibold">{c.name}</div>
              <div className="text-sm opacity-70">{c.id}</div>
              <div className="mt-2 text-sm">Max volume: {c.max_volume}</div>
              <div className="text-sm">
                Lat/Lng: {c.latitude}, {c.longitude}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
