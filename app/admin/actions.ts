"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createConfig(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const content = formData.get("content") as string
  const password = (formData.get("password") as string) || null
  const expiresAt = (formData.get("expires_at") as string) || null

  const { error } = await supabase.from("configs").insert({
    name,
    content,
    password,
    expires_at: expiresAt || null,
    enabled: true,
    user_id: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}

export async function updateConfig(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const content = formData.get("content") as string
  const password = (formData.get("password") as string) || null
  const expiresAt = (formData.get("expires_at") as string) || null

  const { error } = await supabase.from("configs").update({
    name,
    content,
    password,
    expires_at: expiresAt || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}

export async function toggleConfig(id: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from("configs").update({
    enabled,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}

export async function deleteConfig(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from("configs").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}

export async function toggleFile(id: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from("files").update({
    enabled,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/files")
}

export async function deleteFile(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get file path first
  const { data: file } = await supabase.from("files").select("file_path").eq("id", id).eq("user_id", user.id).single()
  if (file) {
    await supabase.storage.from("uploads").remove([file.file_path])
  }

  const { error } = await supabase.from("files").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/files")
}
