'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : 'Signed in successfully.');
  };

  return (
    <main className='max-w-md space-y-3'>
      <h1 className='text-2xl font-semibold'>Sign in</h1>
      <Input placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type='button' onClick={signIn}>Sign in</Button>
      {message && <p className='text-sm text-slate-600'>{message}</p>}
    </main>
  );
}
