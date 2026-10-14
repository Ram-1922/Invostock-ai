import { apiClient } from "./apiClient";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

// ------------------------------------------------------------------ types
type QueueEntry<T = any> = {
  execute: () => Promise<AxiosResponse<T>>;
  resolve: (value: AxiosResponse<T>) => void;
  reject: (reason?: any) => void;
  signal?: AbortSignal;
};

// ---------------------------------------------------- helper: detect abort
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  // Axios wraps cancellation in its own error type
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === "ERR_CANCELED"
  )
    return true;
  return false;
}

// ---------------------------------------------------------- queue singleton
class ApiQueue {
  private queue: QueueEntry[] = [];
  private processing = false;

  /**
   * Push a request into the queue.
   * It will only execute once every earlier request has finished.
   * If `signal` is already aborted the request is rejected immediately.
   */
  enqueue<T = any>(
    requestFn: () => Promise<AxiosResponse<T>>,
    signal?: AbortSignal
  ): Promise<AxiosResponse<T>> {
    return new Promise<AxiosResponse<T>>((resolve, reject) => {
      // Already cancelled — fast-path
      if (signal?.aborted) {
        reject(new DOMException("Request aborted", "AbortError"));
        return;
      }

      const entry: QueueEntry<T> = {
        execute: requestFn,
        resolve,
        reject,
        signal,
      };

      // If the signal fires while the entry is still *waiting* in the queue,
      // yank it out so we never send it.
      const onAbort = () => {
        const idx = this.queue.indexOf(entry as QueueEntry);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          reject(new DOMException("Request aborted", "AbortError"));
        }
        // If it's not in the queue it's already being executed — axios will
        // handle the cancellation via the signal passed to it.
      };

      signal?.addEventListener("abort", onAbort, { once: true });

      this.queue.push(entry as QueueEntry);
      this.drain();
    });
  }

  // ---------------------------------------- internal: process one-at-a-time
  private async drain() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const entry = this.queue.shift()!;

      // Double-check: may have been aborted between enqueue and now
      if (entry.signal?.aborted) {
        entry.reject(new DOMException("Request aborted", "AbortError"));
        continue;
      }

      try {
        const result = await entry.execute();
        entry.resolve(result);
      } catch (err) {
        entry.reject(err);
      }
    }

    this.processing = false;
  }
}

export const apiQueue = new ApiQueue();

// ------------------------------------------------------ convenience helpers
// Wrappers that route through the queue AND forward an AbortSignal to axios.

export function queueGet<T = any>(
  url: string,
  signal?: AbortSignal,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return apiQueue.enqueue(
    () => apiClient.get<T>(url, { ...config, signal }),
    signal
  );
}

export function queuePost<T = any>(
  url: string,
  data?: any,
  signal?: AbortSignal,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return apiQueue.enqueue(
    () => apiClient.post<T>(url, data, { ...config, signal }),
    signal
  );
}

export function queuePut<T = any>(
  url: string,
  data?: any,
  signal?: AbortSignal,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return apiQueue.enqueue(
    () => apiClient.put<T>(url, data, { ...config, signal }),
    signal
  );
}

export function queueDelete<T = any>(
  url: string,
  signal?: AbortSignal,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return apiQueue.enqueue(
    () => apiClient.delete<T>(url, { ...config, signal }),
    signal
  );
}
