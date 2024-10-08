import { HymnDocPdf } from '@/app/components/pdf-components/pdf-documents/HymnDocPdf';
import { ActivityHymn } from '@/app/interfaces/Program.interface';
import directus from '@/app/lib/directus';
import BodyProviders from '@/app/providers/BodyProviders';
import { readItem } from '@directus/sdk';


export default async function Page({ params }: { params: { id: string } }) {
  const hymn = await getHymn(params.id);

  return (
    <BodyProviders>
      <HymnDocPdf  activityHymn={hymn} />
    </BodyProviders>
  );
}

// Función para obtener un programa por su ID
async function getHymn(id: string): Promise<ActivityHymn> {
  try {
    const queryItem = {
      fields: [
        'name',
        'bible_text',
        'bible_reference',
        'hymn_number',
        'hymn_time_signature',
        'letter_hymn', {
          hymnal: [
            'name',
            'publisher'
          ],
          authors: [
            'authors_id.name',
            'author_roles.author_roles_id.description',
            'author_roles.author_roles_id.rol_abbr'
          ]
        }
      ],
    };

    const data = (await directus.request(readItem('hymn', id, queryItem))) as ActivityHymn;
    return data;
  } catch (error) {
    console.error('Error al obtener el programa:', error);
    throw error;
  }
}
