import { templateapi } from "@/lib/api"
import { CreateTemplateBody, Note, Template } from "@/lib/api-types"
import { isDesktopApp } from "@/lib/isdesktop"
import * as localTemplates from "@/lib/services/localtemplates"
import * as cloudMirror from "@/lib/services/cloud-mirror"
import { queryKeys } from "@/lib/query-keys"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"


export const useMyTemplates = () =>{
    return useQuery({
        queryKey:queryKeys.templates.mine(),
        queryFn: async () => isDesktopApp()
          ? (await localTemplates.getmytemplates()) as unknown as Template[]
          : templateapi.my()
    })
}

export const useCommunityTemplates = () =>{
    return useQuery({
        queryKey:queryKeys.templates.community(),
        queryFn: async () => isDesktopApp()
          ? ([] as unknown as Template[]) // Community templates not available locally
          : templateapi.community()
    })
}

export const useTemplate = (id:string) =>{
    return useQuery({
        queryKey:queryKeys.templates.detail(id),
        queryFn: async () => isDesktopApp()
          ? (await localTemplates.gettemplate(id)) as unknown as Template
          : templateapi.get(id),
        enabled:!!id
    })
}

export const useCreateTemplate = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateTemplateBody) => {
          if (isDesktopApp()) {
            const tmpl = await localTemplates.createtemplate(data.name, data.schemapayload, data.description, data.isPublic);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorCreateTemplate(tmpl.id, {
              name: data.name,
              description: data.description,
              schemapayload: data.schemapayload,
              isPublic: data.isPublic,
            });
            return tmpl as unknown as Template;
          }
          return templateapi.create(data);
        },
        onSuccess:()=>{
            queryclient.invalidateQueries({queryKey:queryKeys.templates.all})
        }
    })
}

export const useCreateTemplateFromNote = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async ({noteId, body}: {noteId: string, body: {title: string, description: string, ispublic: boolean}}) => {
          if (isDesktopApp()) {
            const tmpl = await localTemplates.createtemplatefromnote(noteId, body.title, body.description, body.ispublic);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorCreateTemplate(tmpl.id, {
              name: body.title,
              description: body.description,
              schemapayload: tmpl.schemapayload,
              isPublic: body.ispublic,
            });
            return tmpl as unknown as Template;
          }
          return templateapi.createfromnote(noteId, body);
        },
        onSuccess:()=>{
            queryclient.invalidateQueries({queryKey:queryKeys.templates.all})
        }
    })
}

export const useApplyTemplate = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, noteId}: {id: string, noteId?: string}) => isDesktopApp()
          ? (await localTemplates.applytemplate(id, noteId)) as unknown as Note
          : templateapi.apply(id, noteId),
        onSuccess:()=>{
            queryclient.invalidateQueries({queryKey:queryKeys.templates.all})
            queryclient.invalidateQueries({queryKey:queryKeys.notes.all})
        }
    })
}

export const useUpdateTemplate = () =>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, data}: {id: string, data: Partial<CreateTemplateBody>}) => {
          if (isDesktopApp()) {
            const tmpl = await localTemplates.updatetemplate(id, data.name, data.schemapayload, data.description, data.isPublic);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorUpdateTemplate(id, {
              name: data.name,
              description: data.description,
              schemapayload: data.schemapayload,
              isPublic: data.isPublic,
            });
            return tmpl as unknown as Template;
          }
          return templateapi.update(id, data);
        },
        onSuccess:(updatedTemplate: any)=>{
            if (updatedTemplate?.id) {
                queryclient.setQueryData(queryKeys.templates.detail(updatedTemplate.id), updatedTemplate)
            }
            queryclient.invalidateQueries({queryKey:queryKeys.templates.all})
        }
    })
}

export const useDeleteTemplate = ()=>{
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
          if (isDesktopApp()) {
            const result = await localTemplates.deletetemplate(id);
            // Fire-and-forget: mirror to cloud
            cloudMirror.mirrorDeleteTemplate(id);
            return result as unknown as {success: boolean};
          }
          return templateapi.delete(id);
        },
        onSuccess:()=>{
            queryclient.invalidateQueries({queryKey:queryKeys.templates.all})
        }
    })
}