import { User } from "../services/auth.service";

export function getUserName(user: User | null): string {
  if (!user) {
    console.log("getUserName - User is null, returning 'User'");
    return "User";
  }

  const name = user.name;
  console.log("getUserName - Name value:", name, "Type:", typeof name);

  if (typeof name === "object" && name !== null) {
    if ("value" in name) {
      const value = (name as { value: unknown }).value;
      console.log("getUserName - Name.value:", value, "Type:", typeof value);
      if (typeof value === "string" && value.trim() !== "") {
        return value;
      }
      console.warn("getUserName - Invalid name.value, returning 'User'");
      return "User";
    }
    console.warn(
      "getUserName - Name is object but no value property, returning 'User'"
    );
    return "User";
  }

  const result = typeof name === "string" && name.trim() !== "" ? name : "User";
  console.log("getUserName - Final result:", result);
  return result;
}
