"use client";

import { SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  Folder,
  Mic,
  MoreHorizontal,
  Pencil,
  SlashIcon,
  Sparkles,
  Trash,
  Type,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import UpdateTitle from "./update-title";
import DeleteDialog from "../deletedialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  blockNoteToMarkdown,
  blockNoteToPlainText,
} from "@/lib/blocknotehelper";
import { exportNoteToPDF } from "@/lib/notetopdfhelper";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useDeleteNote, useNote } from "@/hooks/use-notes";
import { useFolder } from "@/hooks/use-folders";
import { useAiStore } from "@/stores/aistore";
import { isDesktopApp } from "@/lib/isdesktop";


interface Props {
  noteId: string;
  folderId?: string;
}

const Notesheader = ({ noteId, folderId }: Props) => {
  const router = useRouter();
  const {data:note,isLoading:noteLoading} = useNote(noteId);
  const {data:folder,isLoading:folderLoading} = useFolder(folderId!);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [openTranscribeDialog, setOpenTranscribeDialog] = useState(false);
  const {mutateAsync:deletenote,isPending:deletenoteLoading} = useDeleteNote() ;
  const { openInTab } = useTabNavigation();
  const {isOpen,onOpen}=useAiStore();


  if (noteLoading || folderLoading) {
    return (
      <div>
        <Skeleton className="h-10 w-10" />
      </div>
    );
  }
  if(!note){
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">note not found</p>
      </div>
    );
   }

  const handledelete = async () => {
    try {
      await deletenote(noteId);
      toast.success("Note deleted successfully");
      router.push("/app?view=home")
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete note");
    }
  };

  // --- FIX: Updated handleCopy to be async ---
  const handleCopy = async () => {
    if (!note.content) return;
    try {
      // 1. Await the async conversion
      const data = await blockNoteToPlainText(note.content);
      // 2. Write to clipboard
      navigator.clipboard.writeText(data);
      toast.success("Note copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy note.");
    }
  };

  // --- NATIVE DESKTOP MARKDOWN EXPORT ---
  const handleExportAsMarkdown = async () => {
    if (!note.content) return;
    try {
      const markdown = await blockNoteToMarkdown(note.content);
      const cleanFilename = `${note.title.replace(/ /g, "_")}.md`;

      if (isDesktopApp()) {
        // Dynamically import Tauri plugins so Web doesn't crash
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        const { sendNotification } = await import('@tauri-apps/plugin-notification');

        // 1. Open the native OS "Save As" window
        const filePath = await save({
          defaultPath: cleanFilename,
          filters: [{ name: 'Markdown Document', extensions: ['md'] }]
        });

        // 2. If the user didn't click Cancel
        if (filePath) {
          await writeTextFile(filePath, markdown);
          
          // 3. Native Windows/Mac push notification!
          sendNotification({
            title: 'psLMP',
            body: `Note successfully exported to ${filePath}`
          });
          toast.success("Saved to your computer");
        }
      } else {
        // Fallback: Standard Web Browser Download
        const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = cleanFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Note exported as Markdown");
      }
    } catch (error) {
      console.error("Failed to export note:", error);
      toast.error("Failed to export note.");
    }
  };

  // --- NATIVE DESKTOP PDF EXPORT ---
  const handleExportAsPDF = async () => {
    if (!note.content) return;
    try {
      if (isDesktopApp()) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const { sendNotification } = await import('@tauri-apps/plugin-notification');

        const cleanFilename = `${note.title.replace(/ /g, "_")}.pdf`;
        
        // 1. Open native OS "Save As" window
        const filePath = await save({
          defaultPath: cleanFilename,
          filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
        });

        // 2. If they picked a location
        if (filePath) {
          // Tell our PDF generator to return raw bytes instead of auto-downloading
          const pdfBytes = await exportNoteToPDF(note.title, note.content,true ) as ArrayBuffer;
          
          await writeFile(filePath, new Uint8Array(pdfBytes));
          
          // 3. Fire the native notification
          sendNotification({
            title: 'psLMP',
            body: `PDF successfully exported to ${filePath}`
          });
          toast.success("Saved to your computer");
        }
      } else {
        // Fallback: Web browser handles the jsPDF save automatically
        await exportNoteToPDF(note.title, note.content);
        toast.success("Note exported as PDF");
      }
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export PDF.");
    }
  };
  return (
    <>
      <div className="p-2 flex items-center justify-between gap-2">
        {/*breadcrumb  */}
        <div>
          <div className="flex items-center gap-2  ">
            <SidebarTrigger className="cursor-pointer"/>
            <Breadcrumb>
              <BreadcrumbList>
                {folder && <BreadcrumbItem className="hidden md:inline-flex">
                  <BreadcrumbLink className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>{folder?.name}</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                }
                {folder && <BreadcrumbSeparator className="hidden md:block">
                  <SlashIcon />
                </BreadcrumbSeparator>}
                
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold line-clamp-1">
                    {note?.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {!isOpen && (
            <Button
              onClick={() => onOpen({ type: "note", id: noteId, name: "note" })}
              className="cursor-pointer"
                  size="icon-sm"
              
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                aria-label="Open menu"
                size="icon-sm"
                className="cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* --- FIX: Updated DropdownMenuContent --- */}
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => setOpenRenameDialog(true)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleExportAsMarkdown}
                className="cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                Export as MD
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleExportAsPDF}
                className="cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleCopy}
                className="cursor-pointer"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy as Text
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setOpenDeleteDialog(true)}
                className="text-destructive cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <UpdateTitle
        open={openRenameDialog}
        onOpenChange={setOpenRenameDialog}
        noteId={noteId}
      />
      <DeleteDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Delete Note"
        description={`Are you sure you want to delete ${note?.title} This action cannot be undone.`}
        itemName={note.title}
        onConfirm={handledelete}
      />
    </>
  );
};

export default Notesheader;