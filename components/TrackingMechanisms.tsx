"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useApiClient } from "@/hooks/useApiClient";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    snaptr: any;
    [key: string]: any;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const SNAP_PIXEL_ID = process.env.NEXT_PUBLIC_SNAP_PIXEL_ID;

// Map real routes to clean, PII-free page info[cite: 6]
// Dynamic routes like /invoices/INV-1042 are collapsed to /invoices/:id[cite: 6]
function getPageInfo(pathname: string) {
  if (pathname.startsWith("/invoices/")) {
    return { path: "/invoices/:id", group: "Invoice Detail" };
  }
  if (pathname === "/invoices") return { path: pathname, group: "Invoices" };
  if (pathname.startsWith("/inventory")) return { path: pathname, group: "Inventory" };
  if (pathname.startsWith("/dashboard")) return { path: pathname, group: "Dashboard" };
  return { path: pathname, group: "Other" };
}

function getDeviceInfo() {
  if (typeof window === "undefined") return {};

  // 1. Persistent Device ID (UUID stored in localStorage)
  let deviceId = "";
  try {
    deviceId = localStorage.getItem("invostock_device_id") || "";
    if (!deviceId) {
      deviceId =
        typeof crypto?.randomUUID === "function"
          ? crypto.randomUUID()
          : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("invostock_device_id", deviceId);
    }
  } catch {
    deviceId = `dev_${Date.now()}`;
  }

  const ua = navigator.userAgent;

  // 2. Browser & Version Detection
  let browser = "Unknown Browser";
  let browserVersion = "";
  if (/edg\/([\d.]+)/i.test(ua)) {
    browser = "Microsoft Edge";
    browserVersion = ua.match(/edg\/([\d.]+)/i)?.[1] || "";
  } else if (/opr\/([\d.]+)|opera/i.test(ua)) {
    browser = "Opera";
    browserVersion = ua.match(/(?:opr|opera)[\/\s]([\d.]+)/i)?.[1] || "";
  } else if (/chrome\/([\d.]+)/i.test(ua)) {
    browser = "Google Chrome";
    browserVersion = ua.match(/chrome\/([\d.]+)/i)?.[1] || "";
  } else if (/firefox\/([\d.]+)/i.test(ua)) {
    browser = "Mozilla Firefox";
    browserVersion = ua.match(/firefox\/([\d.]+)/i)?.[1] || "";
  } else if (/version\/([\d.]+).*safari/i.test(ua)) {
    browser = "Apple Safari";
    browserVersion = ua.match(/version\/([\d.]+)/i)?.[1] || "";
  }

  // 3. Operating System Detection
  let os = "Unknown OS";
  if (/windows nt 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "ChromeOS";

  // 4. Form Factor (Desktop / Mobile / Tablet)
  let deviceType = "Desktop";
  const isMobile = /mobile|iphone|ipod|android.*mobile/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua) || (navigator.maxTouchPoints > 1 && /macintosh/i.test(ua));
  if (isTablet) deviceType = "Tablet";
  else if (isMobile) deviceType = "Mobile";

  // 5. Hardware & Display Specs
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const availableScreen = `${window.screen.availWidth}x${window.screen.availHeight}`;
  const colorDepth = `${window.screen.colorDepth}-bit`;
  const pixelRatio = window.devicePixelRatio || 1;
  const cpuCores = navigator.hardwareConcurrency || null;
  const deviceMemoryGB = (navigator as any).deviceMemory || null;
  const connectionType = (navigator as any).connection?.effectiveType || "unknown";
  const touchPoints = navigator.maxTouchPoints || 0;
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  return {
    deviceId,
    browser,
    browserVersion,
    browserFull: `${browser} ${browserVersion}`.trim(),
    os,
    deviceType,
    screenResolution,
    availableScreen,
    colorDepth,
    pixelRatio,
    cpuCores,
    deviceMemoryGB,
    connectionType,
    touchPoints,
    preferredTheme,
    language: navigator.language,
    languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
    userAgent: ua,
  };
}

