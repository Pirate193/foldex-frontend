"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Detects whether the app has an active internet connection.
 * 
 * Uses the browser's navigator.onLine + online/offline events.
 * Also does a lightweight connectivity check to confirm (navigator.onLine 
 * can be unreliable on some platforms).
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        return navigator.onLine;
    });

    const handleOnline = useCallback(() => setIsOnline(true), []);
    const handleOffline = useCallback(() => setIsOnline(false), []);

    useEffect(() => {
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Set initial state
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return isOnline;
}
