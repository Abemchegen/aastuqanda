// authapi.ts
// Authentication related API endpoints for the Campus Q&A React project

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// Register new user
export const registerUser = async (data: {
  email: string;
  password: string;
  username: string;
}) => {
  const response = await axios.post(`${API_BASE}/auth/register`, data);
  console.log("registerUser response", response.data);
  return response.data;
};

// Login user (email + password)
export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await axios.post(`${API_BASE}/auth/login`, data);
  console.log("loginUser response", response.data);
  return response.data;
};

// Refresh token
export const refreshToken = async (token: string) => {
  const response = await axios.post(`${API_BASE}/auth/refresh-token`, { token });
  console.log("refreshToken response", response.data);
  return response.data;
};

// Get current authenticated user profile
export const getMe = async (accessToken: string) => {
  const response = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log("getMe response", response.data);
  return response.data;
};

// Logout user
export const logoutUser = async (accessToken: string) => {
  const response = await axios.post(
    `${API_BASE}/auth/logout`,
    {},
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  console.log("logoutUser response", response.data);
  return response.data;
};

// Resend verification email
export const resendVerificationEmail = async (email: string) => {
  const response = await axios.post(`${API_BASE}/auth/resend-verification`, {
    email,
  });
  console.log("resendVerificationEmail response", response.data);
  return response.data;
};

// Verify email using token
export const verifyEmail = async (token: string) => {
  const response = await axios.get(`${API_BASE}/auth/verify-email`, {
    params: { token },
  });
  console.log("verifyEmail response", response.data);
  return response.data;
};


// Delete account
export const deleteAccount = async (token: string) => {
  const response = await axios.delete(`${API_BASE}/auth/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("deleteAccount response", response.data);
  return response.data;
};
