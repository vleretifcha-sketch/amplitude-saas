import type { createAdminClient } from '@/lib/supabase/admin';

type Db = ReturnType<typeof createAdminClient>;

type ProgramRow = {
  id: string;
  signature_session_id: string | null;
  signature_session_ids: string[] | null;
  complementary_session_ids: string[] | null;
};

export async function removeVideoIdsFromPrograms(db: Db, videoIds: string[]) {
  if (videoIds.length === 0) return;

  const idSet = new Set(videoIds);
  const { data: programs } = await db
    .from('programs')
    .select('id, signature_session_id, signature_session_ids, complementary_session_ids');

  for (const program of (programs ?? []) as ProgramRow[]) {
    const signatureIds = (program.signature_session_ids ?? []).filter((id) => !idSet.has(id));
    const complementaryIds = (program.complementary_session_ids ?? []).filter((id) => !idSet.has(id));
    const signatureSingle = program.signature_session_id && idSet.has(program.signature_session_id)
      ? signatureIds[0] ?? null
      : program.signature_session_id;

    const changed =
      signatureIds.length !== (program.signature_session_ids ?? []).length ||
      complementaryIds.length !== (program.complementary_session_ids ?? []).length ||
      signatureSingle !== program.signature_session_id;

    if (!changed) continue;

    await db
      .from('programs')
      .update({
        signature_session_ids: signatureIds,
        signature_session_id: signatureSingle,
        complementary_session_ids: complementaryIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', program.id);
  }
}
