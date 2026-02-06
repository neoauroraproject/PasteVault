"use client"

import { useRouter } from "next/navigation"
import { adminDeleteFile } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
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
  original_name: string
  stored_name: string
  file_size: number
  mime_type: string
  created_at: string
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function AdminFileList({ files }: { files: FileRecord[] }) {
  const router = useRouter()

  async function handleDelete(id: string) {
    try {
      await adminDeleteFile(id)
      toast.success("File deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete")
    }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/f/${id}`)
    toast.success("Link copied")
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 shadow-sm">
        <p className="text-sm text-muted-foreground">No files uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground">File</TableHead>
            <TableHead className="hidden text-muted-foreground md:table-cell">
              ID
            </TableHead>
            <TableHead className="hidden text-muted-foreground md:table-cell">
              Size
            </TableHead>
            <TableHead className="hidden text-muted-foreground md:table-cell">
              Type
            </TableHead>
            <TableHead className="hidden text-muted-foreground md:table-cell">
              Uploaded
            </TableHead>
            <TableHead className="text-right text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow
              key={file.id}
              className="transition-colors duration-150"
            >
              <TableCell className="max-w-[200px] font-medium text-foreground">
                <p className="truncate">{file.original_name}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                  {file.id}
                </code>
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                {formatSize(file.file_size)}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                {file.mime_type.split("/").pop()}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                {formatDistanceToNow(new Date(file.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(file.id)}
                    className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <a
                    href={`/f/${file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                        <AlertDialogTitle>Delete file?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &ldquo;
                          {file.original_name}&rdquo; from storage.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
