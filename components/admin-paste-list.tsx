"use client"

import { useRouter } from "next/navigation"
import { adminDeletePaste } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Eye, Lock, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Paste {
  id: string
  content: string
  language: string
  password: string | null
  expires_at: string | null
  created_at: string
}

export function AdminPasteList({ pastes }: { pastes: Paste[] }) {
  const router = useRouter()

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

  if (pastes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <p className="text-sm text-muted-foreground">No pastes yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground">Preview</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Protected</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Password</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Expires</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Created</TableHead>
            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pastes.map((paste) => {
            const isExpired = paste.expires_at && new Date(paste.expires_at) < new Date()
            return (
              <TableRow key={paste.id}>
                <TableCell className="max-w-[200px]">
                  <p className="truncate text-sm text-foreground">{paste.content.slice(0, 60)}</p>
                  {isExpired && (
                    <span className="text-[10px] text-destructive font-medium">EXPIRED</span>
                  )}
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
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                      {paste.password}
                    </code>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {paste.expires_at
                    ? formatDistanceToNow(new Date(paste.expires_at), { addSuffix: true })
                    : "Never"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(paste.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Paste Content</DialogTitle>
                        </DialogHeader>
                        <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-sm font-mono whitespace-pre-wrap break-all text-foreground">
                          {paste.content}
                        </pre>
                        {paste.password && (
                          <p className="text-xs text-muted-foreground">
                            Password: <code className="font-mono text-foreground">{paste.password}</code>
                          </p>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => copyLink(paste.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <a href={`/c/${paste.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete paste?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this paste and its public link.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(paste.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
  )
}
