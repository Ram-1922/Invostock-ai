"use client";

import { useEffect, useState } from "react";
import RateLimitModal from "./RateLimitModal";

export default function RateLimitListener() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    retryAfterSeconds: number;
    action: string;
  }>({
    isOpen: false,
    retryAfterSeconds: 60,
    action: "",
  });

  useEffect(() => {
    const handleRateLimit = (event: Event) => {
      const customEvent = event as CustomEvent<{ retryAfterSeconds: number, action: string }>;
      setModalState({
        isOpen: true,
        retryAfterSeconds: customEvent.detail?.retryAfterSeconds || 60,
        action: customEvent.detail?.action || "general_api",
      });
    };

    window.addEventListener("rateLimitTriggered", handleRateLimit);
    return () => window.removeEventListener("rateLimitTriggered", handleRateLimit);
  }, []);

  return (
    <RateLimitModal
      isOpen={modalState.isOpen}
      retryAfterSeconds={modalState.retryAfterSeconds}
      action={modalState.action}
      onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
    />
  );
}