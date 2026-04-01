import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control Remoto | Visualizador',
  description: 'Control remoto movil para el Visualizador de Himnos',
};

export default function ControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
