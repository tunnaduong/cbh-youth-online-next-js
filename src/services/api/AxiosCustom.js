import axios from "axios";

// Hàm tạo một instance của axios với cấu hình tùy chỉnh
const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
});

axiosInstance.interceptors.request.use((config) => {
  try {
    // Check if we're running on the client side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("TOKEN") || "";
      config.headers.Authorization = `Bearer ${token}`;
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
          // Optionally reload the page to reflect the logout status
          // window.location.reload();
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
