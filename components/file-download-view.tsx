"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Download, FileIcon, ImageIcon } from "lucide-react"

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

interface FileDownloadViewProps {
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string | null
  downloadUrl: string
}

export function FileDownloadView({
  fileName,
  originalName,
  fileSize,
  mimeType,
  downloadUrl,
}: FileDownloadViewProps) {
  const isImage = mimeType?.startsWith("image/")

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            {isImage ? (
              <ImageIcon className="h-6 w-6 text-primary" />
            ) : (
              <FileIcon className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-lg text-foreground">{fileName}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {originalName} &middot; {formatSize(fileSize)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isImage && (
            <div className="overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl || "/placeholder.svg"}
                alt={fileName}
                className="w-full object-contain"
              />
            </div>
          )}
          <a
            href={downloadUrl}
            download={originalName}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </a>
        </CardContent>
      </Card>
    </main>
  )
}
