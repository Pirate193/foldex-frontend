"use client";

import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        return navigator.onLine;
    });

    // 1. The Active Ping Function
    const verifyConnection = useCallback(async () => {
        // If the browser already knows the Wi-Fi is off, don't bother pinging.
        if (!navigator.onLine) {
            setIsOnline(false);
            return;
        }

        try {
            // Attempt to reach a fast, reliable server (Cloudflare's trace endpoint is great for this)
            // Adding a random timestamp (?t=...) forces the browser to actually check the web 
            // instead of returning a cached success response.
            await fetch(`https://1.1.1.1/cdn-cgi/trace?t=${new Date().getTime()}`, {
                method: "HEAD", 
                cache: "no-store" 
            });
            
            // If the fetch succeeds, we have real internet!
            setIsOnline(true);
        } catch (error) {
            // If the fetch fails (timeout or network error), we are in "Lie-Fi"
            setIsOnline(false);
        }
    }, []);

    useEffect(() => {
        // Run the check immediately when the app loads
        verifyConnection();

        // 2. When the browser *thinks* Wi-Fi reconnected, verify it first!
        window.addEventListener("online", verifyConnection);
        
        // 3. If the browser knows the Wi-Fi physically disconnected, trust it instantly.
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("offline", handleOffline);

        // 4. (Optional but recommended) Re-verify every 30 seconds just to be safe
        const interval = setInterval(verifyConnection, 30000); 

        return () => {
            window.removeEventListener("online", verifyConnection);
            window.removeEventListener("offline", handleOffline);
            clearInterval(interval);
        };
    }, [verifyConnection]);

    return isOnline;
}