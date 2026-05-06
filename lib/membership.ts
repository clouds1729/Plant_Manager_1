import { supabase } from '@/lib/supabase/client';
import type { Membership } from '@/lib/auth';

export async function getCurrentMembership(): Promise<Membership | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id,role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  return (data as Membership | null) ?? null;
}
