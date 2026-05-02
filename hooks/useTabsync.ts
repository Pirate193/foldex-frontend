'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTabStore } from '@/stores/tabstore';
import { parseTabFromUrl } from './useTabNavigation';

/**
 * Hook that synchronizes the browser URL with the tab store.
 *
 * Responsibilities:
 * 1. On initial mount, if the current URL matches a tab-compatible route
 *    and no tabs exist yet, open it as the first tab.
 * 2. When the active tab changes, update the browser URL.
 * 3. Handle browser back/forward navigation by syncing with tab store.
 */
export function useTabSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tabs, activeTabId, openTab, setActiveTab } = useTabStore();
  const isInitialized = useRef(false);

  // Build the full URL string from pathname + search params for parsing
  const fullUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  // 1. On initial page load, sync URL → tab store
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const parsed = parseTabFromUrl(fullUrl);
    if (!parsed) return;

    // Check if a tab for this URL already exists
    const tabId = `${parsed.type}-${parsed.itemId}`;
    const existingTab = tabs.find((t) => t.id === tabId);

    if (existingTab) {
      // Tab already exists, just activate it
      if (activeTabId !== tabId) {
        setActiveTab(tabId);
      }
    } else if (tabs.length === 0) {
      // No tabs exist; open the current URL as the first tab
      // Title is a placeholder — will be updated by the content component
      openTab({
        type: parsed.type,
        itemId: parsed.itemId,
        folderId: parsed.folderId,
        title: getDefaultTitle(parsed.type),
        url: fullUrl,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Listen for popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const currentUrl = window.location.pathname + window.location.search;
      const parsed = parseTabFromUrl(currentUrl);
      if (!parsed) return;

      const tabId = `${parsed.type}-${parsed.itemId}`;
      const existingTab = tabs.find((t) => t.id === tabId);

      if (existingTab) {
        setActiveTab(tabId);
      } else {
        openTab({
          type: parsed.type,
          itemId: parsed.itemId,
          folderId: parsed.folderId,
          title: getDefaultTitle(parsed.type),
          url: currentUrl,
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tabs, setActiveTab, openTab]);
}

function getDefaultTitle(type: string): string {
  switch (type) {
    case 'note': return 'Note';
    default: return 'Tab';
  }
}