import axios from "axios";
import { environment } from "../app/config/environment";
import { authService } from "../app/services/auth.service";

console.log("API Client - Base URL:", environment.apiUrl);

export const api = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
  validateStatus: (status) => {
    return status >= 200 && status < 500; // Accept all responses to handle errors in interceptors
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshToken = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    console.log(
      "API Client - Request interceptor - Token:",
      token ? "Present" : "Missing"
    );

    if (token) {
      // Log token details (safely)
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log("Token payload:", {
            exp: new Date(payload.exp * 1000).toISOString(),
            role: payload.role,
            businessId: payload.businessId,
            branchId: payload.branchId,
          });
        }
      } catch (e) {
        console.error("Error parsing token:", e);
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add cache-busting parameter for GET requests
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
    }

    // Ensure Content-Type is set for non-GET requests
    if (config.method !== "get") {
      config.headers["Content-Type"] = "application/json";
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
      data: config.data,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error("API Client - Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging and token refresh
api.interceptors.response.use(
  (response) => {
    console.log("API Client - Response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(
        "401 Unauthorized error received, attempting token refresh..."
      );

      if (isRefreshing) {
        console.log("Token refresh already in progress, waiting...");
        // If token refresh is in progress, wait for it to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            console.log("Token refresh completed, retrying original request");
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          console.error("No refresh token available");
          throw new Error("No refresh token available");
        }

        console.log("Attempting to refresh token...");
        const { accessToken } = await authService.refreshToken(refreshToken);
        console.log("Token refresh successful");

        localStorage.setItem("accessToken", accessToken);
        onRefreshToken(accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear auth data and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log other errors
    if (error.response) {
      console.error("API Client - Response error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: {
            ...error.config?.headers,
            Authorization: error.config?.headers?.Authorization
              ? "Bearer [REDACTED]"
              : undefined,
          },
          data: error.config?.data,
        },
      });
    } else if (error.request) {
      console.error("API Client - No response received:", error.request);
    } else {
      console.error("API Client - Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);
