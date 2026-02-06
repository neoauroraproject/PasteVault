"use client"

import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FileText, ImageIcon } from "lucide-react"
import Link from "next/link"

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
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
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> PasteVault
          </Link>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          {isImage && (
            <div className="mb-4 overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl || "/placeholder.svg"}
                alt={originalName}
                className="mx-auto max-h-[500px] w-auto object-contain"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            {isImage ? (
              <ImageIcon className="h-8 w-8 shrink-0 text-blue-500" />
            ) : (
              <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-foreground">{originalName}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(fileSize)} &middot; {mimeType}
              </p>
            </div>
            <a href={downloadUrl} download={originalName}>
              <Button size="sm" className="gap-2">
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
