import { api } from "../lib/api";

export type Cauldron = {
  id: string;
  name: string;
  max_volume: number;
  latitude: number;
  longitude: number;
};

export async function getCauldrons(): Promise<Cauldron[]> {
  const { data } = await api.get("/api/cauldrons");
  return data ?? [];
}
