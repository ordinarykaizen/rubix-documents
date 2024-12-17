import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Documents } from "@/settings/documents";

type DocItem = {
  title: string;
  href: string;
  heading?: string;
  items?: readonly DocItem[];
  noLink?: boolean;
};

type Spacer = {
  spacer: true;
};

type DocNode = DocItem | Spacer;

const SearchDialog = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
  }, [router]);

  const isDocItem = (node: DocNode): node is DocItem => {
    return 'title' in node && 'href' in node;
  };

  const renderDocuments = useCallback((documents: readonly DocNode[]) => {
    return documents.map((doc, index) => {
      if (!isDocItem(doc)) {
        return null;
      }

      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const hasMatchingChildren = doc.items?.some(item => 
        isDocItem(item) && item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (!matchesSearch && !hasMatchingChildren) {
        return null;
      }

      return (
        <div key={index} className="flex flex-col gap-2">
          {doc.heading && (
            <h4 className="font-medium text-sm leading-none mb-2">{doc.heading}</h4>
          )}
          {!doc.noLink && (
            <Button
              variant="ghost"
              className="justify-start h-auto p-2"
              onClick={() => handleSelect(doc.href)}
            >
              <span className="text-sm">{doc.title}</span>
            </Button>
          )}
          {doc.items && (
            <div className="ml-4 flex flex-col gap-1">
              {renderDocuments(doc.items)}
            </div>
          )}
        </div>
      );
    });
  }, [handleSelect, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="mr-2 px-2 w-full justify-start"
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="text-sm text-muted-foreground">Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="top-[20%] translate-y-0">
        <div className="flex flex-col gap-4 max-h-[60vh]">
          <div className="flex-1 overflow-hidden">
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="flex flex-col gap-2">
              {searchTerm.length === 0 ? null : renderDocuments(Documents)}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;