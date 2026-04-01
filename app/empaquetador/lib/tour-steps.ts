import type { TourStep } from '@/app/components/GuidedTour';

export const EMPAQUETADOR_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="explorar-himnos"]',
    title: 'Explorar Himnos',
    description:
      'Busca himnos por nombre, numero o categoria. Haz clic para seleccionarlos.',
    position: 'right',
  },
  {
    target: '[data-tour="mi-seleccion"]',
    title: 'Mi Seleccion',
    description:
      'Los himnos seleccionados aparecen aqui. Puedes quitar cualquiera haciendo clic en la X.',
    position: 'right',
  },
  {
    target: '[data-tour="historial"]',
    title: 'Historial',
    description:
      'Accede a paquetes que generaste anteriormente para reutilizarlos.',
    position: 'right',
  },
  {
    target: '[data-tour="configuracion-emp"]',
    title: 'Configuracion',
    description:
      'Ajusta el tamano de letra, estilo de impresion y selecciona las pistas de audio.',
    position: 'top',
  },
  {
    target: '[data-tour="paso-siguiente"]',
    title: 'Siguiente Paso',
    description:
      'Cuando tengas tus himnos, avanza para configurar y descargar tu paquete.',
    position: 'top',
  },
];
