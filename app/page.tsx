import { PasteBox } from "@/components/paste-box"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 md:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          PasteVault
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share text, code and files instantly
        </p>
      </div>
      <PasteBox />
    </main>
  )
}
