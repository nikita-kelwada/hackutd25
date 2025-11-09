// src/services/levels.ts
import { api } from '../lib/api';

export type Point = {
  timestamp: number;
  volume: number;
};

export async function getSeries(cauldronId: string): Promise<Point[]> {
  try {
    // This calls the backend endpoint from main.py
    const res = await api.get(`/api/data/series/${cauldronId}`);
    return res.data;
  } catch (e) {
    console.error("Failed to get series data", e);
    throw e;
  }
}