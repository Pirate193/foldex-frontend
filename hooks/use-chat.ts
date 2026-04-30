import { chatapi } from "@/lib/api"
import { AddMessageBody, Chat, CreateChatBody, Message } from "@/lib/api-types"
import { isDesktopApp } from "@/lib/isdesktop"
import * as localChats from "@/lib/services/localchats"
import * as cloudMirror from "@/lib/services/cloud-mirror"
import { queryKeys } from "@/lib/query-keys"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"


export const useChats = ()=>{
    return useQuery({
        queryKey:queryKeys.chats.all,
        queryFn: async () => isDesktopApp()
          ? (await localChats.fetchchats()) as unknown as Chat[]
          : chatapi.list()
    })
}

export const useChatMessages = (id:string)=>{
    return useQuery({
        queryKey:queryKeys.chats.detail(id),
        queryFn: async () => isDesktopApp()
          ? (await localChats.getchat(id)) as unknown as Message[]
          : chatapi.get(id),
        enabled:!!id
    })
}

export const useCreateChat = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateChatBody) => {
          if (isDesktopApp()) {
            const chat = await localChats.createchat(data.title);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorCreateChat(chat.id, data.title);
            return chat as unknown as Chat;
          }
          return chatapi.create(data);
        },
        onSuccess:()=>{
            queryclient.invalidateQueries({queryKey:queryKeys.chats.all})
        }
    })
}

export const useUpdateChat = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, data}: {id: string, data: {title: string}}) => {
          if (isDesktopApp()) {
            const chat = await localChats.updatechat(id, data.title);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorUpdateChat(id, data.title);
            return chat as unknown as Chat;
          }
          return chatapi.update(id, data);
        },
        onSuccess:(updatedChat: any)=>{
            if (updatedChat?.id) {
                queryclient.setQueryData(queryKeys.chats.detail(updatedChat.id), updatedChat)
            }
            queryclient.invalidateQueries({queryKey:queryKeys.chats.all})
        }
    })
}

export const useDeleteChat = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
          if (isDesktopApp()) {
            const result = await localChats.deletechat(id);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorDeleteChat(id);
            return result as unknown as {success: boolean};
          }
          return chatapi.delete(id);
        },
        onSuccess:()=>{
            queryclient.invalidateQueries({queryKey:queryKeys.chats.all})
        }
    })
}

export const useAddMessage = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, body}: {id: string, body: AddMessageBody}) => {
          if (isDesktopApp()) {
            const msg = await localChats.addmessage(id, body.role, body.content, body.parts);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorAddMessage(id, msg.id, {
              role: body.role,
              content: body.content,
              parts: body.parts,
            });
            return msg as unknown as Message;
          }
          return chatapi.addmessage(id, body);
        },
        onSuccess:(_, {id})=>{
            queryclient.invalidateQueries({queryKey:queryKeys.chats.detail(id)})
        }
    })
}