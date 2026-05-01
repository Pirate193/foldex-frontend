'use client';

import { useRouter } from 'next/navigation';
import { useTabStore, TabType, MAX_TABS } from '@/stores/tabstore';
import { useCallback } from 'react';
import { toast } from 'sonner';


/**
 * Build the URL for a given tab type + IDs.
 * Uses search params instead of dynamic route segments
 * for compatibility with Next.js static export.
 */
function buildTabUrl(
  type: TabType,
  itemId: string,
  folderId?: string,
): string {

  switch (type) {
    case 'note': {
      const params = new URLSearchParams({ id: itemId });
      if (folderId) params.set('folderId', folderId);
      return `/note?${params.toString()}`;
    }
    default:
      return '/';
  }
}

/**
 * Parse a URL (pathname + search) into tab info.
 * Returns null if not a tab-compatible route.
 * 
 * Accepts either:
 * - Just a pathname (for backward compat) 
 * - A full URL with search params (primary usage)
 */
export function parseTabFromUrl(pathnameOrUrl: string): {
  type: TabType;
  itemId: string;
  folderId?: string;
} | null {

  // Parse the URL to extract pathname and search params
  let pathname: string;
  let searchParams: URLSearchParams;

  try {
    // Handle full URLs and relative paths
    const url = new URL(pathnameOrUrl, 'http://localhost');
    pathname = url.pathname;
    searchParams = url.searchParams;
  } catch {
    pathname = pathnameOrUrl;
    searchParams = new URLSearchParams();
  }

  // New format: /note?id=xxx&folderId=yyy
  if (pathname === '/note') {
    const id = searchParams.get('id');
    if (id) {
      return {
        type: 'note',
        itemId: id,
        folderId: searchParams.get('folderId') || undefined,
      };
    }
  }

  // Legacy format support: /folders/xxx/note/yyy (for old persisted tabs)
  const noteMatch = pathname.match(
    /^\/folders\/([^/]+)\/note\/([^/]+)/,
  );
  if (noteMatch) {
    return {
      type: 'note',
      folderId: noteMatch[1],
      itemId: noteMatch[2],
    };
  }

  // Legacy format: /note/xxx
  const looseNoteMatch = pathname.match(/^\/note\/([^/]+)/);
  if (looseNoteMatch) {
    return {
      type: 'note',
      itemId: looseNoteMatch[1],
    };
  }

  return null;
}

/**
 * Hook that provides tab-aware navigation.
 * Instead of router.push(), components call openInTab() to open content in a tab.
 */
export function useTabNavigation() {
  const router = useRouter();
  const openTab = useTabStore((s) => s.openTab);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const tabs = useTabStore((s) => s.tabs);

  const openInTab = useCallback(
    (
      type: TabType,
      itemId: string,
      folderId: string | undefined,
      title: string,
    ) => {
      const url = buildTabUrl(type, itemId, folderId);

      const success = openTab({
        type,
        itemId,
        folderId,
        title,
        url,
      });

      if (!success) {
        toast.error(`Maximum of ${MAX_TABS} tabs reached. Close some tabs first.`);
        return;
      }

      window.history.pushState(null, '', url);
    },
    [openTab],
  );

  /**
   * Navigate to a tab that already exists (by ID).
   * Updates the URL to match.
   */
  const switchToTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        setActiveTab(tabId);
        window.history.replaceState(null, '', tab.url);
      }
    },
    [tabs, setActiveTab],
  );

  return { openInTab, switchToTab, buildTabUrl, router };
}