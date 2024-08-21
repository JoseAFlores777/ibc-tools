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
      fields: ['*.*'],
    };

    const data = (await directus.request(readItem('hymn', id, queryItem))) as ActivityHymn;
    return data;
  } catch (error) {
    console.error('Error al obtener el programa:', error);
    throw error;
  }
}
