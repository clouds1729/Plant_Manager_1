'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { isProtectedPath, type Membership } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);

  const protectedRoute = useMemo(() => isProtectedPath(pathname), [pathname]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setIsAuthed(Boolean(user));

      if (user) {
        const { data: membershipRow } = await supabase
          .from('organization_members')
          .select('organization_id,role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        setMembership((membershipRow as Membership | null) ?? null);
      } else {
        setMembership(null);
      }

      setLoading(false);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className='text-sm text-slate-500'>Loading auth…</div>;

  if (protectedRoute && !isAuthed) {
    return (
      <main className='space-y-3'>
        <h1 className='text-2xl font-semibold'>Sign-in required</h1>
        <p className='text-sm text-slate-600'>Please sign in to access this page.</p>
        <Link className='underline' href='/login'>Go to login</Link>
      </main>
    );
  }

  if (protectedRoute && isAuthed && !membership) {
    return (
      <main className='space-y-3'>
        <h1 className='text-2xl font-semibold'>No organization membership found</h1>
        <p className='text-sm text-slate-600'>Your account is authenticated but is not linked to an organization member record.</p>
        <Button type='button' onClick={logout}>Logout</Button>
      </main>
    );
  }

  return (
    <>
      <nav className='mb-6 flex flex-wrap items-center gap-4 text-sm'>
        <Link href='/'>Home</Link><Link href='/dashboard'>Dashboard</Link><Link href='/projects'>Projects</Link><Link href='/suppliers'>Suppliers</Link><Link href='/plants'>Plants</Link><Link href='/logs'>Daily Logs</Link>
        <Link href='/rates'>Rates</Link><Link href='/ipc-periods'>IPC Periods</Link><Link href='/imports'>Imports</Link><Link href='/supplier-portal'>Supplier Portal</Link><Link href='/settings/members'>Members</Link>
        {membership && <span className='text-slate-500'>Org: {membership.organization_id} ({membership.role})</span>}
        {isAuthed ? <Button type='button' onClick={logout}>Logout</Button> : <Link href='/login'>Login</Link>}
      </nav>
      {children}
    </>
  );
}
