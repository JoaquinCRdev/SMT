import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const shouldRefresh =
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/refresh") &&
      !original.url?.includes("/login") &&
      !original.url?.includes("/register");

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      refreshing =
        refreshing ||
        api.post("/refresh").then(({ data }) => {
          localStorage.setItem("accessToken", data.accessToken);
          return data.accessToken;
        });

      const newToken = await refreshing;
      refreshing = null;

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (err) {
      refreshing = null;
      localStorage.removeItem("accessToken");
      window.location.href = "/auth";
      return Promise.reject(err);
    }
  },
);

export default api;