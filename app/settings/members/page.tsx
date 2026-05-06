'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentMembership } from '@/lib/membership';
import type { OrgRole } from '@/lib/approvals/roles';
import { ORG_ROLES } from '@/lib/approvals/roles';
import { canManageMembership } from '@/lib/membershipRoles';

type MemberRow = {
  user_id: string;
  role: OrgRole;
  created_at: string;
};

export default function MembersSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<OrgRole | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<OrgRole>('viewer');

  const load = async () => {
    setLoading(true);
    setError(null);
    const membership = await getCurrentMembership();
    if (!membership) {
      setLoading(false);
      return;
    }

    setOrganizationId(membership.organization_id);
    setCurrentRole(membership.role);

    if (!canManageMembership(membership.role)) {
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc('get_organization_members_admin', {
      org_id: membership.organization_id
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setMembers((data ?? []) as MemberRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const addMember = async () => {
    setError(null);
    const { error: rpcError } = await supabase.rpc('add_organization_member', {
      target_org_id: organizationId,
      target_user_id: newUserId,
      target_role: newRole
    });
    if (rpcError) setError(rpcError.message);
    setNewUserId('');
    await load();
  };

  const updateRole = async (userId: string, role: OrgRole) => {
    setError(null);
    const { error: rpcError } = await supabase.rpc('update_organization_member_role', {
      target_org_id: organizationId,
      target_user_id: userId,
      target_role: role
    });
    if (rpcError) setError(rpcError.message);
    await load();
  };

  const removeMember = async (userId: string) => {
    setError(null);
    const { error: rpcError } = await supabase.rpc('remove_organization_member', {
      target_org_id: organizationId,
      target_user_id: userId
    });
    if (rpcError) setError(rpcError.message);
    await load();
  };

  return (
    <main className='space-y-4'>
      <h1 className='text-2xl font-semibold'>Organization Members</h1>
      <p className='text-sm text-slate-600'>Organization: {organizationId ?? 'unknown'} | Your role: {currentRole ?? 'unknown'}</p>
      {error && <p className='text-sm text-red-600'>{error}</p>}

      {loading ? <p className='text-sm text-slate-500'>Loading members…</p> : null}

      {!loading && currentRole && !canManageMembership(currentRole) ? (
        <p className='text-sm text-slate-700'>Admin access required for membership changes.</p>
      ) : null}

      {!loading && currentRole && canManageMembership(currentRole) ? (
        <>
          <div className='rounded border p-3 space-y-2'>
            <h2 className='font-medium'>Add member</h2>
            <input className='w-full rounded border p-2 text-sm' placeholder='User UUID' value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
            <select className='rounded border p-2 text-sm' value={newRole} onChange={(e) => setNewRole(e.target.value as OrgRole)}>
              {ORG_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <button className='rounded bg-slate-900 px-3 py-2 text-sm text-white' onClick={addMember}>Add member</button>
          </div>

          <table className='w-full text-sm border-collapse'>
            <thead>
              <tr className='border-b'>
                <th className='text-left p-2'>user_id</th>
                <th className='text-left p-2'>role</th>
                <th className='text-left p-2'>created_at</th>
                <th className='text-left p-2'>actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.user_id} className='border-b'>
                  <td className='p-2'>{member.user_id}</td>
                  <td className='p-2'>
                    <select className='rounded border p-1' value={member.role} onChange={(e) => void updateRole(member.user_id, e.target.value as OrgRole)}>
                      {ORG_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className='p-2'>{new Date(member.created_at).toLocaleString()}</td>
                  <td className='p-2'>
                    <button className='rounded bg-red-600 px-2 py-1 text-white' onClick={() => void removeMember(member.user_id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </main>
  );
}
