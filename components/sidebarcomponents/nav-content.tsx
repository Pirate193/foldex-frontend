import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInput, SidebarGroupLabel } from "../ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "../ui/dropdown-menu"
import { Folder, FileText, Plus, Filter, ChevronRight } from "lucide-react"
import { useCreateNote, useNotes } from "@/hooks/use-notes"
import { toast } from "sonner"
import { useCreateFolder, useFolders } from "@/hooks/use-folders"
import { Spinner } from "../ui/spinner"
import NoteItem from "../notescomponent/noteitem"
import { DndSidebarProvider } from "./dnd-provider"
import { FolderTreeItem } from "./folder-tree"
import { useState, useMemo } from "react"
import { Folder as FolderType, NoteListItem } from "@/lib/api-types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { Button } from "../ui/button"
import { FOLDER_COLORS } from "@/lib/foldercolor"
import { useSession } from "@/hooks/use-auth"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

const RootDropZone = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: "root-zone",
        data: {
            type: "root-zone",
            id: "root-zone",
        }
    });

    return (
        <div 
            ref={setNodeRef}
            className={cn(className, isOver && "bg-accent/50 rounded-md border-2 border-dashed border-primary/50")}
            data-type="root-zone"
            id="root-zone"
        >
            {children}
        </div>
    );
};

type SortOption = "A-Z" | "Z-A" | "Newest" | "Oldest";

