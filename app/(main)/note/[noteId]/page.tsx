import NoteContentInner from "@/components/tabs/content/NoteContentInner";


export default async function NotePage({params}: {params: Promise<{noteId: string}>}) {
    const { noteId } = await params;
    return (
        <NoteContentInner noteId={noteId} />
    );
}