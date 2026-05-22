/**
 * Cloud Mirror — "Write-through" layer for the desktop app.
 * 
 * When a user is logged in on the desktop, every local mutation 
 * (create/update/delete) should also be mirrored to the cloud 
 * in the background so the data is available on the web.
 * 
 * Pattern:
 *   1. Local operation happens FIRST (instant UI)
 *   2. Cloud mirror fires in the background (fire-and-forget)
 *   3. Errors are logged but don't block the UI
 * 
 * For CREATE: push to cloud API → record localId↔cloudId in sync_map
 * For UPDATE/DELETE: lookup cloudId from sync_map → call cloud API with cloudId
 */

import { getLocalDb } from "../localdb";
import { syncMap } from "../schema.local";
import { and, eq } from "drizzle-orm";
import { folderapi, notesapi, chatapi, templateapi } from "../api";

// ─── Helpers ────────────────────────────────────────────────────

/** Check if user is logged in on desktop AND online */
function shouldMirror(): boolean {
    if (typeof window === "undefined") return false;
    if (!navigator.onLine) return false;  // Skip if offline
    return !!localStorage.getItem("foldex_user_id");
}

/** Get cloudId for a local item */
async function getCloudId(localId: string, table: string): Promise<string | null> {
    try {
        const db = await getLocalDb();
        const [row] = await db.select().from(syncMap)
            .where(and(eq(syncMap.localId, localId), eq(syncMap.tableName, table)));
        return row?.cloudId ?? null;
    } catch {
        return null;
    }
}

/** Record a local→cloud ID mapping */
async function recordSync(localId: string, cloudId: string, table: string) {
    try {
        const db = await getLocalDb();
        // Check if mapping already exists to avoid duplicates
        const [existing] = await db.select().from(syncMap)
            .where(and(eq(syncMap.localId, localId), eq(syncMap.tableName, table)));
        if (!existing) {
            await db.insert(syncMap).values({
                localId,
                cloudId,
                tableName: table,
                syncedAt: new Date(),
            });
        }
    } catch (e) {
        console.error("Failed to record sync mapping:", e);
    }
}

/** Remove a sync mapping (e.g. when deleting) */
async function removeSyncMapping(localId: string, table: string) {
    try {
        const db = await getLocalDb();
        await db.delete(syncMap)
            .where(and(eq(syncMap.localId, localId), eq(syncMap.tableName, table)));
    } catch (e) {
        console.error("Failed to remove sync mapping:", e);
    }
}

// ─── Folders ────────────────────────────────────────────────────

export async function mirrorCreateFolder(localId: string, data: {
    name: string;
    parentId?: string | null;
    isPinned?: boolean;
    color?: string;
}) {
    if (!shouldMirror()) return;
    try {
        // Remap parentId if it exists
        let cloudParentId: string | undefined = undefined;
        if (data.parentId) {
            cloudParentId = (await getCloudId(data.parentId, "folders")) ?? undefined;
        }
        const cloudFolder = await folderapi.create({
            name: data.name,
            parentId: cloudParentId,
            isPinned: data.isPinned,
            color: data.color,
        });
        await recordSync(localId, cloudFolder.id, "folders");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror folder create:", e);
    }
}

export async function mirrorUpdateFolder(localId: string, data: {
    name?: string;
    parentId?: string | null;
    isPinned?: boolean;
    color?: string;
}) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "folders");
        if (!cloudId) return; // Never been synced, will be caught on next full sync

        let cloudParentId: string | null | undefined = undefined;
        if (data.parentId !== undefined) {
            cloudParentId = data.parentId ? (await getCloudId(data.parentId, "folders")) : null;
        }

        await folderapi.update(cloudId, {
            name: data.name,
            parentId: cloudParentId,
            isPinned: data.isPinned,
            color: data.color,
        });
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror folder update:", e);
    }
}

export async function mirrorDeleteFolder(localId: string) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "folders");
        if (!cloudId) return;

        await folderapi.delete(cloudId);
        await removeSyncMapping(localId, "folders");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror folder delete:", e);
    }
}

// ─── Notes ──────────────────────────────────────────────────────

