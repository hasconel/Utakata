"use client";
import { Models } from "appwrite";
import { useLayoutEffect, useReducer } from "react";
import api from "./api";
export const fetchState = {
  init: 0,
  success: 1,
  failure: 2,
};

type fetch = readonly [
  {
    readonly user: Models.User<Models.Preferences> | null;
    readonly isLoading: boolean;
    readonly isError: boolean;
  },
  React.Dispatch<{
    type: number;
    payload?: Models.User<Models.Preferences>;
  }>
];
export const useGetUser = (): fetch => {
  const Reducer: React.Reducer<any, { type: number; payload?: any }> = (
    state: any,
    action: { type: number; payload?: any }
  ) => {
    switch (action.type) {
      case fetchState.init:
        return { ...state, isLoading: true, isError: false };
      case fetchState.success:
        return {
          ...state,
          isLoading: false,
          isError: false,
          user: action.payload,
        };
      case fetchState.failure:
        return { ...state, isLoading: false, isError: true };
      default:
        throw new Error();
    }
  };

  const [state, dispatch] = useReducer(Reducer, {
    isLoading: false,
    isError: true,
  });

  useLayoutEffect(() => {
    let didCancel: Boolean = false;
    const getUser = async () => {
      try {
        const account = await api.getAccount();
        if (!didCancel) {
          dispatch({ type: fetchState.success, payload: account });
        }
      } catch (e) {
        if (!didCancel) {
          dispatch({ type: fetchState.failure, payload: null });
        }
      }
    };
    getUser();
    return () => {
      didCancel = true;
    };
  }, []);

  return [state, dispatch];
};
