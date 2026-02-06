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

export async function getAdminPastes() {
  const authed = await isAuthenticated()
  if (!authed) throw new Error("Unauthorized")
  return getAllPastes()
}

export async function adminDeletePaste(id: string) {
  const authed = await isAuthenticated()
  if (!authed) throw new Error("Unauthorized")
  deletePaste(id)
  revalidatePath("/admin")
}

export async function getAdminFiles() {
  const authed = await isAuthenticated()
  if (!authed) throw new Error("Unauthorized")
  return getAllFiles()
}

export async function adminDeleteFile(id: string) {
  const authed = await isAuthenticated()
  if (!authed) throw new Error("Unauthorized")
  deleteFileRecord(id)
  revalidatePath("/admin/files")
}

export async function getAdminSettings() {
  const authed = await isAuthenticated()
  if (!authed) throw new Error("Unauthorized")
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
  const authed = await isAuthenticated()
  if (!authed) throw new Error("Unauthorized")
  updateSettings(data)
  revalidatePath("/admin/settings")
}

export async function adminChangePassword(currentPassword: string, newPassword: string) {
  const authed = await isAuthenticated()
  if (!authed) throw new Error("Unauthorized")

  if (!verifyPassword(currentPassword)) {
    return { success: false, error: "Current password is incorrect" }
  }

  if (newPassword.length < 4) {
    return { success: false, error: "New password must be at least 4 characters" }
  }

  changeAdminPassword(newPassword)
  return { success: true }
}
