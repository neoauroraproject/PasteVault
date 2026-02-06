"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { saveAdminSettings, adminChangePassword } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface SettingsData {
  uploads_enabled: boolean
  max_file_size_mb: number
  allowed_formats: string
}

export function AdminSettingsForm({ settings }: { settings: SettingsData }) {
  const router = useRouter()

  // Upload settings
  const [uploadsEnabled, setUploadsEnabled] = useState(settings.uploads_enabled)
  const [maxSize, setMaxSize] = useState(String(settings.max_file_size_mb))
  const [formats, setFormats] = useState(settings.allowed_formats)
  const [savingSettings, setSavingSettings] = useState(false)

  // Password change
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [savingPw, setSavingPw] = useState(false)

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await saveAdminSettings({
        uploads_enabled: uploadsEnabled,
        max_file_size_mb: Number(maxSize) || 50,
        allowed_formats: formats,
      })
      toast.success("Settings saved")
      router.refresh()
    } catch {
      toast.error("Failed to save settings")
    }
    setSavingSettings(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      toast.error("New passwords don't match")
      return
    }
    setSavingPw(true)
    try {
      const result = await adminChangePassword(currentPw, newPw)
      if (!result.success) {
        toast.error(result.error || "Failed")
      } else {
        toast.success("Password changed")
        setCurrentPw("")
        setNewPw("")
        setConfirmPw("")
      }
    } catch {
      toast.error("Failed to change password")
    }
    setSavingPw(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Settings */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">File Upload Settings</CardTitle>
          <CardDescription>Control what files public users can upload</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable File Uploads</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Allow public users to attach files</p>
              </div>
              <Switch checked={uploadsEnabled} onCheckedChange={setUploadsEnabled} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="maxSize">Max File Size (MB)</Label>
              <Input
                id="maxSize"
                type="number"
                min="1"
                max="500"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                className="w-32 bg-muted/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="formats">Allowed File Extensions</Label>
              <Input
                id="formats"
                value={formats}
                onChange={(e) => setFormats(e.target.value)}
                placeholder="jpg,png,pdf,zip"
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of file extensions</p>
            </div>
            <Button
              type="submit"
              disabled={savingSettings}
              className="w-fit transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {savingSettings ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Saving...
                </span>
              ) : (
                "Save Settings"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Change Admin Password</CardTitle>
          <CardDescription>Update your admin login password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPw">Current Password</Label>
              <Input
                id="currentPw"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPw">New Password</Label>
              <Input
                id="newPw"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={4}
                className="bg-muted/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPw">Confirm New Password</Label>
              <Input
                id="confirmPw"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>
            <Button
              type="submit"
              disabled={savingPw}
              className="w-fit transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {savingPw ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Changing...
                </span>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
