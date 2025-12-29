// use-auth-api.ts
// React hooks wrapping authentication API calls

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  logoutUser,
  resendVerificationEmail,
  verifyEmail as verifyEmailApi,
  deleteAccount as deleteAccountApi,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
} from "../api/authapi"

export const useAuthAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
      toast({
        title: "Registration Failed",
        description: err.response?.data?.error || err.message || "Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Login Failed",
        description: err.response?.data?.error || err.message || "Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Resend Failed",
        description: err.response?.data?.error || err.message || "Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      const res = await forgotPasswordApi(email);
      return res;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Request Failed",
        description: err.response?.data?.error || err.message || "Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      const res = await resetPasswordApi(token, newPassword);
      return res;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Reset Failed",
        description: err.response?.data?.error || err.message || "Please try again.",
        variant: "destructive",
      });
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

  const deleteAccount = async (token: string) => {
    try {
      setLoading(true);
      const res = await deleteAccountApi(token);
      return res;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Delete Failed",
        description: err.response?.data?.error || err.message || "Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    register,
    login,
    refresh,
    getCurrentUser,
    logout,
    resendVerification,
    forgotPassword,
    resetPassword,
    verifyEmail,
    deleteAccount,
  };
};
