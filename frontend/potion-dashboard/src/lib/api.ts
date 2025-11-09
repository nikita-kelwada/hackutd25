// src/lib/api.ts
import axios from 'axios';

// Your backend runs on port 5001 according to main.py
const API_URL = 'http://localhost:5001';

export const api = axios.create({
  baseURL: API_URL,
});