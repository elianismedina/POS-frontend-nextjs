interface User {
  name?: string;
  email?: string;
}

export function getUserName(user: User | null): string {
  if (!user) return "Guest";
  return user.name || user.email || "User";
}
