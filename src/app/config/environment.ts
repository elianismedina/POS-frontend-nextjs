export const environment = {
  production: process.env.NODE_ENV === "production",
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://pos-backend-hexagonal.onrender.com",
  authUrl: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/auth`
    : "https://pos-backend-hexagonal.onrender.com/auth",
  usersUrl: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/users`
    : "https://pos-backend-hexagonal.onrender.com/users",
};
