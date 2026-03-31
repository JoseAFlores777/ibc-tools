import { z } from 'zod';

/**
 * Schema de validacion para solicitudes de paquete de himnos.
 * Valida IDs de himnos, seleccion de audio, layout y estilo.
 */
export const packageRequestSchema = z.object({
  hymns: z
    .array(
      z.object({
        id: z.string().uuid(),
        audioFiles: z
          .array(
            z.enum([
              'track_only',
              'midi_file',
              'soprano_voice',
              'alto_voice',
              'tenor_voice',
              'bass_voice',
            ]),
          )
          .optional()
          .default([]),
      }),
    )
    .min(1, 'Al menos un himno es requerido')
    .max(50, 'Maximo 50 himnos por paquete'),
  layout: z.enum(['one-per-page', 'two-per-page']),
  style: z.enum(['decorated', 'plain']),
  copiesPerPage: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional().default(1),
  copiesFontSize: z.number().min(6).max(14).optional().default(9),
});

export type PackageRequest = z.infer<typeof packageRequestSchema>;
