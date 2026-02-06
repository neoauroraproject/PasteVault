"use server"

import { isAuthenticated } from "@/lib/auth"
import {
  getAllPastes,
  deletePaste,
  getAllFiles,
  deleteFileRecord,
  getSettings,
  updateSettings,
  changeAdminPassword,
  verifyPassword,
} from "@/lib/db"
import { revalidatePath } from "next/cache"

async function requireAuth(): Promise<boolean> {
  try {
    return await isAuthenticated()
  } catch {
    return false
  }
}

export async function getAdminPastes() {
  const authed = await requireAuth()
  if (!authed) return []
  return getAllPastes()
}

export async function adminDeletePaste(id: string) {
  const authed = await requireAuth()
  if (!authed) return
  deletePaste(id)
  revalidatePath("/admin")
}

export async function getAdminFiles() {
  const authed = await requireAuth()
  if (!authed) return []
  return getAllFiles()
}

export async function adminDeleteFile(id: string) {
  const authed = await requireAuth()
  if (!authed) return
  deleteFileRecord(id)
  revalidatePath("/admin/files")
}

export async function getAdminSettings() {
  const authed = await requireAuth()
  if (!authed) {
    return {
      uploads_enabled: true,
      max_file_size_mb: 50,
      allowed_formats: "",
    }
  }
  const s = getSettings()
  return {
    uploads_enabled: s.uploads_enabled,
    max_file_size_mb: s.max_file_size_mb,
    allowed_formats: s.allowed_formats,
  }
}

export async function saveAdminSettings(data: {
  uploads_enabled: boolean
  max_file_size_mb: number
  allowed_formats: string
}) {
  const authed = await requireAuth()
  if (!authed) return { success: false, error: "Unauthorized" }
  updateSettings(data)
  revalidatePath("/admin/settings")
  revalidatePath("/")
  return { success: true }
}

export async function adminChangePassword(currentPassword: string, newPassword: string) {
  const authed = await requireAuth()
  if (!authed) return { success: false, error: "Unauthorized" }

  if (!verifyPassword(currentPassword)) {
    return { success: false, error: "Current password is incorrect" }
  }

  if (newPassword.length < 4) {
    return { success: false, error: "New password must be at least 4 characters" }
  }

  changeAdminPassword(newPassword)
  return { success: true }
}
