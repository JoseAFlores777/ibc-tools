import type { TourStep } from '@/app/components/GuidedTour';

export const VISUALIZADOR_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="agregar-himno"]',
    title: 'Agregar Himnos',
    description:
      'Busca himnos por nombre o numero y agregalos a tu lista de reproduccion.',
    position: 'right',
  },
  {
    target: '[data-tour="playlist"]',
    title: 'Lista de Reproduccion',
    description:
      'Aqui aparecen los himnos que agregaste. Arrastralos para reordenar.',
    position: 'right',
  },
  {
    target: '[data-tour="slide-grid"]',
    title: 'Diapositivas',
    description:
      'Selecciona una diapositiva para proyectarla. Usa las flechas del teclado para navegar.',
    position: 'bottom',
  },
  {
    target: '[data-tour="preview"]',
    title: 'Vista Previa',
    description:
      'Muestra como se vera la diapositiva en la pantalla de proyeccion.',
    position: 'left',
  },
  {
    target: '[data-tour="proyectar"]',
    title: 'Proyectar',
    description:
      'Abre la ventana de proyeccion en pantalla completa para mostrar las diapositivas.',
    position: 'left',
  },
  {
    target: '[data-tour="control-remoto"]',
    title: 'Control Remoto',
    description:
      'Controla la proyeccion desde tu celular escaneando el codigo QR.',
    position: 'left',
  },
  {
    target: '[data-tour="configuracion"]',
    title: 'Configuracion',
    description:
      'Cambia la fuente, colores, alineacion y fondo de la proyeccion.',
    position: 'left',
  },
];
