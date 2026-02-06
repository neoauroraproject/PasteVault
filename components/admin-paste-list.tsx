"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { adminDeletePaste } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Eye, Lock, Copy, ExternalLink, Paperclip, Search } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Paste {
  id: string
  content: string
  language: string
  password: string | null
  expires_at: string | null
  attachments?: { file_id: string; name: string }[]
  created_at: string
}

export function AdminPasteList({ pastes }: { pastes: Paste[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return pastes
    const q = search.toLowerCase()
    return pastes.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.attachments || []).some((a) => a.name.toLowerCase().includes(q))
    )
  }, [pastes, search])

  async function handleDelete(id: string) {
    try {
      await adminDeletePaste(id)
      toast.success("Paste deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete")
    }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/c/${id}`)
    toast.success("Link copied")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by ID, content, or attachment name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 bg-card pl-10 shadow-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {pastes.length === 0 ? "No pastes yet" : "No pastes match your search"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Preview</TableHead>
                <TableHead className="hidden text-muted-foreground md:table-cell">ID</TableHead>
                <TableHead className="hidden text-muted-foreground md:table-cell">Protected</TableHead>
                <TableHead className="hidden text-muted-foreground md:table-cell">Password</TableHead>
                <TableHead className="hidden text-muted-foreground lg:table-cell">Expires</TableHead>
                <TableHead className="hidden text-muted-foreground md:table-cell">Created</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((paste) => {
                const isExpired = paste.expires_at && new Date(paste.expires_at) < new Date()
                const hasAttachments = paste.attachments && paste.attachments.length > 0
                return (
                  <TableRow key={paste.id} className="transition-colors duration-150">
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm text-foreground">
                        {paste.content.slice(0, 60) || "(files only)"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {isExpired && (
                          <span className="text-[10px] font-medium text-destructive">EXPIRED</span>
                        )}
                        {hasAttachments && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Paperclip className="h-2.5 w-2.5" />
                            {paste.attachments!.length} file{paste.attachments!.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                        {paste.id}
                      </code>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {paste.password ? (
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {paste.password ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                          {paste.password}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {paste.expires_at
                        ? formatDistanceToNow(new Date(paste.expires_at), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDistanceToNow(new Date(paste.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Paste Content</DialogTitle>
                            </DialogHeader>
                            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-sm text-foreground">
                              {paste.content || "(no text content)"}
                            </pre>
                            {paste.password && (
                              <p className="text-xs text-muted-foreground">
                                Password: <code className="font-mono text-foreground">{paste.password}</code>
                              </p>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(paste.id)}
                          className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <a href={`/c/${paste.id}`} target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete paste?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this paste and its public link.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(paste.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