export default function TrackingMechanisms() {
  const [consent, setConsent] = useState({ analytical: false, marketing: false });
  const pathname = usePathname();
  const api = useApiClient();
  const hasCapturedRef = useRef(false);

  const checkConsent = () => {
    try {
      const saved = Cookies.get("consent_preferences");
      if (!saved) {
        setConsent({ analytical: false, marketing: false });
        return;
      }
      let parsed: any = {};
      try {
        parsed = JSON.parse(saved);
      } catch {
        parsed = JSON.parse(decodeURIComponent(saved));
      }
      setConsent({ analytical: !!parsed.analytical, marketing: !!parsed.marketing });
    } catch {
      setConsent({ analytical: false, marketing: false });
    }
  };

  useEffect(() => {
    checkConsent();
    window.addEventListener("consentUpdated", checkConsent);
    return () => window.removeEventListener("consentUpdated", checkConsent);
  }, []);

  // ---- Google Analytics: load once analytics consent is granted[cite: 6] ----
  useEffect(() => {
    if (!GA_ID) {
      console.error("GA ID missing. Set NEXT_PUBLIC_GA_MEASUREMENT_ID and restart the dev server.");
      return;
    }
    window[`ga-disable-${GA_ID}`] = !consent.analytical; // opt-out switch[cite: 6]
    if (!consent.analytical) return;
    if (document.getElementById("ga-script")) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false }); // page views sent manually below[cite: 6]

    const script = document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.onerror = () => console.error("GA script blocked or failed to load.");
    document.head.appendChild(script);
  }, [consent.analytical]);

  // ---- GA page views on every route change[cite: 6] ----
  useEffect(() => {
    if (!GA_ID || !consent.analytical || typeof window.gtag !== "function") return;
    const { path, group } = getPageInfo(pathname);
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: `${window.location.origin}${path}`, // no raw IDs or query strings[cite: 6]
      page_title: document.title,
      content_group: group,
    });
  }, [pathname, consent.analytical]);

  // ---- Snapchat Pixel: only with marketing consent[cite: 6] ----
  useEffect(() => {
    if (!consent.marketing || !SNAP_PIXEL_ID) return;
    if (!window.snaptr) {
      (function (e: any, t: Document, n: string) {
        if (e.snaptr) return;
        const a: any = (e.snaptr = function () {
          a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments);
        });
        a.queue = [];
        const r = t.createElement("script");
        r.async = true;
        r.src = n;
        const u = t.getElementsByTagName("script")[0];
        u.parentNode!.insertBefore(r, u);
      })(window, document, "https://sc-static.net/scevent.min.js");
      window.snaptr("init", SNAP_PIXEL_ID, {});
    }
  }, [consent.marketing]);

  useEffect(() => {
    if (consent.marketing && typeof window.snaptr === "function") {
      window.snaptr("track", "PAGE_VIEW");
    }
  }, [pathname, consent.marketing]);

  // ---- IP Geolocation Tracking: only with marketing consent ----
  // Uses `api.safeFetch` so the request is automatically aborted if the
  // component unmounts (e.g. user navigates to a public route).
  useEffect(() => {
    // Only capture if marketing consent is explicitly granted
    if (!consent.marketing) return;
    if (hasCapturedRef.current) return;
    hasCapturedRef.current = true;

    const captureGeoData = async () => {
      try {
        const deviceInfo = getDeviceInfo();
        let geoInfo: any = {
          city: "Unknown",
          region: "Unknown",
          country: "Unknown",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
          organization: "Unknown",
          currency: "USD",
        };

        // Try primary geo endpoint (ipapi.co)
        let resolved = false;
        try {
          const response = await api.safeFetch("https://ipapi.co/json/");
          if (!api.signal.aborted && response.ok) {
            const geoData = await response.json();
            if (geoData && !geoData.error) {
              geoInfo = {
                city: geoData.city || geoInfo.city,
                region: geoData.region || geoInfo.region,
                country: geoData.country_name || geoInfo.country,
                timezone: geoData.timezone || geoInfo.timezone,
                organization: geoData.org || geoInfo.organization,
                currency: geoData.currency || geoInfo.currency,
              };
              resolved = true;
            }
          }
        } catch {
          // ipapi may be blocked by client-side ad-blockers or Cloudflare rate limits
        }

        // Secondary fallback if primary was rate-limited or blocked
        if (!resolved) {
          try {
            const fbResponse = await api.safeFetch("https://ipwho.is/");
            if (!api.signal.aborted && fbResponse.ok) {
              const fbData = await fbResponse.json();
              if (fbData && fbData.success) {
                geoInfo = {
                  city: fbData.city || geoInfo.city,
                  region: fbData.region || geoInfo.region,
                  country: fbData.country || geoInfo.country,
                  timezone: fbData.timezone?.id || geoInfo.timezone,
                  organization: fbData.connection?.org || geoInfo.organization,
                  currency: geoInfo.currency,
                };
              }
            }
          } catch {
            // Silently fall back to browser default timezone
          }
        }

        const combinedPayload = {
          ...deviceInfo,
          ...geoInfo,
          capturedAt: new Date().toISOString(),
        };

        console.log("[Tracking] Captured complete visitor profile:", combinedPayload);

        // Send to Next.js backend to store in HttpOnly cookie
        const res = await api.post("/api/analytics/track-visitor", combinedPayload);
        if (api.signal.aborted) return;

        console.log("[Tracking] HttpOnly marketing cookie saved successfully:", res.data);
      } catch (error) {
        hasCapturedRef.current = false; // Allow retry on failure
        if (api.isAbortError(error)) return;
        console.error("[Tracking] Failed to capture/store marketing cookie:", error);
      }
    };

    captureGeoData();
  }, [consent.marketing]); // Re-evaluates if the user updates their consent

  return null;
}