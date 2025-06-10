export const environment = {
  production: process.env.NODE_ENV === "production",
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://pos-backend-hexagonal.onrender.com/api/v1",
  authUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://pos-backend-hexagonal.onrender.com/api/v1",
  usersUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://pos-backend-hexagonal.onrender.com/api/v1",
};
