import axios from "axios";

// FastAPI backend origin
export const api = axios.create({
  baseURL: "http://127.0.0.1:5001",
});
