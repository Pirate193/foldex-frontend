
import { notesapi } from "@/lib/api";
import { CreateNoteBody, Note, NoteListItem, UpdateNoteBody } from "@/lib/api-types";
import { isDesktopApp } from "@/lib/isdesktop";
import * as localNotes from "@/lib/services/localnotes";
import * as cloudMirror from "@/lib/services/cloud-mirror";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotes(folderId?:string){
  return useQuery({
    queryKey: queryKeys.notes.list(folderId),
    queryFn: async () => isDesktopApp()
      ? (await localNotes.getusersnotes(folderId)) as unknown as NoteListItem[]
      : notesapi.list(folderId)
  })
}

export const useNote = (id:string)=>{
  return useQuery({
    queryKey:queryKeys.notes.detail(id),
    queryFn: async () => isDesktopApp()
      ? (await localNotes.getnote(id)) as unknown as Note
      : notesapi.get(id),
    enabled:!!id,
  })
}

export const useCreateNote = () =>{
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateNoteBody) => {
      if (isDesktopApp()) {
        const note = await localNotes.createnote(data.title ?? "untitled", data.folderId, data.content);
        // Fire-and-forget: mirror to cloud in the background
        cloudMirror.mirrorCreateNote(note.id, {
          title: data.title,
          content: data.content,
          folderId: data.folderId,
          isPinned: data.isPinned,
        });
        return note as unknown as Note;
      }
      return notesapi.create(data);
    },
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:queryKeys.notes.all})
    }
  })
}

export const useUpdateNote = () =>{
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string, data: UpdateNoteBody}) => {
      if (isDesktopApp()) {
        const note = await localNotes.updatenote(id, data.title, data.content as any, data.folderId ?? undefined, data.isPinned);
        // Fire-and-forget: mirror to cloud
        cloudMirror.mirrorUpdateNote(id, {
          title: data.title,
          content: data.content,
          folderId: data.folderId,
          isPinned: data.isPinned,
        });
        return note as unknown as Note;
      }
      return notesapi.update(id, data);
    },
    onSuccess:(updatedNote: any)=>{
      if (updatedNote?.id) {
        queryclient.setQueryData(queryKeys.notes.detail(updatedNote.id), updatedNote)
      }
      queryclient.invalidateQueries({queryKey:queryKeys.notes.all})
    }
  })
}

export const useDeleteNote = () =>{
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDesktopApp()) {
        const result = await localNotes.deletenote(id);
        // Fire-and-forget: mirror to cloud
        cloudMirror.mirrorDeleteNote(id);
        return result as unknown as {success: boolean};
      }
      return notesapi.delete(id);
    },
    onSuccess:(_,id)=>{
        queryclient.removeQueries({queryKey:queryKeys.notes.detail(id)})
        queryclient.invalidateQueries({queryKey:queryKeys.notes.all})
    }
  })
}

export const useMoveNote = () =>{
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, folderId}: {id: string, folderId: string | null}) => {
      if (isDesktopApp()) {
        const note = await localNotes.movenote(id, folderId);
        // Fire-and-forget: mirror to cloud
        cloudMirror.mirrorMoveNote(id, folderId);
        return note as unknown as Note;
      }
      return notesapi.move(id, folderId);
    },
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:queryKeys.notes.all})
    }
  })
}
