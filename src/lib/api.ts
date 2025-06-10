import axios from "axios";
import { environment } from "../app/config/environment";

console.log("API Client - Base URL:", environment.apiUrl);

export const api = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    console.log(
      "API Client - Request interceptor - Token:",
      token ? "Present" : "Missing"
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("API Client - Request config:", {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization
          ? "Bearer [REDACTED]"
          : undefined,
      },
    });
    return config;
  },
  (error) => {
    console.error("API Client - Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("API Client - Response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Client - Response error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: {
            ...error.config?.headers,
            Authorization: error.config?.headers?.Authorization
              ? "Bearer [REDACTED]"
              : undefined,
          },
        },
      });

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.error(
          "API Client - Unauthorized access. Token may be invalid or expired."
        );
        // You might want to redirect to login here
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Client - No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Client - Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);
