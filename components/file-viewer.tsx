"use client"

import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FileText, ImageIcon, FileArchive, File } from "lucide-react"
import Link from "next/link"

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />
  if (type === "application/pdf") return <FileText className="h-8 w-8 text-rose-500" />
  if (type.includes("zip") || type.includes("rar") || type.includes("7z"))
    return <FileArchive className="h-8 w-8 text-amber-500" />
  return <File className="h-8 w-8 text-muted-foreground" />
}

interface FileViewerProps {
  id: string
  originalName: string
  mimeType: string
  fileSize: number
}

export function FileViewer({ id, originalName, mimeType, fileSize }: FileViewerProps) {
  const isImage = mimeType.startsWith("image/")
  const downloadUrl = `/api/files/serve/${id}`

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 md:py-16">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> PasteVault
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border/50">
          {isImage && (
            <div className="bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl || "/placeholder.svg"}
                alt={originalName}
                className="mx-auto max-h-[600px] w-auto object-contain"
              />
            </div>
          )}

          <div className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              {getFileIcon(mimeType)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{originalName}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(fileSize)} &middot; {mimeType}
              </p>
            </div>
            <a href={downloadUrl} download={originalName}>
              <Button
                size="sm"
                className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
