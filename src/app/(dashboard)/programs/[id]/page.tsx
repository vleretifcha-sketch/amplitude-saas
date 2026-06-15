import { redirect } from 'next/navigation';

export default async function LegacyProgramRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const methodId = id.startsWith('prog-') ? `meth-${id.slice(5)}` : `meth-${id}`;
  redirect(`/methods/${methodId}`);
}
