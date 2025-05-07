import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for handling cookies
});

// Add a request interceptor to include the token from cookies in the Authorization header
// and also in a custom header that the backend can use to extract the token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token from cookies
    const token = Cookies.get("token");

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
