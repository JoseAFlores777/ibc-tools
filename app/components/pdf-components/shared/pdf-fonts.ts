import { Font } from '@react-pdf/renderer';
import path from 'path';

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Adamina',
  src: path.join(fontsDir, 'adamina', 'Adamina.ttf'),
});
