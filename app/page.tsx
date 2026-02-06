import { PasteBox } from "@/components/paste-box"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 md:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
          PasteVault
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Share text, code, and files instantly with a short link
        </p>
      </div>
      <PasteBox />
      <footer className="mt-12 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <Link href="/auth/login" className="transition-colors hover:text-foreground">
          Admin
        </Link>
        <p>
          Design and developed by{" "}
          <a
            href="https://t.me/hmrayserver"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            Hmray
          </a>
        </p>
      </footer>
    </main>
  )
}
