import { createAdminClient } from '@/lib/supabase/admin';
import { uniqueId } from '@/lib/slug';

export type SyncReport = {
  libraryImported: number;
  orphansLinked: number;
  duplicatesRemoved: number;
  legacyRemoved: number;
  programsSynced: number;
  videosReassigned: number;
};

function parseIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((v) => String(v).trim()).filter(Boolean))];
}

export async function runContentSync(): Promise<SyncReport> {
  const db = createAdminClient();
  const report: SyncReport = {
    libraryImported: 0,
    orphansLinked: 0,
    duplicatesRemoved: 0,
    legacyRemoved: 0,
    programsSynced: 0,
    videosReassigned: 0,
  };

  const { data: prescriptions } = await db.from('video_exercises').select('name, muscle_groups');
  const byName = new Map<string, string | null>();
  for (const row of prescriptions ?? []) {
    const name = row.name.trim();
    if (!name || byName.has(name)) continue;
    byName.set(name, row.muscle_groups?.trim() || null);
  }

  for (const [name, muscle_groups] of byName) {
    const { data: existing } = await db.from('exercises').select('id').eq('name', name).maybeSingle();
    const id = existing?.id ?? (await uniqueId(db, 'exercises', 'ex-', name));

    const { error } = await db.from('exercises').upsert({
      id,
      name,
      muscle_groups,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    const { data: linked } = await db
      .from('video_exercises')
      .update({ library_exercise_id: id, updated_at: new Date().toISOString() })
      .eq('name', name)
      .is('library_exercise_id', null)
      .select('id');

    report.libraryImported += 1;
    report.orphansLinked += linked?.length ?? 0;
  }

  const { data: allExercises } = await db
    .from('video_exercises')
    .select('id, video_id, name, library_exercise_id, sort_order')
    .order('video_id')
    .order('sort_order');

  type VideoExerciseRow = NonNullable<typeof allExercises>[number];

  const byVideo = new Map<string, VideoExerciseRow[]>();
  for (const row of allExercises ?? []) {
    const list = byVideo.get(row.video_id) ?? [];
    list.push(row);
    byVideo.set(row.video_id, list);
  }

  const toDelete = new Set<string>();

  for (const rows of byVideo.values()) {
    const linkedByLibrary = new Map<string, VideoExerciseRow>();
    for (const row of rows) {
      if (!row.library_exercise_id) continue;
      const key = row.library_exercise_id;
      const existing = linkedByLibrary.get(key);
      if (!existing || row.sort_order < existing.sort_order) {
        if (existing) toDelete.add(existing.id);
        linkedByLibrary.set(key, row);
      } else {
        toDelete.add(row.id);
      }
    }

    for (const row of rows) {
      if (row.library_exercise_id) continue;
      const linkedSameName = rows.find(
        (other) =>
          other.id !== row.id &&
          other.library_exercise_id &&
          other.name.trim().toLowerCase() === row.name.trim().toLowerCase()
      );
      if (linkedSameName) toDelete.add(row.id);
    }
  }

  if (toDelete.size > 0) {
    const { error } = await db.from('video_exercises').delete().in('id', [...toDelete]);
    if (error) throw new Error(error.message);
    report.duplicatesRemoved += [...toDelete].filter((id) => {
      const row = allExercises?.find((r) => r.id === id);
      return row?.library_exercise_id;
    }).length;
    report.legacyRemoved += [...toDelete].filter((id) => {
      const row = allExercises?.find((r) => r.id === id);
      return !row?.library_exercise_id;
    }).length;
  }

  const { data: programs } = await db.from('programs').select('*');
  for (const program of programs ?? []) {
    const signatureIds = parseIdList(
      program.signature_session_ids?.length
        ? program.signature_session_ids
        : program.signature_session_id
          ? [program.signature_session_id]
          : []
    );
    const complementaryIds = parseIdList(program.complementary_session_ids);
    const mobilityIds = parseIdList(program.mobility_session_ids);
    const sessionIds = [...signatureIds, ...mobilityIds, ...complementaryIds];

    if (signatureIds.length) {
      await db
        .from('programs')
        .update({
          signature_session_ids: signatureIds,
          signature_session_id: signatureIds[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', program.id);
    }

    if (sessionIds.length) {
      const { data: updated } = await db
        .from('videos')
        .update({ program_id: program.id, updated_at: new Date().toISOString() })
        .in('id', sessionIds)
        .select('id');
      report.videosReassigned += updated?.length ?? 0;
    }

    report.programsSynced += 1;
  }

  return report;
}
