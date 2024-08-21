
import { ProgramDocPdf } from '@/app/components/pdf-components/pdf-documents/ProgramDocPdf';
import {
  ConditionalFormatting,
  ConditionalFormattingFiltered,
  FieldObject,
} from '@/app/interfaces/FileObject.interface';
import { TranslationObject } from '@/app/interfaces/TranslationObject';
import directus from '@/app/lib/directus';
import BodyProviders from '@/app/providers/BodyProviders';
import { auth, Query, readField, readItem, readTranslations } from '@directus/sdk';

import { Language } from '../../../interfaces/TranslationObject';
import { ProgramData } from '@/app/interfaces/Program.interface';

export default async function Page({ params }: { params: { id: string } }) {
  const program: ProgramData = await getProgram(params.id);
  const activitiesOptions: ConditionalFormattingFiltered[] = await getActivitiesOptions();

  return (
    <BodyProviders>
      <ProgramDocPdf activitiesOptions={activitiesOptions} programData={program} />
    </BodyProviders>
  );
}

// Función para obtener un programa por su ID
async function getProgram(id: string): Promise<ProgramData> {
  try {
    const queryItem = {
      fields: [
        'program_title',
        'start_datetime',
        'bible_text',
        'bible_reference', {
          program_activities: [
            'activity_order',
            'activities', {
              activity_hymn: [
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
              activity_responsible: [
                'last_name',
                'avatar',
                'alias'
              ]
            }
          ]
        }
      ],
    };
    // const queryItem = {
    //   fields: [
    //     '*', {
    //       program_activities: [
    //         '*', {
    //           activity_hymn: [
    //             '*', {
    //               hymnal: [
    //                 'name',
    //                 'publisher'
    //               ],
    //               authors: [
    //                 'author_roles.author_roles_id.description',
    //                 'author_roles.author_roles_id.rol_abbr'
    //               ]
    //             }
    //           ],
    //           activity_responsible: [
    //             '*'
    //           ]
    //         }
    //       ]
    //     }
    //   ],
    // };

    const data = (await directus.request(readItem('programs', id, queryItem))) as ProgramData;
    console.log('Programa obtenido:', data);
    return data;
  } catch (error) {
    console.error('Error al obtener el programa:', error);
    throw error;
  }
}

// Función para obtener las opciones de actividades filtradas y traducidas
async function getActivitiesOptions(): Promise<ConditionalFormattingFiltered[]> {
  try {
    const fieldObject = (await directus.request(
      readField('program_activities', 'activities')
    )) as FieldObject;

    // Verificar si las opciones de formato condicional existen
    const conditionalFormatting = fieldObject.meta?.display_options?.conditionalFormatting;
    if (!conditionalFormatting) {
      console.warn('No se encontró el formato condicional en las opciones de visualización.');
      return [];
    }

    const programActivities: ConditionalFormattingFiltered[] =
      extractTextWithoutPrefix(conditionalFormatting);
    const programActivitiesKeys: string[] = programActivities.map((option) => option.key);

    // Obtener las traducciones y relacionarlas con las opciones
    const translations = await getTranslations(programActivitiesKeys);
    return relateKeyValues(programActivities, translations);
  } catch (error) {
    console.error('Error al obtener las opciones de actividades:', error);
    throw error;
  }
}

// Función para obtener las traducciones
async function getTranslations(programActivities: string[]): Promise<TranslationObject[]> {
  try {
    const language: Language = Language.Es419;

    const queryObject: Query<any, { id: string; language: string; key: string; value: string }> = {
      filter: {
        _and: [{ key: { _in: programActivities } }, { language: { _eq: language } }],
      },
    };

    const translationObject = (await directus.request(
      readTranslations(queryObject)
    )) as TranslationObject[];

    return translationObject;
  } catch (error) {
    console.error('Error al obtener las traducciones:', error);
    throw error;
  }
}

// Función para extraer el texto sin el prefijo '$t:'
function extractTextWithoutPrefix(
  options: ConditionalFormatting[]
): ConditionalFormattingFiltered[] {
  return options.map((option) => ({
    id: option.value,
    key: option.text.replace('$t:', ''),
  }));
}

// Función para relacionar las claves y valores traducidos
function relateKeyValues(
  options: ConditionalFormattingFiltered[],
  translations: TranslationObject[]
): ConditionalFormattingFiltered[] {
  return options.map((option) => ({
    id: option.id,
    key: option.key,
    text: translations.find((translation) => translation.key === option.key)?.value || '',
  }));
}
