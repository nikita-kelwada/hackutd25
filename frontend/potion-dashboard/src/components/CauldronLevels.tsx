import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";
import { getSeries, type Point } from "../services/levels";

// detect drains: ≥30% drop within 30 min
function detectDrains(points: Point[], pct=0.3, windowMin=30) {
  const ms = windowMin * 60 * 1000;
  const p = [...points].sort((a,b)=>a.timestamp-b.timestamp);
  const out: {start:number; end:number; dropPct:number; amount:number}[] = [];
  for (let i=0;i<p.length;i++) {
    const s = p[i];
    for (let j=i+1; j<p.length && p[j].timestamp - s.timestamp <= ms; j++) {
      if (s.volume > 0) {
        const drop = (s.volume - p[j].volume)/s.volume;
        if (drop >= pct) out.push({start:s.timestamp,end:p[j].timestamp,dropPct:drop,amount:s.volume-p[j].volume});
      }
    }
  }
  return out;
}

export default function CauldronLevels({ id }: { id: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    const load = async () => {
      try { const d = await getSeries(id); if (on) setPoints(d); }
      catch (e:any) { if (on) setErr(e?.message ?? "Failed to fetch"); }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => { on = false; clearInterval(iv); };
  }, [id]);

  const drains = useMemo(() => detectDrains(points, 0.3, 30), [points]);
  const latest = points.at(-1)?.volume;

  if (err) return <div className="text-red-500">{err}</div>;
  if (!points.length) return <div className="opacity-70">No level data.</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm opacity-80">
        Current level: <b>{latest?.toFixed?.(2) ?? "?"}</b> ·
        {drains.length ? ` ${drains.length} drain event(s) in last 30m` : " no drain events detected"}
      </div>

      <LineChart width={700} height={260} data={points}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" type="number" domain={["auto","auto"]}
               tickFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} scale="time" />
        <YAxis />
        <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleString()} />
        <Line type="monotone" dataKey="volume" dot={false} />
        {drains.map((d,i) => (<ReferenceArea key={i} x1={d.start} x2={d.end} y1={0} y2="auto" />))}
      </LineChart>
    </div>
  );
}
