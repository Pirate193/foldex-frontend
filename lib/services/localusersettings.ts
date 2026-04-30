import { eq, isNull } from "drizzle-orm";
import { getLocalDb } from "../localdb";
import { userSettings } from "../schema.local";

const getUserId = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pslmp_user_id");
};

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI study assistant for pslmp. Help the user with their notes, studying, and learning. Be concise but thorough.`;

export const getUserSettings = async () => {
    try {
        const userId = getUserId();
        const db = await getLocalDb();
        const [settings] = await db.select().from(userSettings);

        return {
            systemPrompt: settings?.systemPrompt ?? null,
            defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
        };
    } catch (error) {
        console.error("error getting user settings", error);
        return {
            systemPrompt: null,
            defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
        };
    }
};

export const updateUserSettings = async (data: { systemPrompt?: string | null }) => {
    try {
        const userId = getUserId();
        const db = await getLocalDb();

        const [existing] = await db.select().from(userSettings);

        if (existing) {
            const [updated] = await db.update(userSettings).set({
                systemPrompt: data.systemPrompt !== undefined ? data.systemPrompt : existing.systemPrompt,
                updatedAt: new Date()
            }).where(eq(userSettings.id, existing.id)).returning();
            return updated;
        }

        // Create new settings row
        const [created] = await db.insert(userSettings).values({
            userId: userId,
            systemPrompt: data.systemPrompt ?? null,
        }).returning();
        return created;
    } catch (error) {
        console.error("error updating user settings", error);
        throw error;
    }
};
