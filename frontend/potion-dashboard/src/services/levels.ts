import { api } from "../lib/api";

export type Point = { timestamp: number; volume: number };

export async function getSeries(cauldronId: string): Promise<Point[]> {
  const { data } = await api.get(`/api/data/series/${cauldronId}`);
  return data ?? [];
}

export async function getLatestSnapshot(): Promise<Record<string, number>> {
  const { data } = await api.get("/api/data/latest");
  return data ?? {};
}
