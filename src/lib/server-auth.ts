import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';

export async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error('Unauthorized');
  }
}