export const NavContent = () => {
    const { mutateAsync: createNote } = useCreateNote();
    const { mutateAsync: createFolder } = useCreateFolder();
    const { data: allFolders = [], isLoading: isLoadingFolders } = useFolders();
    const { data: allNotes = [], isLoading: isLoadingNotes } = useNotes();
    const {data:session}=useSession();
    const [sortOption, setSortOption] = useState<SortOption>("A-Z");
    const [searchQuery, setSearchQuery] = useState("");

    const handleCreateNote = async () => {
        try {
            await createNote({ title: "New Note" });
            toast.success("Note created successfully");
        } catch (error) {
            toast.error("Error creating note");
        }
    };

    const handleCreateFolder = async () => {
        try {
            await createFolder({ name: "New Folder", color: FOLDER_COLORS[0].value});
            toast.success("Folder created successfully");
        } catch (error) {
            toast.error("Error creating folder");
        }
    };

    // Filter by search query first
    const filteredFolders = useMemo(() => {
        if (!searchQuery.trim()) return allFolders;
        return allFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allFolders, searchQuery]);

    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return allNotes;
        return allNotes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allNotes, searchQuery]);

    // Recents: Top 5 notes sorted by updated time (not affected by search text unless we want)
    const recentNotes = useMemo(() => {
        return [...filteredNotes]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
    }, [filteredNotes]);

    // Pinned: filtering
    const pinnedFolders = useMemo(() => filteredFolders.filter(f => f.isPinned), [filteredFolders]);
    const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.isPinned), [filteredNotes]);

    // Workspace roots combined
    const combinedRoots = useMemo(() => {
        let rootsFolders = filteredFolders.filter(f => !f.parentId);
        let rootsNotes = filteredNotes.filter(n => !n.folderId);
        
        let combined = [
            ...rootsFolders.map(f => ({ ...f, _type: "folder" as const, _title: f.name, _date: f.updatedAt })),
            ...rootsNotes.map(n => ({ ...n, _type: "note" as const, _title: n.title, _date: n.updatedAt }))
        ];

        combined.sort((a, b) => {
            if (sortOption === "A-Z") return a._title.localeCompare(b._title);
            if (sortOption === "Z-A") return b._title.localeCompare(a._title);
            if (sortOption === "Newest") return new Date(b._date).getTime() - new Date(a._date).getTime();
            if (sortOption === "Oldest") return new Date(a._date).getTime() - new Date(b._date).getTime();
            return 0;
        });
        return combined;
    }, [filteredFolders, filteredNotes, sortOption]);

    return (
        <Sidebar collapsible="none" className="hidden flex-1 md:flex min-w-0">
            <SidebarHeader className="gap-3.5 border-b p-4">
                <div className="flex w-full items-center justify-between">
                    <div className="text-base font-medium text-foreground">
                        Hi,{session?.user.name || "User"}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/10 transition-colors">
                                <Plus className="h-4 w-4 " />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem className="cursor-pointer" onClick={handleCreateFolder}>
                                <Folder className="h-4 w-4 mr-2" />
                                New Folder
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={handleCreateNote}>
                                <FileText className="h-4 w-4 mr-2" />
                                New Note
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <SidebarInput 
                    placeholder="Type to search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </SidebarHeader>

            <SidebarContent className="overflow-y-auto scrollbar-hidden">
                <DndSidebarProvider allFolders={allFolders as any}>
                    {isLoadingFolders || isLoadingNotes ? (
                        <div className="flex items-center justify-center p-8">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="">
                            {/* RECENTS SECTION */}
                            {recentNotes.length > 0 && !searchQuery.trim() && (
                                <Collapsible defaultOpen className="group/collapsible">
                                    <SidebarGroup className="px-2">
                                        <SidebarGroupLabel asChild className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 cursor-pointer hover:bg-accent/50 rounded-md">
                                            <CollapsibleTrigger className="flex items-center w-full">
                                                Recents
                                                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                            </CollapsibleTrigger>
                                        </SidebarGroupLabel>
                                        <CollapsibleContent>
                                            <SidebarGroupContent>
                                                {recentNotes.map((n) => (
                                                    <NoteItem key={`recent-${n.id}`} noteId={n.id} title={n.title} folderId={n.folderId!} />
                                                ))}
                                            </SidebarGroupContent>
                                        </CollapsibleContent>
                                    </SidebarGroup>
                                </Collapsible>
                            )}

                            {/* PINNED SECTION */}
                            {(pinnedFolders.length > 0 || pinnedNotes.length > 0) && (
                                <Collapsible defaultOpen className="group/collapsible">
                                    <SidebarGroup className="px-2">
                                        <SidebarGroupLabel asChild className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 cursor-pointer hover:bg-accent/50 rounded-md">
                                            <CollapsibleTrigger className="flex items-center w-full">
                                                Pinned
                                                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                            </CollapsibleTrigger>
                                        </SidebarGroupLabel>
                                        <CollapsibleContent>
                                            <SidebarGroupContent>
                                                {pinnedFolders.map((f) => (
                                                    <FolderTreeItem
                                                        key={`pinned-${f.id}`}
                                                        folder={f as any}
                                                        allFolders={allFolders as any}
                                                        allNotes={allNotes}
                                                        depth={0}
                                                    />
                                                ))}
                                                {pinnedNotes.map((n) => (
                                                    <NoteItem key={`pinned-${n.id}`} noteId={n.id} title={n.title} folderId={n.folderId!} />
                                                ))}
                                            </SidebarGroupContent>
                                        </CollapsibleContent>
                                    </SidebarGroup>
                                </Collapsible>
                            )}

                            {/* WORKSPACE SECTION */}
                            <SidebarGroup className="px-2">
                                <div className="flex items-center justify-between  px-2">
                                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider m-0 p-0">Workspace</SidebarGroupLabel>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer">
                                                <Filter className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {(["A-Z", "Z-A", "Newest", "Oldest"] as SortOption[]).map((opt) => (
                                                <DropdownMenuItem 
                                                    key={opt} 
                                                    onClick={() => setSortOption(opt)}
                                                    className="justify-between cursor-pointer"
                                                >
                                                    {opt}
                                                    {sortOption === opt && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <SidebarGroupContent>
                                    {/* Droppable root zone for dragging folders/notes to root */}
                                    <RootDropZone className="min-h-[100px] pb-4 flex flex-col h-full">
                                        {combinedRoots.map((item) => {
                                            if (item._type === "folder") {
                                                return (
                                                    <FolderTreeItem
                                                        key={item.id}
                                                        folder={item as any}
                                                        allFolders={allFolders as any}
                                                        allNotes={allNotes}
                                                        sortOption={sortOption}
                                                        depth={0}
                                                    />
                                                );
                                            } else {
                                                return <NoteItem key={item.id} noteId={item.id} title={item.title} folderId={item.folderId!} />;
                                            }
                                        })}
                                        {combinedRoots.length === 0 && !searchQuery.trim() && (
                                            <div className="text-xs text-muted-foreground italic px-2 py-4">
                                                Workspace is empty. Create a new folder or note.
                                            </div>
                                        )}
                                        {searchQuery.trim() && filteredFolders.length === 0 && filteredNotes.length === 0 && (
                                            <div className="text-xs text-muted-foreground italic px-2 py-4">
                                                No results found for "{searchQuery}".
                                            </div>
                                        )}
                                    </RootDropZone>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </div>
                    )}
                </DndSidebarProvider>
            </SidebarContent>
        </Sidebar>
    )
}
