import { folderapi } from "@/lib/api"
import { CreateFolderBody, Folder, UpdateFolderBody } from "@/lib/api-types"
import { isDesktopApp } from "@/lib/isdesktop"
import * as localFolders from "@/lib/services/localfolders"
import * as cloudMirror from "@/lib/services/cloud-mirror"
import { queryKeys } from "@/lib/query-keys"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"


export const useFolders = () =>{
    return useQuery({
        queryKey:queryKeys.folders.all,
        queryFn: async () => isDesktopApp()
          ? (await localFolders.getusersfolders()) as unknown as Folder[]
          : folderapi.list()
    })
}

export const useFolder = (id:string)=>{
    return useQuery({
        queryKey:queryKeys.folders.detail(id),
        queryFn: async () => isDesktopApp()
          ? (await localFolders.getfolderbyid(id)) as unknown as Folder
          : folderapi.get(id),
        enabled:!!id
    })
}

export const useCreateFolder = () =>{
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFolderBody) => {
      if (isDesktopApp()) {
        const folder = await localFolders.createfolder(data.name, data.parentId, data.isPinned, data.color);
        // Fire-and-forget: mirror to cloud
        cloudMirror.mirrorCreateFolder(folder.id, {
          name: data.name,
          parentId: data.parentId,
          isPinned: data.isPinned,
          color: data.color,
        });
        return folder as unknown as Folder;
      }
      return folderapi.create(data);
    },
    onSuccess:()=>{
        queryclient.invalidateQueries({queryKey:queryKeys.folders.all})
    }
  })
}

export const useUpdateFolder = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, data}: {id: string, data: UpdateFolderBody}) => {
          if (isDesktopApp()) {
            const folder = await localFolders.updatefolder(id, data.name, data.parentId ?? undefined, data.isPinned, data.color);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorUpdateFolder(id, {
              name: data.name,
              parentId: data.parentId,
              isPinned: data.isPinned,
              color: data.color,
            });
            return folder as unknown as Folder;
          }
          return folderapi.update(id, data);
        },
        onSuccess:(updatedfolder: any)=>{
            if (updatedfolder?.id) {
                queryclient.setQueryData(queryKeys.folders.detail(updatedfolder.id), updatedfolder)
            }
            queryclient.invalidateQueries({queryKey:queryKeys.folders.all})
        }
    })
}

export const useDeleteFolder = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
          if (isDesktopApp()) {
            const result = await localFolders.deletefolder(id);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorDeleteFolder(id);
            return result as unknown as {success: boolean};
          }
          return folderapi.delete(id);
        },
        onSuccess:()=>{
            queryclient.invalidateQueries({queryKey:queryKeys.folders.all})
            queryclient.invalidateQueries({queryKey:queryKeys.notes.all})
        }
    })
}