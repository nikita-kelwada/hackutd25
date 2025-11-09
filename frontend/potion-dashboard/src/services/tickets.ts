import { api } from "../lib/api";

export type Ticket = {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  cauldronId?: string;
};

export async function getTickets(): Promise<Ticket[]> {
  const { data } = await api.get("/api/tickets");
  return data ?? [];
}
