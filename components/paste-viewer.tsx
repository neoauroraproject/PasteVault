"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, Lock, FileText, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface PasteData {
  id: string
  content: string
  language: string
  has_password: boolean
  created_at: string
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
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold text-foreground">Paste Not Found</h1>
          <p className="mt-1 text-sm text-muted-foreground">This paste may have expired or been deleted.</p>
          <Link href="/">
            <Button variant="outline" className="mt-4 gap-2 bg-transparent">
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
        <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Password Protected</h2>
            <p className="text-sm text-muted-foreground text-center">Enter the password to view this paste</p>
          </div>
          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pw" className="sr-only">Password</Label>
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
            <Button type="submit">Unlock</Button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 md:py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> PasteVault
          </Link>
          <Button variant="ghost" size="sm" onClick={copyContent} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <pre className="overflow-auto whitespace-pre-wrap break-words text-sm font-mono text-foreground leading-relaxed">
            {paste?.content}
          </pre>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Shared {paste?.created_at ? new Date(paste.created_at).toLocaleDateString() : ""}
        </p>
      </div>
    </main>
  )
}
