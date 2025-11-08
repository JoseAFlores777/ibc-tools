import { readItems } from '@directus/sdk';
import { getDirectus } from '@/app/lib/directus';
import type { ChurchEvents } from '@/app/lib/directus/directus.interface';

export type ChurchEventListItem = Partial<ChurchEvents> & {
  location?: { name?: string | null; address?: string | null } | string | null;
  cover_image?: string | null;
};

/**
 * Fetch church events from Directus.
 * Mirrors how other pages call Directus (see app/pdf-gen/hymns/[id]/page.tsx).
 */
export async function fetchChurchEvents(options?: { limit?: number }) {
  const client = getDirectus();
  const limit = options?.limit ?? 50;
  const fields = [
    'id',
    'title',
    'description',
    'start_datetime',
    'end_datetime',
    'is_online',
    'meeting_link',
    'cover_image',
    'location.name',
    'location.address',
    'recurrence',
  ] as const;

  const items = await client.request(
    readItems('church_events', {
      sort: ['start_datetime'],
      fields: fields as unknown as string[],
      filter: {
        status: { _neq: 'archived' },
      },
      limit,
    })
  );

  return items as ChurchEventListItem[];
}
