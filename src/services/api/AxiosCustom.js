import axios from "axios";
import { getTokenFromAnywhere } from "@/utils/cookies";

// Hàm tạo một instance của axios với cấu hình tùy chỉnh
const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
  headers: {
    "X-From-Frontend": "true",
  },
});

axiosInstance.interceptors.request.use((config) => {
  try {
    // Check if we're running on the client side
    if (typeof window !== "undefined") {
      const token = getTokenFromAnywhere();
      // Only add Authorization header if token exists and is not empty
      if (token && token.trim() !== "") {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  } catch (error) {
    console.error("Error in request interceptor:", error);
    throw error;
  }
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    try {
      if (typeof window !== "undefined") {
        if (error.response && error.response.status === 401) {
          // WHEN: ERROR 401 (Unauthorized)
          localStorage.removeItem("TOKEN");
          localStorage.removeItem("CURRENT_USER");
          // Also clear cookies
          const { removeAuthCookie } = require("@/utils/cookies");
          removeAuthCookie();
          // Optionally reload the page to reflect the logout status
          // window.location.reload();
          if (window.location.pathname !== "/login")
            window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    } catch (interceptorError) {
      console.error("Error in response interceptor:", interceptorError);
      throw interceptorError;
    }
  }
);

export default axiosInstance;
