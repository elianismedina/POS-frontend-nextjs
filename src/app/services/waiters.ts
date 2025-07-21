import { api } from "@/lib/api";

export async function getWaiters() {
  const res = await api.get("/users/waiters");
  return res.data;
}

export async function createWaiter(data: {
  email: string;
  password: string;
  name?: string;
}) {
  const res = await api.post("/users/waiters", data);
  return res.data;
}
