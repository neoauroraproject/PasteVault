"use client"

import { useRouter } from "next/navigation"
import { toggleFile, deleteFile } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import { Trash2, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface FileRecord {
  id: string
  name: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string | null
  expires_at: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function FileList({ files }: { files: FileRecord[] }) {
  const router = useRouter()

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await toggleFile(id, enabled)
      router.refresh()
    } catch {
      toast.error("Failed to toggle file")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFile(id)
      toast.success("File deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete file")
    }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/f/${id}`)
    toast.success("Link copied to clipboard")
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-sm text-muted-foreground">No files yet</p>
        <p className="text-xs text-muted-foreground mt-1">Upload your first file to get started</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Name</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Size</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Type</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Expires</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Created</TableHead>
            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const isExpired = file.expires_at && new Date(file.expires_at) < new Date()
            return (
              <TableRow key={file.id} className="border-border">
                <TableCell className="font-medium text-foreground">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {file.name}
                      {isExpired && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          expired
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{file.original_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={file.enabled}
                    onCheckedChange={(checked) => handleToggle(file.id, checked)}
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatSize(file.file_size)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {file.mime_type?.split("/")[1] ?? "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {file.expires_at
                    ? formatDistanceToNow(new Date(file.expires_at), { addSuffix: true })
                    : "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(file.id)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      title="Copy public link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <a href={`/f/${file.id}`} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                        title="Open public link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Delete file?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &ldquo;{file.name}&rdquo; and remove the file from storage.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground hover:bg-accent">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(file.id)}
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
  )
}
