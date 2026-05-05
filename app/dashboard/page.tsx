'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [stats, setStats] = useState({ projects: 0, suppliers: 0, plants: 0, billable: 0 });
  useEffect(() => {
    const run = async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
      const end = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
      const [p, s, pl, logs] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('plants').select('*', { count: 'exact', head: true }),
        supabase.from('plant_logs').select('billable_hours').gte('date', start).lte('date', end)
      ]);
      const total = (logs.data ?? []).reduce((acc: number, row: any) => acc + Number(row.billable_hours || 0), 0);
      setStats({ projects: p.count ?? 0, suppliers: s.count ?? 0, plants: pl.count ?? 0, billable: Number(total.toFixed(2)) });
    }; run();
  }, []);
  return <div className='grid grid-cols-2 gap-3'>{Object.entries(stats).map(([k,v]) => <Card key={k}><p className='text-sm text-slate-500'>{k}</p><p className='text-2xl font-bold'>{v}</p></Card>)}</div>;
}
