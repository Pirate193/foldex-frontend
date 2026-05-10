import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { videoapi } from "@/lib/api"
import { FeedbackBody } from "@/lib/api-types"

// ============================================
// QUERIES
// ============================================

export function useMyVideos(folderId?: string) {
    return useQuery({
        queryKey: folderId
            ? [...queryKeys.videos.mine(), folderId]
            : queryKeys.videos.mine(),
        queryFn: async () => {
            let mappedFolderId = folderId;
            let isDesktop = false;
            
            try {
                const { isDesktopApp } = await import("@/lib/isdesktop");
                isDesktop = isDesktopApp();
                
                if (isDesktop) {
                    const { getLocalDb } = await import("@/lib/localdb");
                    const { syncMap } = await import("@/lib/schema.local");
                    const { eq } = await import("drizzle-orm");
                    
                    const db = await getLocalDb();
                    const folderMappings = await db.select().from(syncMap).where(eq(syncMap.tableName, "folders"));
                    const localToCloud = new Map(folderMappings.map(m => [m.localId, m.cloudId]));
                    const cloudToLocal = new Map(folderMappings.map(m => [m.cloudId, m.localId]));

                    if (folderId) {
                        mappedFolderId = localToCloud.get(folderId) || folderId;
                    }

                    const videos = await videoapi.my(mappedFolderId);

                    for (let video of videos) {
                        if (video.folderId) {
                            video.folderId = cloudToLocal.get(video.folderId) || video.folderId;
                        }
                    }
                    
                    return videos;
                }
            } catch (e) {
                console.error("Desktop mapping failed in useMyVideos:", e);
            }

            return videoapi.my(mappedFolderId);
        },
    })
}

export function usePublicVideos() {
    return useQuery({
        queryKey: queryKeys.videos.public(),
        queryFn: () => videoapi.public(),
    })
}

export function useVideo(id: string) {
    return useQuery({
        queryKey: queryKeys.videos.detail(id),
        queryFn: () => videoapi.get(id),
        enabled: !!id,
    })
}

export function useVideoStatus(id: string, enabled: boolean = false) {
    return useQuery({
        queryKey: [...queryKeys.videos.detail(id), "status"],
        queryFn: () => videoapi.getstatus(id),
        enabled: enabled && !!id,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 3000;
            // Stop polling once we reach a terminal state
            if (data.status === "ready" || data.status === "failed") return false;
            return 3000;
        },
    })
}

// ============================================
// MUTATIONS
// ============================================

export function useDeleteVideo() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => videoapi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.videos.all })
        },
    })
}

export function useUpdateVideo() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { folderId?: string | null; isPublic?: boolean } }) => {
            let finalData = { ...data };
            
            // If we are on desktop, the incoming folderId is likely a local SQLite ID.
            // We must map it to the cloud ID before sending it to the backend.
            if (finalData.folderId !== undefined) {
                // We use dynamic imports to prevent breaking web builds
                const { isDesktopApp } = await import("@/lib/isdesktop");
                if (isDesktopApp() && finalData.folderId !== null) {
                    try {
                        const { getLocalDb } = await import("@/lib/localdb");
                        const { syncMap } = await import("@/lib/schema.local");
                        const { and, eq } = await import("drizzle-orm");
                        
                        const db = await getLocalDb();
                        const [row] = await db.select().from(syncMap)
                            .where(and(eq(syncMap.localId, finalData.folderId), eq(syncMap.tableName, "folders")));
                            
                        if (row && row.cloudId) {
                            finalData.folderId = row.cloudId;
                        }
                    } catch (e) {
                        console.error("Failed to map local folderId to cloudId for video update:", e);
                    }
                }
            }

            return videoapi.update(id, { id, ...finalData });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.videos.all })
        },
    })
}

export function useSubmitFeedback() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ videoId, body }: { videoId: string; body: FeedbackBody }) =>
            videoapi.submitFeedback(videoId, body),
        onSuccess: (_, variables) => {
            // Refresh the specific video and feedback cache
            queryClient.invalidateQueries({ queryKey: queryKeys.videos.detail(variables.videoId) })
        },
    })
}

export function useUserFeedback(videoId: string) {
    return useQuery({
        queryKey: [...queryKeys.videos.detail(videoId), "feedback"],
        queryFn: () => videoapi.getFeedback(videoId),
        enabled: !!videoId,
    })
}
