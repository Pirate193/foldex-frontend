import { getLocalDb } from "../localdb";
import { folders, notes, chats, messages, templates, localUser, syncMap } from "../schema.local";
import { and, eq, isNull } from "drizzle-orm";
import { toast } from "sonner";
import { folderapi, notesapi, chatapi, templateapi } from "../api";

// ─── Types ──────────────────────────────────────────────────────
type SyncUser = { id: string; name: string; email: string; image?: string | null };
type SyncTable = "folders" | "notes" | "chats" | "messages" | "templates";

// ─── Helpers ────────────────────────────────────────────────────

/** Check if a local item has already been synced to the cloud */
async function isSynced(db: Awaited<ReturnType<typeof getLocalDb>>, localId: string, table: SyncTable): Promise<boolean> {
    const [row] = await db.select().from(syncMap).where(and(eq(syncMap.localId, localId), eq(syncMap.tableName, table)));
    return !!row;
}

/** Record a local→cloud mapping after a successful push */
async function recordSync(db: Awaited<ReturnType<typeof getLocalDb>>, localId: string, cloudId: string, table: SyncTable) {
    await db.insert(syncMap).values({
        localId,
        cloudId,
        tableName: table,
        syncedAt: new Date(),
    });
}

/** Get the cloud ID for a local ID (e.g. to remap folder references) */
async function getCloudId(db: Awaited<ReturnType<typeof getLocalDb>>, localId: string, table: SyncTable): Promise<string | null> {
    const [row] = await db.select().from(syncMap).where(and(eq(syncMap.localId, localId), eq(syncMap.tableName, table)));
    return row?.cloudId ?? null;
}

// ─── Main Sync ──────────────────────────────────────────────────

/**
 * Full local→cloud sync. Called when the user signs in on the desktop app.
 * 
 * Handles:
 * 1. Adopting orphan items (userId IS NULL) created as a guest
 * 2. Upserting the local_user record
 * 3. Pushing un-synced folders to the cloud (respecting parent→child order)
 * 4. Pushing un-synced notes (remapping folderId to cloud IDs)
 * 5. Pushing un-synced chats + their messages
 * 6. Pushing un-synced templates
 * 7. Pulling cloud data that doesn't exist locally
 */
