"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Send,
  Upload,
  X,
  FileText,
  ImageIcon,
  FileArchive,
  File,
  Lock,
  Clock,
  Check,
  Copy,
  Link2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"

interface UploadedFile {
  file: File
  id?: string
  uploading: boolean
  error?: string
}

interface Settings {
  uploads_enabled: boolean
  max_file_size_mb: number
  allowed_formats: string
}

function getFileIcon(type: string) {
  if (type.startsWith("image/"))
    return <ImageIcon className="h-5 w-5 text-blue-500" />
  if (type === "application/pdf")
    return <FileText className="h-5 w-5 text-rose-500" />
  if (type.includes("zip") || type.includes("rar") || type.includes("7z"))
    return <FileArchive className="h-5 w-5 text-amber-500" />
  return <File className="h-5 w-5 text-muted-foreground" />
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function PasteBox() {
  const [content, setContent] = useState("")
  const [password, setPassword] = useState("")
  const [expiry, setExpiry] = useState("never")
  const [showOptions, setShowOptions] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [sending, setSending] = useState(false)
  const [resultLink, setResultLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {})
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (!settings?.uploads_enabled) return
      const dropped = Array.from(e.dataTransfer.files)
      addFiles(dropped)
    },
    [settings]
  )

  function addFiles(newFiles: File[]) {
    const added = newFiles.map((f) => ({ file: f, uploading: false }))
    setFiles((prev) => [...prev, ...added])
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function uploadAllFiles(): Promise<
    { id: string; name: string; size: number; mime_type: string }[]
  > {
    const results: { id: string; name: string; size: number; mime_type: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.id) {
        results.push({
          id: f.id,
          name: f.file.name,
          size: f.file.size,
          mime_type: f.file.type,
        })
        continue
      }
      setFiles((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, uploading: true } : item
        )
      )
      const formData = new FormData()
      formData.append("file", f.file)
      try {
        const res = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          setFiles((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? { ...item, uploading: false, error: data.error }
                : item
            )
          )
          toast.error(data.error || "Upload failed")
          continue
        }
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, uploading: false, id: data.id } : item
          )
        )
        results.push({
          id: data.id,
          name: f.file.name,
          size: data.size,
          mime_type: data.mime_type,
        })
      } catch {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, uploading: false, error: "Failed" } : item
          )
        )
      }
    }
    return results
  }

  async function handleSend() {
    if (!content.trim() && files.length === 0) {
      toast.error("Add some text or files to share")
      return
    }

    setSending(true)
    try {
      const uploadedFiles = files.length > 0 ? await uploadAllFiles() : []

      const attachments = uploadedFiles.map((f) => ({
        file_id: f.id,
        name: f.name,
        size: f.size,
        mime_type: f.mime_type,
      }))

      const res = await fetch("/api/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          language: "plaintext",
          password: password || null,
          expires_in: expiry,
          attachments,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create paste")
        setSending(false)
        return
      }
      setResultLink(`${window.location.origin}/c/${data.id}`)
      toast.success("Paste created!")
    } catch {
      toast.error("Something went wrong")
    }
    setSending(false)
  }

  function copyLink() {
    if (!resultLink) return
    navigator.clipboard.writeText(resultLink)
    setCopied(true)
    toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    setContent("")
    setPassword("")
    setExpiry("never")
    setFiles([])
    setResultLink(null)
    setShowOptions(false)
  }

  if (resultLink) {
    return (
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-2xl bg-card p-6 shadow-lg ring-1 ring-border/50">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 animate-in zoom-in duration-300">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Shared Successfully
            </h2>
            <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-muted/60 p-3 transition-colors hover:bg-muted">
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <code className="flex-1 truncate text-sm text-foreground">
                {resultLink}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyLink}
                className="shrink-0 transition-all duration-200 hover:scale-105"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {password && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Password protected
              </p>
            )}
            <Button
              variant="outline"
              onClick={reset}
              className="mt-2 bg-transparent transition-all duration-200 hover:scale-[1.02]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={`rounded-2xl bg-card shadow-lg ring-1 ring-border/50 transition-all duration-300 ${
          dragOver
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.01]"
            : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          if (settings?.uploads_enabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="p-4 pb-0">
          <Textarea
            placeholder="Paste text, code, or anything you want to share..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[160px] resize-none border-0 bg-transparent p-0 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${i}`}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/50 px-3 py-2.5 transition-all duration-200 hover:bg-muted animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-sm">
                  {getFileIcon(f.file.type)}
                </div>
                <div className="flex flex-col">
                  <span className="max-w-[140px] truncate text-xs font-medium text-foreground">
                    {f.file.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatSize(f.file.size)}
                    {f.uploading && " - Uploading..."}
                    {f.error && ` - ${f.error}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-1 rounded-full p-1 text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${f.file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {dragOver && settings?.uploads_enabled && (
          <div className="flex items-center justify-center px-4 py-10 animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="h-10 w-10 animate-bounce" />
              <p className="text-sm font-medium">Drop files here</p>
            </div>
          </div>
        )}

        {showOptions && (
          <div className="mx-4 mt-3 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-xs text-muted-foreground"
              >
                <Lock className="mr-1 inline h-3 w-3" />
                Password (optional)
              </Label>
              <Input
                id="password"
                type="text"
                placeholder="Leave empty for public access"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 bg-card text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="expiry"
                className="text-xs text-muted-foreground"
              >
                <Clock className="mr-1 inline h-3 w-3" />
                Expiration
              </Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry" className="h-8 bg-card text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="10m">10 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-1">
            {settings?.uploads_enabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="h-8 gap-1.5 text-xs text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Attach</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
              className={`h-8 gap-1.5 text-xs transition-all duration-200 ${
                showOptions
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {showOptions ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Options</span>
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || (!content.trim() && files.length === 0)}
            size="sm"
            className="h-9 gap-2 rounded-xl px-5 transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-[0.97] disabled:hover:scale-100"
          >
            {sending ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Sharing...
              </>
            ) : (
              <>
                Share
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files) addFiles(Array.from(e.target.files))
          e.target.value = ""
        }}
      />

      {settings?.uploads_enabled && (
        <p className="mt-3 text-center text-xs text-muted-foreground animate-in fade-in duration-700">
          Drag and drop files or click Attach. Max{" "}
          {settings.max_file_size_mb}MB per file.
        </p>
      )}
    </div>
  )
}
