import { PasteViewer } from "@/components/paste-viewer"

export const dynamic = "force-dynamic"

export default async function PastePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PasteViewer id={id} />
}
