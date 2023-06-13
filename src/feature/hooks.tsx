import { Models } from "appwrite";
import api from "./api";
import { QueryKey, useQuery, useQueryClient } from "react-query";
import { Dispatch, SetStateAction } from "react";

export function useQstate<T>(
  key: QueryKey,
  initial?: T
): [T, Dispatch<SetStateAction<T>>] {
  const stateValue = useQuery<T>(key, {
    enabled: false,
    ...(initial !== undefined ? { initialData: initial } : {}),
  }).data as T;
  const queryClient = useQueryClient();
  const stateSetter = (arg: ((arg: T) => void) | T): void => {
    let newValue;
    if (typeof arg === "function") {
      const prevValue = queryClient.getQueryData<T>(key);
      newValue = (arg as any)(prevValue);
    } else {
      newValue = arg;
    }
    queryClient.setQueryData<T>(key, newValue);
  };
  return [stateValue, stateSetter];
}
