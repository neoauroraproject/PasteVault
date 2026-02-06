"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createConfig, updateConfig } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"

interface Config {
  id: string
  name: string
  content: string
  password: string | null
  expires_at: string | null
  enabled: boolean
}

export function ConfigForm({ config }: { config?: Config }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isEdit = !!config

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      if (isEdit) {
        formData.set("id", config.id)
        await updateConfig(formData)
        toast.success("Config updated")
      } else {
        await createConfig(formData)
        toast.success("Config created")
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Config
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Edit Config" : "New Config"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-foreground">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="my-config"
              defaultValue={config?.name ?? ""}
              required
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="content" className="text-foreground">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Paste text content or link..."
              defaultValue={config?.content ?? ""}
              required
              rows={6}
              className="bg-secondary border-border text-foreground font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-foreground">
                Password <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="text"
                placeholder="Leave empty for no password"
                defaultValue={config?.password ?? ""}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expires_at" className="text-foreground">
                Expires <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="expires_at"
                name="expires_at"
                type="datetime-local"
                defaultValue={config?.expires_at ? new Date(config.expires_at).toISOString().slice(0, 16) : ""}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : isEdit ? "Update Config" : "Create Config"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
