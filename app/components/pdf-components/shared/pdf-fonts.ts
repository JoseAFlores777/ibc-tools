import { Font } from '@react-pdf/renderer';

const isServer = typeof window === 'undefined';

if (isServer) {
  // Server-side: usar ruta del filesystem
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path');
  Font.register({
    family: 'Adamina',
    src: path.join(process.cwd(), 'public', 'fonts', 'adamina', 'Adamina.ttf'),
  });
} else {
  // Client-side: usar URL pública
  Font.register({
    family: 'Adamina',
    src: '/fonts/adamina/Adamina.ttf',
  });
}
