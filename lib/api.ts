import apiClient from "./api-client"
import { AddMessageBody, ApiKeyInfo, Chat, CreateChatBody, CreateFolderBody, CreateNoteBody, CreateTemplateBody, Folder, KeyValidationResult, Message, Note, NoteListItem, Template, UpdateFolderBody, UpdateNoteBody, UserSettings } from "./api-types"


export const notesapi = {
  list:(folderId?:string)=>
    apiClient.get<NoteListItem[]>('/api/notes',{params: folderId ? {folderId}:{}}).then(res=>res.data),
  get:(id:string)=>
    apiClient.get<Note>(`/api/notes/${id}`).then(r=>r.data),
  create:(body:CreateNoteBody)=>
    apiClient.post<Note>("/api/notes",body).then(r=>r.data),
  update:(id:string,body:UpdateNoteBody)=>
    apiClient.put<Note>(`/api/notes/${id}`,body).then(r=>r.data),
  delete:(id:string)=>
    apiClient.delete<{success:boolean}>(`/api/notes/${id}`).then(r=>r.data),
  move:(id:string,folderId:string |null)=>
    apiClient.patch<Note>(`/api/notes/${id}/move`,{folderId}).then(r=>r.data),
}

export const folderapi = {
  list:()=>
    apiClient.get<Folder[]>('/api/folders').then(r=>r.data),
  get:(id:string)=> apiClient.get<Folder>(`/api/folders/${id}`).then(r=>r.data),
  create:(body:CreateFolderBody)=>
    apiClient.post<Folder>('/api/folders',body).then(r=>r.data),
  update:(id:string,body:UpdateFolderBody)=>
    apiClient.put<Folder>(`/api/folders/${id}`,body).then(r=>r.data),
  delete:(id:string)=>
    apiClient.delete<{success:boolean}>(`/api/folders/${id}`).then(r=>r.data),
}

export const templateapi = {
  my:()=>
    apiClient.get<Template[]>('/api/templates/my').then(r=>r.data),
  community:()=>
    apiClient.get<Template[]>('/api/templates/community').then(r=>r.data),
  get:(id:string)=>
    apiClient.get<Template>(`/api/templates/${id}`).then(r=>r.data),
  create:(body:CreateTemplateBody)=>
    apiClient.post<Template>('/api/templates',body).then(r=>r.data),
  createfromnote:(noteId:string,body:{title:string,description:string,ispublic:boolean})=>
    apiClient.post<Template>(`/api/templates/from-note/${noteId}`,body).then(r=>r.data),
  apply:(id:string,noteId?:string)=>
    apiClient.post<Note>(`/api/templates/${id}/apply`,{noteId}).then(r=>r.data),
  delete:(id:string)=>
    apiClient.delete<{success:boolean}>(`/api/templates/${id}`).then(r=>r.data),
  update:(id:string,body:Partial<CreateTemplateBody>)=>
    apiClient.put<Template>(`/api/templates/${id}`,body).then(r=>r.data),
}

export const chatapi = {
  list:()=>
    apiClient.get<Chat[]>('/api/chats').then(r=>r.data),
  get:(id:string)=>
    apiClient.get<Message[]>(`/api/chats/${id}`).then(r=>r.data),
  create:(body:CreateChatBody)=>
    apiClient.post<Chat>('/api/chats',body).then(r=>r.data),
  delete:(id:string)=>
    apiClient.delete<{success:boolean}>(`/api/chats/${id}`).then(r=>r.data),
  update:(id:string,body:{title:string})=>
    apiClient.put<Chat>(`/api/chats/${id}`,body).then(r=>r.data),
  addmessage:(id:string,body:AddMessageBody)=>
    apiClient.post<Message>(`/api/chats/${id}/messages`,body).then(r=>r.data),
}

export const settingsapi = {
  getKeys: () =>
    apiClient.get<ApiKeyInfo[]>('/api/settings/keys').then(r => r.data),
  saveKey: (provider: string, key: string) =>
    apiClient.post<ApiKeyInfo>('/api/settings/keys', { provider, key }).then(r => r.data),
  deleteKey: (provider: string) =>
    apiClient.delete<{ success: boolean }>(`/api/settings/keys/${provider}`).then(r => r.data),
  validateKey: (provider: string) =>
    apiClient.post<KeyValidationResult>(`/api/settings/keys/${provider}/validate`).then(r => r.data),
  getSettings: () =>
    apiClient.get<UserSettings>('/api/settings').then(r => r.data),
  updateSettings: (data: { systemPrompt?: string | null }) =>
    apiClient.put<UserSettings>('/api/settings', data).then(r => r.data),
}

export const aiapi = {
  generateQuizzes: (data: { topic: string, numQuestions: number, noteContent?: string }) =>
    apiClient.post<any>('/api/ai/generate-quizzes', data).then(r => r.data),
  generateFlashcards: (data: { topic: string, numFlashcards: number, noteContent?: string }) =>
    apiClient.post<any>('/api/ai/generate-flashcards', data).then(r => r.data),
  gradeFlashcard: (data: { userAnswer: string, correctAnswer: string, question: string }) =>
    apiClient.post<any>('/api/ai/grade-flashcard', data).then(r => r.data),
}