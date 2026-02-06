"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toggleConfig, deleteConfig } from "@/app/admin/actions"
import { ConfigForm } from "@/components/config-form"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Eye, Lock, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Config {
  id: string
  name: string
  content: string
  password: string | null
  expires_at: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export function ConfigList({ configs }: { configs: Config[] }) {
  const router = useRouter()

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await toggleConfig(id, enabled)
      router.refresh()
    } catch {
      toast.error("Failed to toggle config")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteConfig(id)
      toast.success("Config deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete config")
    }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/c/${id}`)
    toast.success("Link copied to clipboard")
  }

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-sm text-muted-foreground">No configs yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first config to get started</p>
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
            <TableHead className="text-muted-foreground hidden md:table-cell">Protected</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Expires</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Created</TableHead>
            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => {
            const isExpired = config.expires_at && new Date(config.expires_at) < new Date()
            return (
              <TableRow key={config.id} className="border-border">
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {config.name}
                    {isExpired && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        expired
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => handleToggle(config.id, checked)}
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {config.password ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {config.expires_at
                    ? formatDistanceToNow(new Date(config.expires_at), { addSuffix: true })
                    : "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(config.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ConfigDetailDialog config={config} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(config.id)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      title="Copy public link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <a href={`/c/${config.id}`} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                        title="Open public link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <ConfigForm config={config} />
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
                          <AlertDialogTitle className="text-foreground">Delete config?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &ldquo;{config.name}&rdquo; and its public link.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground hover:bg-accent">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(config.id)}
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

function ConfigDetailDialog({ config }: { config: Config }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
          title="View content"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">{config.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Content</p>
            <pre className="max-h-64 overflow-auto rounded-md bg-secondary p-3 text-sm text-foreground font-mono whitespace-pre-wrap break-all">
              {config.content}
            </pre>
          </div>
          {config.password && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Password</p>
              <code className="rounded bg-secondary px-2 py-1 text-sm text-foreground font-mono">
                {config.password}
              </code>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Public Link</p>
            <code className="rounded bg-secondary px-2 py-1 text-sm text-primary font-mono">
              /c/{config.id}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
