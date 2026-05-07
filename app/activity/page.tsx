'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentMembership } from '@/lib/membership';

type ActivityRow = { id: string; message: string; entity_type: string; actor_user_id: string | null; created_at: string };

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const membership = await getCurrentMembership();
      if (!membership?.organization_id) return;
      const { data } = await supabase
        .from('activity_events')
        .select('id,message,entity_type,actor_user_id,created_at')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false })
        .limit(200);
      setEvents((data ?? []) as ActivityRow[]);
    };
    void load();
  }, []);

  return <section className='space-y-4'>
    <h1 className='text-xl font-semibold'>Activity</h1>
    {events.length === 0 ? <p className='rounded border border-dashed p-6 text-sm text-slate-500'>No activity yet. Events will appear as your team works.</p> :
      <ul className='space-y-2'>{events.map((event) => <li key={event.id} className='rounded border p-3 text-sm'><p>{event.message}</p><p className='text-xs text-slate-500'>{event.entity_type} · {event.actor_user_id ?? 'system'} · {new Date(event.created_at).toLocaleString()}</p></li>)}</ul>}
  </section>;
}
