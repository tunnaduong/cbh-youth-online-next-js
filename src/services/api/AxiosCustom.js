import axios from "axios";

// Hàm tạo một instance của axios với cấu hình tùy chỉnh
const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1.0`,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("TOKEN") || "";
  config.headers.Authorization = `Bearer ${token}`;

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    error.response
      ? console.error("API Error:", error.response)
      : console.error("Unknown Error:", error);

    if (error.response && error.response.status === 401) {
      //WHEN: ERROR 401 (Unauthorized)
      localStorage.removeItem("TOKEN");
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
