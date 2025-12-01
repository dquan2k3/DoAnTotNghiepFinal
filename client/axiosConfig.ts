import axios from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
});

// ✅ Interceptor cho request
instance.interceptors.request.use(
  (config) => config,
  (error) => {
    console.error("🚨 Request Error:", error);
    return Promise.reject(error);
  }
);

// ✅ Interceptor cho response
instance.interceptors.response.use(
  (response) => response, // Trả về response nếu thành công
  (error) => {
    // Kiểm tra có phản hồi từ server không
    if (error.response) {
      console.error("❌ Server Error Response:");
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("❌ No Response from Server:");
      console.error(error.request);
    } else {
      console.error("❌ Axios Config Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default instance;
