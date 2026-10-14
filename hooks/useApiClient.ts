"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  queueGet,
  queuePost,
  queuePut,
  queueDelete,
  isAbortError,
} from "@/_lib/apiQueue";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * `useApiClient` — a React hook that provides sequential, auto-aborting API
 * helpers.
 *
 * • Every call goes through the global `apiQueue` so only ONE request is
 *   in-flight at any time across the whole application.
 *
 * • An `AbortController` is created when the component mounts and aborted
 *   when it unmounts (e.g. user navigates away).  Any requests that are
 *   still pending (in-queue or in-flight) are cancelled automatically.
 *
 * • The `signal` is also exposed so you can pass it to raw `fetch()` or
 *   check `signal.aborted` before updating state after an async gap.
 *
 * Usage:
 * ```tsx
 * const api = useApiClient();
 *
 * useEffect(() => {
 *   api.get("/api/dashboard")
 *     .then(res => { if (!api.signal.aborted) setData(res.data); })
 *     .catch(err => { if (!isAbortError(err)) console.error(err); });
 * }, []);
 * ```
 */
export function useApiClient() {
  const controllerRef = useRef<AbortController | null>(null);

  if (!controllerRef.current || controllerRef.current.signal.aborted) {
    controllerRef.current = new AbortController();
  }

  useEffect(() => {
    // If remounted in StrictMode with an aborted controller, re-initialize
    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController();
    }

    return () => {
      // Abort everything this component started when it unmounts
      controllerRef.current?.abort();
    };
  }, []);

  // ----- wrappers that funnel through the queue + attach the signal ------

  const get = useCallback(
    <T = any>(
      url: string,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> =>
      queueGet<T>(url, controllerRef.current?.signal, config),
    []
  );

  const post = useCallback(
    <T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> =>
      queuePost<T>(url, data, controllerRef.current?.signal, config),
    []
  );

  const put = useCallback(
    <T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> =>
      queuePut<T>(url, data, controllerRef.current?.signal, config),
    []
  );

  const del = useCallback(
    <T = any>(
      url: string,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> =>
      queueDelete<T>(url, controllerRef.current?.signal, config),
    []
  );

  /**
   * A `fetch()` wrapper that also respects the queue-less AbortSignal for
   * external URLs (e.g. ipapi.co) that don't need to share the queue with
   * your own API.
   */
  const safeFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
      fetch(input, { ...init, signal: controllerRef.current?.signal }),
    []
  );

  return {
    get,
    post,
    put,
    del,
    safeFetch,
    get signal(): AbortSignal {
      return controllerRef.current!.signal;
    },
    isAbortError,
  };
}
