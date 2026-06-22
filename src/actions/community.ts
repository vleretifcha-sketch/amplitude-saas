'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export async function deletePost(id: string) {
  const db = createAdminClient();
  const { error } = await db.from('community_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/community');
}

export async function deleteComment(id: string) {
  const db = createAdminClient();
  const { error } = await db.from('community_comments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/community');
}

export async function deletePostForm(formData: FormData) {
  const id = String(formData.get('post_id'));
  await deletePost(id);
}
