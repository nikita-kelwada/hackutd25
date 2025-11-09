// src/components/CauldronLevels.tsx

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { getSeries, type Point } from "../services/levels"; // Assumes this file exists
import { api } from "../lib/api"; // Assumes this file exists

// --- Type for drain event (must match backend) ---
type DrainEvent = {
  cauldronId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  start: number; // Millisecond timestamp for chart
  end: number; // Millisecond timestamp for chart
  calculatedVolume: number;
};

export default function CauldronLevels({ id }: { id: string }) {
  // --- This section is from your original file ---
  const [points, setPoints] = useState<Point[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const d = await getSeries(id);
        if (on) setPoints(d);
      } catch (e: any) {
        if (on) setErr(e?.message ?? "Failed to fetch");
      }
    };
    load();
    return () => {
      on = false;
    };
  }, [id]);

  // --- NEW: State for drain detection ---
  const [drainLimit, setDrainLimit] = useState("5"); // Default to 5
  const [drains, setDrains] = useState<DrainEvent[]>([]);
  const [drainsLoading, setDrainsLoading] = useState(false);
  const [drainsError, setDrainsError] = useState<string | null>(null);

  // --- NEW: Function to call the backend ---
  const findDrainEvents = () => {
    setDrainsLoading(true);
    setDrainsError(null);
    setDrains([]);

    // Build URL with limit param
    const url = drainLimit
      ? `/api/analysis/drains/${id}?limit=${drainLimit}`
      : `/api/analysis/drains/${id}`; // "All Drains" sends no limit

    api
      .get(url)
      .then((res) => {
        setDrains(res.data);
      })
      .catch((err) => {
        setDrainsError(err.message || "Failed to analyze drains");
      })
      .finally(() => {
        setDrainsLoading(false);
      });
  };

  const latest = points.at(-1)?.volume;

  if (err) return <div className="text-red-500">{err}</div>;
  if (!points.length)
    return <div className="opacity-70">Loading level data...</div>;

  return (
    // Add margin/padding to match your screenshot
    <div className="space-y-2 mt-4 pt-4 border-t border-zinc-700">
      <div className="text-sm opacity-80">
        Current level: <b>{latest?.toFixed?.(2) ?? "?"}</b>
      </div>

      {/* --- This is your original chart --- */}
      <LineChart width={700} height={260} data={points}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={(v) => new Date(Number(v)).toLocaleTimeString()}
          scale="time"
          stroke="#a1a1aa"
          fontSize={12}
        />
        <YAxis stroke="#a1a1aa" fontSize={12} />
        <Tooltip
          labelFormatter={(v) => new Date(Number(v)).toLocaleString()}
          contentStyle={{ backgroundColor: "#27272a", border: "none" }}
        />
        <Line type="monotone" dataKey="volume" dot={false} stroke="#3b82f6" />
        {/* This uses the 'start' and 'end' keys we added in analysis.py */}
        {drains.map((d, i) => (
          <ReferenceArea
            key={i}
            x1={d.start}
            x2={d.end}
            fill="red"
            fillOpacity={0.2}
          />
        ))}
      </LineChart>

      {/* --- NEW: Drain Analysis UI --- */}
      <h4 className="font-semibold pt-4 border-t border-zinc-700">
        Drain Event Analysis
      </h4>
      <div className="flex items-center gap-4">
        <select
          value={drainLimit}
          onChange={(e) => setDrainLimit(e.target.value)}
          className="p-2 rounded bg-zinc-700 text-white text-sm"
        >
          {/* Your new options */}
          <option value="1">Last 1 Drain</option>
          <option value="5">Last 5 Drains</option>
          <option value="10">Last 10 Drains</option>
          <option value="">All Drains</option>
        </select>

        <button
          onClick={findDrainEvents}
          disabled={drainsLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {drainsLoading ? "Analyzing..." : "Find Drains"}
        </button>
      </div>

      {/* --- NEW: Results Display --- */}
      {drainsError && <div className="text-red-400">{drainsError}</div>}

      {drains.length > 0 ? (
        <ul className="list-disc pl-5 mt-2 text-sm text-zinc-300">
          {drains.map((event) => (
            <li key={event.startTime}>
              <strong>{event.calculatedVolume.toFixed(2)}L</strong>
              {" drained from "}
              {new Date(event.startTime).toLocaleTimeString()}
              {" to "}
              {new Date(event.endTime).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400 mt-2">
          {!drainsLoading &&
            !drainsError &&
            'No drain events found. Click "Find Drains".'}
        </p>
      )}
    </div>
  );
}
