import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "/api" : "https://sololink-0jy9.onrender.com/api",
  withCredentials: true,
});
