import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "/api" : "https://sololink-0jy9.onrender.com/api",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await axiosInstance.post("/auth/refresh");
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Silent refresh failed (refresh token expired/revoked) - clear auth state
        try {
          const { useAuthStore } = await import("../store/useAuthStore");
          useAuthStore.getState().logout();
        } catch (e) {
          console.error("Failed to automatically logout after expired refresh token:", e);
        }
      }
    }
    return Promise.reject(error);
  }
);