export async function mirrorCreateNote(localId: string, data: {
    title?: string;
    content?: any;
    folderId?: string;
    isPinned?: boolean;
}) {
    if (!shouldMirror()) return;
    try {
        let cloudFolderId: string | undefined = undefined;
        if (data.folderId) {
            cloudFolderId = (await getCloudId(data.folderId, "folders")) ?? undefined;
        }
        const cloudNote = await notesapi.create({
            title: data.title,
            content: data.content,
            folderId: cloudFolderId,
            isPinned: data.isPinned,
        });
        await recordSync(localId, cloudNote.id, "notes");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror note create:", e);
    }
}

export async function mirrorUpdateNote(localId: string, data: {
    title?: string;
    content?: any;
    folderId?: string | null;
    isPinned?: boolean;
}) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "notes");
        if (!cloudId) return;

        let cloudFolderId: string | null | undefined = undefined;
        if (data.folderId !== undefined) {
            cloudFolderId = data.folderId ? (await getCloudId(data.folderId, "folders")) : null;
        }

        await notesapi.update(cloudId, {
            title: data.title,
            content: data.content,
            folderId: cloudFolderId,
            isPinned: data.isPinned,
        });
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror note update:", e);
    }
}

export async function mirrorDeleteNote(localId: string) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "notes");
        if (!cloudId) return;

        await notesapi.delete(cloudId);
        await removeSyncMapping(localId, "notes");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror note delete:", e);
    }
}

export async function mirrorMoveNote(localId: string, folderId: string | null) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "notes");
        if (!cloudId) return;

        let cloudFolderId: string | null = null;
        if (folderId) {
            cloudFolderId = (await getCloudId(folderId, "folders")) ?? null;
        }

        await notesapi.move(cloudId, cloudFolderId);
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror note move:", e);
    }
}

// ─── Chats ──────────────────────────────────────────────────────

export async function mirrorCreateChat(localId: string, title: string) {
    if (!shouldMirror()) return;
    try {
        const cloudChat = await chatapi.create({ title });
        await recordSync(localId, cloudChat.id, "chats");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror chat create:", e);
    }
}

export async function mirrorUpdateChat(localId: string, title: string) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "chats");
        if (!cloudId) return;
        await chatapi.update(cloudId, { title });
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror chat update:", e);
    }
}

export async function mirrorDeleteChat(localId: string) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "chats");
        if (!cloudId) return;
        await chatapi.delete(cloudId);
        await removeSyncMapping(localId, "chats");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror chat delete:", e);
    }
}

export async function mirrorAddMessage(localChatId: string, localMsgId: string, body: {
    role: string;
    content: string;
    parts: any;
}) {
    if (!shouldMirror()) return;
    try {
        const cloudChatId = await getCloudId(localChatId, "chats");
        if (!cloudChatId) return;

        const cloudMsg = await chatapi.addmessage(cloudChatId, body);
        await recordSync(localMsgId, cloudMsg.id, "messages");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror message add:", e);
    }
}

// ─── Templates ──────────────────────────────────────────────────

export async function mirrorCreateTemplate(localId: string, data: {
    name: string;
    description?: string;
    schemapayload: any;
    isPublic?: boolean;
}) {
    if (!shouldMirror()) return;
    try {
        const cloudTmpl = await templateapi.create(data);
        await recordSync(localId, cloudTmpl.id, "templates");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror template create:", e);
    }
}

export async function mirrorUpdateTemplate(localId: string, data: Partial<{
    name: string;
    description: string;
    schemapayload: any;
    isPublic: boolean;
}>) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "templates");
        if (!cloudId) return;
        await templateapi.update(cloudId, data);
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror template update:", e);
    }
}

export async function mirrorDeleteTemplate(localId: string) {
    if (!shouldMirror()) return;
    try {
        const cloudId = await getCloudId(localId, "templates");
        if (!cloudId) return;
        await templateapi.delete(cloudId);
        await removeSyncMapping(localId, "templates");
    } catch (e) {
        console.error("[CloudMirror] Failed to mirror template delete:", e);
    }
}
