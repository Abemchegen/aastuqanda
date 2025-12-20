// use-auth-api.ts
// React hooks wrapping authentication API calls

import { useState, useCallback } from "react";
import {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  logoutUser,
  resendVerificationEmail,
  verifyEmail as verifyEmailApi,
} from "../api/authapi"

export const useAuthAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: {
    email: string;
    password: string;
    username: string;
  }) => {
    try {
      setLoading(true);
      const res = await registerUser(data);
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: { email: string; password: string }) => {
    try {
      setLoading(true);
      const res = await loginUser(data);
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async (token: string) => {
    try {
      setLoading(true);
      const res = await refreshToken(token);
      return res;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async (token: string) => {
    try {
      setLoading(true);
      const res = await getMe(token);
      return res;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (token: string) => {
    try {
      setLoading(true);
      const res = await logoutUser(token);
      return res;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    try {
      setLoading(true);
      const res = await resendVerificationEmail(email);
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = useCallback(async (token: string) => {
    try {
      setLoading(true);
      const res = await verifyEmailApi(token);
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    register,
    login,
    refresh,
    getCurrentUser,
    logout,
    resendVerification,
    verifyEmail,
  };
};
