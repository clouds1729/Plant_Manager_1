'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentMembership } from '@/lib/membership';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CommentRow = { id: string; body: string; created_at: string; author_user_id: string };

export function CommentsPanel({ entityType, entityId }: { entityType: string; entityId: string | null }) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState('');

  const load = async (orgId?: string | null) => {
    if (!entityId) return;
    const scopedOrgId = orgId ?? organizationId;
    if (!scopedOrgId) return;
    const { data } = await supabase
      .from('comments')
      .select('id,body,created_at,author_user_id')
      .eq('organization_id', scopedOrgId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as CommentRow[]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const membership = await getCurrentMembership();
      const orgId = membership?.organization_id ?? null;
      setOrganizationId(orgId);
      await load(orgId);
    };
    void bootstrap();
  }, [entityId, entityType]);

  const add = async () => {
    if (!organizationId || !entityId || !body.trim()) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;
    const { error } = await supabase.from('comments').insert({
      organization_id: organizationId,
      entity_type: entityType,
      entity_id: entityId,
      author_user_id: userId,
      body: body.trim()
    });
    if (!error) {
      setBody('');
      await load();
    }
  };

  return <section className='mt-4 space-y-2 rounded border p-3'>
    <h3 className='font-medium'>Comments</h3>
    {comments.length === 0 ? <p className='text-sm text-slate-500'>No comments yet.</p> :
      <ul className='space-y-2'>{comments.map((c) => <li key={c.id} className='rounded bg-slate-50 p-2 text-sm'><p>{c.body}</p><p className='text-xs text-slate-500'>{c.author_user_id} · {new Date(c.created_at).toLocaleString()}</p></li>)}</ul>}
    <div className='flex gap-2'>
      <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder='Add a comment' />
      <Button type='button' onClick={add}>Send</Button>
    </div>
  </section>;
}