export async function syncLocalToCloud(user: SyncUser) {
    const toastId = "sync-toast";
    let syncedCount = 0;
    let errorCount = 0;

    try {
        toast.loading("Syncing your workspace...", { id: toastId });

        const db = await getLocalDb();

        // ── Phase 1: Adopt orphan items ─────────────────────────────
        toast.loading("Claiming local items...", { id: toastId });
        await db.update(notes).set({ userId: user.id }).where(isNull(notes.userId));
        await db.update(folders).set({ userId: user.id }).where(isNull(folders.userId));
        await db.update(chats).set({ userId: user.id }).where(isNull(chats.userId));
        await db.update(templates).set({ creatorId: user.id }).where(isNull(templates.creatorId));

        // ── Phase 2: Upsert local_user ──────────────────────────────
        const [existing] = await db.select().from(localUser).where(eq(localUser.id, user.id));
        if (existing) {
            await db.update(localUser).set({
                name: user.name,
                email: user.email,
                image: user.image ?? null,
                isLoggedIn: true,
            }).where(eq(localUser.id, user.id));
        } else {
            await db.insert(localUser).values({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image ?? null,
                isLoggedIn: true,
            });
        }

        // ── Phase 3: Push folders (parent-first order) ──────────────
        toast.loading("Syncing folders...", { id: toastId });
        const allFolders = await db.select().from(folders);

        // Sort so root folders (parentId null) come first, then children
        const sortedFolders = topologicalSortFolders(allFolders);

        for (const folder of sortedFolders) {
            if (await isSynced(db, folder.id, "folders")) continue;

            try {
                // If this folder has a parent, remap to the cloud parentId
                let cloudParentId: string | null | undefined = undefined;
                if (folder.parentId) {
                    cloudParentId = await getCloudId(db, folder.parentId, "folders");
                    // If parent hasn't been synced yet, skip for now 
                    // (topological sort should prevent this, but safety first)
                    if (!cloudParentId) {
                        console.warn(`Skipping folder "${folder.name}" — parent not synced yet`);
                        continue;
                    }
                }

                const cloudFolder = await folderapi.create({
                    name: folder.name,
                    parentId: cloudParentId ?? undefined,
                    isPinned: folder.isPinned,
                    color: folder.color,
                });

                await recordSync(db, folder.id, cloudFolder.id, "folders");
                syncedCount++;
            } catch (e) {
                console.error(`Failed to sync folder "${folder.name}":`, e);
                errorCount++;
            }
        }

        // ── Phase 4: Push notes ─────────────────────────────────────
        toast.loading("Syncing notes...", { id: toastId });
        const allNotes = await db.select().from(notes);

        for (const note of allNotes) {
            if (await isSynced(db, note.id, "notes")) continue;

            try {
                // Remap folderId to cloud ID
                let cloudFolderId: string | undefined = undefined;
                if (note.folderId) {
                    const mapped = await getCloudId(db, note.folderId, "folders");
                    if (mapped) {
                        cloudFolderId = mapped;
                    }
                    // If the folder wasn't synced, the note goes to root (no folder)
                }

                const cloudNote = await notesapi.create({
                    title: note.title,
                    content: note.content as any,
                    folderId: cloudFolderId,
                    isPinned: note.isPinned,
                });

                await recordSync(db, note.id, cloudNote.id, "notes");
                syncedCount++;
            } catch (e) {
                console.error(`Failed to sync note "${note.title}":`, e);
                errorCount++;
            }
        }

        // ── Phase 5: Push chats + messages ──────────────────────────
        toast.loading("Syncing chats...", { id: toastId });
        const allChats = await db.select().from(chats);

        for (const chat of allChats) {
            if (await isSynced(db, chat.id, "chats")) continue;

            try {
                const cloudChat = await chatapi.create({ title: chat.title });
                await recordSync(db, chat.id, cloudChat.id, "chats");
                syncedCount++;

                // Now push all messages for this chat
                const chatMessages = await db.select().from(messages).where(eq(messages.chatId, chat.id));

                for (const msg of chatMessages) {
                    if (await isSynced(db, msg.id, "messages")) continue;

                    try {
                        const cloudMsg = await chatapi.addmessage(cloudChat.id, {
                            role: msg.role,
                            content: msg.content,
                            parts: msg.parts,
                        });
                        await recordSync(db, msg.id, cloudMsg.id, "messages");
                    } catch (e) {
                        console.error(`Failed to sync message in chat "${chat.title}":`, e);
                        errorCount++;
                    }
                }
            } catch (e) {
                console.error(`Failed to sync chat "${chat.title}":`, e);
                errorCount++;
            }
        }

        // ── Phase 6: Push templates ─────────────────────────────────
        toast.loading("Syncing templates...", { id: toastId });
        const allTemplates = await db.select().from(templates);

        for (const tmpl of allTemplates) {
            if (await isSynced(db, tmpl.id, "templates")) continue;

            try {
                const cloudTmpl = await templateapi.create({
                    name: tmpl.name,
                    description: tmpl.description ?? undefined,
                    schemapayload: tmpl.schemapayload,
                    isPublic: tmpl.ispublic,
                });
                await recordSync(db, tmpl.id, cloudTmpl.id, "templates");
                syncedCount++;
            } catch (e) {
                console.error(`Failed to sync template "${tmpl.name}":`, e);
                errorCount++;
            }
        }

        // ── Phase 7: Pull cloud → local (items that only exist in cloud) ──
        toast.loading("Pulling cloud data...", { id: toastId });
        await pullCloudToLocal(db, user.id);

        // ── Phase 8: Update lastSyncAt ──────────────────────────────
        await db.update(localUser).set({ lastSyncAt: new Date() }).where(eq(localUser.id, user.id));

        // ── Done ────────────────────────────────────────────────────
        if (errorCount > 0) {
            toast.warning(`Synced ${syncedCount} items with ${errorCount} errors`, { id: toastId });
        } else if (syncedCount > 0) {
            toast.success(`Synced ${syncedCount} items successfully!`, { id: toastId });
        } else {
            toast.success("Everything is up to date!", { id: toastId });
        }
    } catch (error) {
        console.error("Sync fatal error:", error);
        toast.error("Sync failed — your local data is safe", { id: toastId });
    }
}

// ─── Pull cloud → local ────────────────────────────────────────

/**
 * Downloads items from the cloud that don't exist locally.
 * This handles the scenario: user created notes on the web, 
 * then opens the desktop app and signs in.
 */
