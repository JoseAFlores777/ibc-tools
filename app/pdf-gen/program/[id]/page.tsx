import { IbcProgramPdf, IbcProgramPdfProps } from "@/app/components/pdf-components/IbcProgramPdf";
import { ConditionalFormatting, ConditionalFormattingFiltered, FieldObject } from "@/app/interfaces/FileObject.interface";
import { TranslationObject } from "@/app/interfaces/TranslationObject";
import directus from "@/app/lib/directus";
import BodyProviders from "@/app/providers/BodyProviders";
import { Query, readField, readItem, readTranslations } from "@directus/sdk";
import { Language } from '../../../interfaces/TranslationObject';
import { ProgramObject } from '../../../interfaces/ProgramObject.interface';

export default async function Page({ params }: { params: { id: string } }) {
  const program: ProgramObject = await getProgram(params.id);
  const activitiesOptions: ConditionalFormattingFiltered [] = await getActivitiesOptions();

  return (
    <BodyProviders>
      
        <IbcProgramPdf activitiesOptions={activitiesOptions} programObject={program} />
      
    </BodyProviders>
  );
}



// Función para obtener un programa por su ID
async function getProgram(id: string): Promise<ProgramObject> {
  try {
    const queryItem = {
      fields: [
        '*.*.*'
      ]
    };

    const data = await directus.request(readItem('programs', id, queryItem)) as ProgramObject;
    console.log('Programa:', data.program_activities.filter(activity => activity.activities === '1')[0].activity_responsible.alias);
    return data;
  } catch (error) {
    console.error('Error al obtener el programa:', error);
    throw error;
  }
}

// Función para obtener las opciones de actividades filtradas y traducidas
async function getActivitiesOptions(): Promise<ConditionalFormattingFiltered[]> {
  try {
    const fieldObject = await directus.request(readField('program_activities', 'activities')) as FieldObject;

    // Verificar si las opciones de formato condicional existen
    const conditionalFormatting = fieldObject.meta?.display_options?.conditionalFormatting;
    if (!conditionalFormatting) {
      console.warn('No se encontró el formato condicional en las opciones de visualización.');
      return [];
    }

    const programActivities: ConditionalFormattingFiltered[] = extractTextWithoutPrefix(conditionalFormatting);
    const programActivitiesKeys: string[] = programActivities.map(option => option.key);


    // Obtener las traducciones y relacionarlas con las opciones
    const translations = await getTranslations(programActivitiesKeys);
    return relateKeyValues(programActivities, translations);
  } catch (error) {
    console.error('Error al obtener las opciones de actividades:', error);
    throw error;
  }
}

// Función para obtener las traducciones
async function getTranslations(programActivities:string[]): Promise<TranslationObject[]> {
  try {
    
    const language: Language = Language.Es419;

    const queryObject: Query<any, { id: string; language: string; key: string; value: string }> = {
      filter: {
        _and: [
          { key: { _in: programActivities } },
          { language: { _eq: language } }
        ]
      }
    };

    const translationObject = await directus.request(readTranslations(queryObject)) as TranslationObject[];

    return translationObject;
  } catch (error) {
    console.error('Error al obtener las traducciones:', error);
    throw error;
  }
}

// Función para extraer el texto sin el prefijo '$t:'
function extractTextWithoutPrefix(options: ConditionalFormatting[]): ConditionalFormattingFiltered[] {
  return options.map(option => ({
    id: option.value,
    key: option.text.replace('$t:', '')
  }));
}

// Función para relacionar las claves y valores traducidos
function relateKeyValues(options: ConditionalFormattingFiltered[], translations: TranslationObject[]): ConditionalFormattingFiltered[] {
  return options.map(option => ({
    id: option.id,
    key: option.key,
    text: translations.find(translation => translation.key === option.key)?.value || ''
  }));
}
