import { supabase } from '@/lib/supabase/client';

export async function createActivityEvent(params: {
  organizationId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await supabase.rpc('create_activity_event', {
    p_organization_id: params.organizationId,
    p_event_type: params.eventType,
    p_entity_type: params.entityType,
    p_entity_id: params.entityId ?? null,
    p_message: params.message,
    p_metadata: params.metadata ?? {}
  });
}