async function pullCloudToLocal(db: Awaited<ReturnType<typeof getLocalDb>>, userId: string) {
    try {
        // Pull cloud folders
        const cloudFolders = await folderapi.list().catch(() => []);
        for (const cf of cloudFolders) {
            const alreadyMapped = await isCloudIdMapped(db, cf.id, "folders");
            if (alreadyMapped) continue;

            // Check if a local folder with same name exists (loose match)
            // If not, create it locally
            try {
                const [newLocal] = await db.insert(folders).values({
                    userId,
                    name: cf.name,
                    parentId: null, // We'll fix parent refs in a second pass if needed
                    isPinned: cf.isPinned,
                    color: cf.color,
                }).returning();

                await recordSync(db, newLocal.id, cf.id, "folders");
            } catch (e) {
                console.error(`Failed to pull cloud folder "${cf.name}":`, e);
            }
        }

        // Pull cloud notes
        const cloudNotes = await notesapi.list().catch(() => []);
        for (const cn of cloudNotes) {
            const alreadyMapped = await isCloudIdMapped(db, cn.id, "notes");
            if (alreadyMapped) continue;

            try {
                // Fetch the full note content
                const fullNote = await notesapi.get(cn.id);

                // Remap folderId: find local folder that maps to this cloud folderId
                let localFolderId: string | null = null;
                if (fullNote.folderId) {
                    localFolderId = await getLocalIdFromCloud(db, fullNote.folderId, "folders");
                }

                const [newLocal] = await db.insert(notes).values({
                    userId,
                    title: fullNote.title,
                    content: fullNote.content as any,
                    folderId: localFolderId,
                    isPinned: fullNote.isPinned,
                }).returning();

                await recordSync(db, newLocal.id, cn.id, "notes");
            } catch (e) {
                console.error(`Failed to pull cloud note "${cn.title}":`, e);
            }
        }

        // Pull cloud chats
        const cloudChats = await chatapi.list().catch(() => []);
        for (const cc of cloudChats) {
            const alreadyMapped = await isCloudIdMapped(db, cc.id, "chats");
            if (alreadyMapped) continue;

            try {
                const [newLocalChat] = await db.insert(chats).values({
                    userId,
                    title: cc.title,
                }).returning();

                await recordSync(db, newLocalChat.id, cc.id, "chats");

                // Pull messages for this chat
                const cloudMsgs = await chatapi.get(cc.id).catch(() => []);
                for (const cm of cloudMsgs) {
                    try {
                        const [newLocalMsg] = await db.insert(messages).values({
                            chatId: newLocalChat.id,
                            role: (cm as any).role,
                            content: (cm as any).content,
                            parts: (cm as any).parts,
                        }).returning();

                        await recordSync(db, newLocalMsg.id, (cm as any).id, "messages");
                    } catch (e) {
                        console.error("Failed to pull cloud message:", e);
                    }
                }
            } catch (e) {
                console.error(`Failed to pull cloud chat "${cc.title}":`, e);
            }
        }

        // Pull cloud templates
        const cloudTemplates = await templateapi.my().catch(() => []);
        for (const ct of cloudTemplates) {
            const alreadyMapped = await isCloudIdMapped(db, ct.id, "templates");
            if (alreadyMapped) continue;

            try {
                const [newLocal] = await db.insert(templates).values({
                    creatorId: userId,
                    name: ct.name,
                    description: ct.description,
                    schemapayload: ct.schemapayload as any,
                    ispublic: ct.ispublic,
                }).returning();

                await recordSync(db, newLocal.id, ct.id, "templates");
            } catch (e) {
                console.error(`Failed to pull cloud template "${ct.name}":`, e);
            }
        }

    } catch (e) {
        console.error("Pull from cloud failed:", e);
    }
}

// ─── Sync Map Helpers ───────────────────────────────────────────

/** Check if a cloud ID already has a local mapping */
async function isCloudIdMapped(db: Awaited<ReturnType<typeof getLocalDb>>, cloudId: string, table: SyncTable): Promise<boolean> {
    const [row] = await db.select().from(syncMap).where(and(eq(syncMap.cloudId, cloudId), eq(syncMap.tableName, table)));
    return !!row;
}

/** Get local ID from a cloud ID */
async function getLocalIdFromCloud(db: Awaited<ReturnType<typeof getLocalDb>>, cloudId: string, table: SyncTable): Promise<string | null> {
    const [row] = await db.select().from(syncMap).where(and(eq(syncMap.cloudId, cloudId), eq(syncMap.tableName, table)));
    return row?.localId ?? null;
}

// ─── Topological Sort ───────────────────────────────────────────

/**
 * Sort folders so parents come before children.
 * This ensures that when we push to the cloud, the parent folder
 * exists before we try to reference it as a parentId.
 */
function topologicalSortFolders(folderList: typeof folders.$inferSelect[]): typeof folders.$inferSelect[] {
    const sorted: typeof folders.$inferSelect[] = [];
    const visited = new Set<string>();
    const folderMap = new Map(folderList.map(f => [f.id, f]));

    function visit(folder: typeof folders.$inferSelect) {
        if (visited.has(folder.id)) return;
        visited.add(folder.id);

        // Visit parent first if it exists
        if (folder.parentId && folderMap.has(folder.parentId)) {
            visit(folderMap.get(folder.parentId)!);
        }

        sorted.push(folder);
    }

    for (const folder of folderList) {
        visit(folder);
    }

    return sorted;
}

// ─── Logout Helper ──────────────────────────────────────────────

/**
 * Called when the user logs out on desktop.
 * Marks the user as logged out but does NOT delete any local data.
 */
export async function markLocalUserLoggedOut() {
    try {
        const db = await getLocalDb();
        await db.update(localUser).set({ isLoggedIn: false });
        localStorage.removeItem("foldex_user_id");
    } catch (e) {
        console.error("Failed to mark user as logged out:", e);
    }
}
