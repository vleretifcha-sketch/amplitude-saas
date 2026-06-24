import { createAdminClient } from '@/lib/supabase/admin';
import type { Program, Video } from '@/lib/types';

export type ProgramVideoRef = Pick<Video, 'id' | 'type'> & { program_id?: string | null; programId?: string | null };

function programIdOf(video: ProgramVideoRef): string | null | undefined {
  return video.program_id ?? video.programId;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

function storedSignatureIds(program: Pick<Program, 'signature_session_ids' | 'signature_session_id'>): string[] {
  if (program.signature_session_ids?.length) return program.signature_session_ids;
  if (program.signature_session_id) return [program.signature_session_id];
  return [];
}

/** Répartit les IDs enregistrés selon le type réel de la séance (corrige les données mal rangées). */
export function resolveProgramSessionIds(
  program: Pick<Program, 'signature_session_ids' | 'signature_session_id' | 'mobility_session_ids' | 'complementary_session_ids'>,
  videos: ProgramVideoRef[],
  programId: string
): {
  signatureIds: string[];
  mobilityIds: string[];
  complementaryIds: string[];
} {
  const videoById = new Map(videos.map((video) => [video.id, video]));
  const typeOf = (id: string) => videoById.get(id)?.type;

  const signatureIds = uniqueIds(
    storedSignatureIds(program).filter((id) => typeOf(id) === 'signature')
  );

  const mobilityIds = uniqueIds([
    ...(program.mobility_session_ids ?? []),
    ...storedSignatureIds(program).filter((id) => typeOf(id) === 'mobility'),
  ]);

  const complementaryIds = uniqueIds(
    (program.complementary_session_ids ?? []).filter((id) => typeOf(id) === 'complementary')
  );

  if (signatureIds.length === 0) {
    const autoLinked = videos
      .filter((video) => programIdOf(video) === programId && video.type === 'signature')
      .map((video) => video.id);
    signatureIds.push(...autoLinked);
  }

  if (complementaryIds.length === 0) {
    const autoLinked = videos
      .filter((video) => programIdOf(video) === programId && video.type === 'complementary')
      .map((video) => video.id);
    complementaryIds.push(...autoLinked);
  }

  return {
    signatureIds: uniqueIds(signatureIds),
    mobilityIds: uniqueIds(mobilityIds),
    complementaryIds: uniqueIds(complementaryIds),
  };
}

/** Garde uniquement les IDs compatibles avec le type de chaque liste avant enregistrement. */
export async function sanitizeSessionIdsByVideoType(
  db: ReturnType<typeof createAdminClient>,
  signatureSessionIds: string[],
  mobilitySessionIds: string[],
  complementarySessionIds: string[]
): Promise<{
  signatureSessionIds: string[];
  mobilitySessionIds: string[];
  complementarySessionIds: string[];
}> {
  const allIds = uniqueIds([...signatureSessionIds, ...mobilitySessionIds, ...complementarySessionIds]);
  if (allIds.length === 0) {
    return { signatureSessionIds: [], mobilitySessionIds: [], complementarySessionIds: [] };
  }

  const { data } = await db.from('videos').select('id, type').in('id', allIds);
  const typeById = new Map((data ?? []).map((row) => [row.id, row.type as Video['type']]));

  return {
    signatureSessionIds: uniqueIds(signatureSessionIds.filter((id) => typeById.get(id) === 'signature')),
    mobilitySessionIds: uniqueIds(mobilitySessionIds.filter((id) => typeById.get(id) === 'mobility')),
    complementarySessionIds: uniqueIds(
      complementarySessionIds.filter((id) => typeById.get(id) === 'complementary')
    ),
  };
}
