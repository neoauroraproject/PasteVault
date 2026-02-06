// This file intentionally left as a no-op to override cached Supabase middleware
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  return NextResponse.next()
}
