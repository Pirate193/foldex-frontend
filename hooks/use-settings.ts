import { settingsapi } from "@/lib/api";
import { isDesktopApp } from "@/lib/isdesktop";
import * as localApiKeys from "@/lib/services/localapikeys";
import * as localUserSettings from "@/lib/services/localusersettings";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiKeyInfo, UserSettings } from "@/lib/api-types";

// ─── API Keys ───

export const useApiKeys = () => {
  return useQuery({
    queryKey: queryKeys.settings.keys,
    queryFn: async () => isDesktopApp()
      ? (await localApiKeys.getApiKeysMeta()) as unknown as ApiKeyInfo[]
      : settingsapi.getKeys(),
  });
};

export const useSaveApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ provider, key }: { provider: string; key: string }) => {
      if (isDesktopApp()) {
        // Save the key using the localApiKeys service which handles Stronghold and metadata
        return (await localApiKeys.saveApiKeyMeta(provider, key)) as unknown as ApiKeyInfo;
      }
      return settingsapi.saveKey(provider, key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.keys });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: string) => {
      if (isDesktopApp()) {
        return (await localApiKeys.deleteApiKeyMeta(provider)) as unknown as {success: boolean};
      }
      return settingsapi.deleteKey(provider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.keys });
    },
  });
};

export const useValidateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: string) => {
      if (isDesktopApp()) {
        return localApiKeys.validateLocalApiKey(provider);
      }
      return settingsapi.validateKey(provider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.keys });
    },
  });
};

// ─── User Settings ───

export const useUserSettings = () => {
  return useQuery({
    queryKey: queryKeys.settings.userSettings,
    queryFn: async () => isDesktopApp()
      ? (await localUserSettings.getUserSettings()) as unknown as UserSettings
      : settingsapi.getSettings(),
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { systemPrompt?: string | null }) => isDesktopApp()
      ? (await localUserSettings.updateUserSettings(data)) as unknown as UserSettings
      : settingsapi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.userSettings });
    },
  });
};
