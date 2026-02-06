"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Copy,
  Check,
  Lock,
  FileText,
  ArrowLeft,
  Download,
  ImageIcon,
  FileArchive,
  File,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Attachment {
  file_id: string
  name: string
  size: number
  mime_type: string
}

interface PasteData {
  id: string
  content: string
  language: string
  has_password: boolean
  attachments: Attachment[]
  created_at: string
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
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

export function PasteViewer({ id }: { id: string }) {
  const [paste, setPaste] = useState<PasteData | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/paste/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setNotFound(true)
        } else if (data.has_password && !data.content) {
          setNeedsPassword(true)
        } else {
          setPaste(data)
        }
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [id])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch(`/api/paste/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Wrong password")
        return
      }
      setPaste(data)
      setNeedsPassword(false)
    } catch {
      setError("Something went wrong")
    }
  }

  function copyContent() {
    if (!paste) return
    navigator.clipboard.writeText(paste.content)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl bg-card p-8 text-center shadow-lg ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">
            Paste Not Found
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This paste may have expired or been deleted.
          </p>
          <Link href="/">
            <Button
              variant="outline"
              className="mt-4 gap-2 bg-transparent transition-all duration-200 hover:scale-[1.02]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  if (needsPassword) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-lg ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-4 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 animate-in zoom-in duration-300">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Password Protected
            </h2>
            <p className="text-center text-sm text-muted-foreground">
              Enter the password to view this paste
            </p>
          </div>
          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pw" className="sr-only">
                Password
              </Label>
              <Input
                id="pw"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="transition-all duration-200 hover:scale-[1.02]"
            >
              Unlock
            </Button>
          </form>
        </div>
      </main>
    )
  }

  const imageAttachments =
    paste?.attachments?.filter((a) => a.mime_type?.startsWith("image/")) || []
  const otherAttachments =
    paste?.attachments?.filter((a) => !a.mime_type?.startsWith("image/")) || []

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 md:py-16">
      <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> PasteVault
          </Link>
          {paste?.content && (
            <Button
              variant="ghost"
              size="sm"
              onClick={copyContent}
              className="gap-2 transition-all duration-200 hover:scale-105"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy
            </Button>
          )}
        </div>

        {/* Text content */}
        {paste?.content && (
          <div className="rounded-2xl bg-card p-5 shadow-lg ring-1 ring-border/50">
            <pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground">
              {paste.content}
            </pre>
          </div>
        )}

        {/* Image attachments - rendered inline */}
        {imageAttachments.length > 0 && (
          <div className="mt-4 flex flex-col gap-4">
            {imageAttachments.map((att, i) => (
              <div
                key={att.file_id}
                className="overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/files/serve/${att.file_id}`}
                    alt={att.name}
                    className="mx-auto max-h-[600px] w-auto object-contain"
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {att.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(att.size)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/files/serve/${att.file_id}`}
                    download={att.name}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-transparent transition-all duration-200 hover:scale-105"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other file attachments */}
        {otherAttachments.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {otherAttachments.map((att, i) => (
              <div
                key={att.file_id}
                className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  {getFileIcon(att.mime_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {att.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(att.size)}
                  </p>
                </div>
                <a
                  href={`/api/files/serve/${att.file_id}`}
                  download={att.name}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-transparent transition-all duration-200 hover:scale-105"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Shared{" "}
          {paste?.created_at
            ? new Date(paste.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : ""}
        </p>
      </div>
    </main>
  )
}
