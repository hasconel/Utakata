"use client";
import api from "./api";
import { useQuery } from "react-query";

export const getLoginUser = () => {
  const { isLoading, isError, data, error } = useQuery("user", async () => {
    try {
      const LoginUser = await api.getAccount();
      return LoginUser;
    } catch {}
  });
  return { isLoading, isError, data, error };
};
