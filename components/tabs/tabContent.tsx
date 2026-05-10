'use client';

import { useTabStore, Tab } from '@/stores/tabstore';
import { Spinner } from '@/components/ui/spinner';
import dynamic from 'next/dynamic';

// Lazy load heavy content components to keep tabs snappy
const NoteContentInner = dynamic(() => import('./content/NoteContentInner'), { 
  loading: () => <ContentSpinner />,
  ssr: false 
});
const VideoContentInner = dynamic(() => import('./content/videocontentinner'), { 
  loading: () => <ContentSpinner />,
  ssr: false 
});


function ContentSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Spinner className="size-8" />
    </div>
  );
}

/**
 * Renders ALL open tabs simultaneously, hiding inactive ones with CSS.
 * This keeps components mounted so video playback, PDF scroll positions,
 * and flashcard study progress are preserved when switching tabs.
 */
export function TabContent() {
  const { tabs, activeTabId } = useTabStore();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden relative">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className="absolute inset-0 h-full w-full"
          style={{ 
            display: tab.id === activeTabId ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <TabRenderer tab={tab} />
        </div>
      ))}
    </div>
  );
}

function TabRenderer({ tab }: { tab: Tab }) {
  switch (tab.type) {
    case 'note':
      return (
        <NoteContentInner
          noteId={tab.itemId}
          folderId={tab.folderId || undefined}
        />
      );
    case 'video':
      return (
        <VideoContentInner
          videoId={tab.itemId}
          folderId={tab.folderId || undefined}
        />
      );
    default:
      return <div className="p-4">Unknown content type</div>;
  }
}