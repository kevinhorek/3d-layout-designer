import { redirect } from 'next/navigation'

export default async function SharedLayoutPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(`/?shareToken=${encodeURIComponent(token)}`)
}
