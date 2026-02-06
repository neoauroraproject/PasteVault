"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Upload } from "lucide-react"
import { toast } from "sonner"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function FileUploadForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const file = formData.get("file") as File

      if (!file || file.size === 0) {
        toast.error("Please select a file")
        setLoading(false)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 50MB limit")
        setLoading(false)
        return
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Upload failed")
        setLoading(false)
        return
      }

      toast.success("File uploaded")
      setOpen(false)
      setFileName("")
      router.refresh()
    } catch {
      toast.error("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-foreground">
              Display Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="my-file"
              required
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="file" className="text-foreground">
              File
            </Label>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-4 py-8 transition-colors hover:border-muted-foreground"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileRef.current?.click()
              }}
              role="button"
              tabIndex={0}
            >
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {fileName || "Click to select a file"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Max 50MB</p>
            </div>
            <Input
              ref={fileRef}
              id="file"
              name="file"
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setFileName(f?.name ?? "")
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="expires_at" className="text-foreground">
              Expires{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="expires_at"
              name="expires_at"
              type="datetime-local"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
