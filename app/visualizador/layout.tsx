import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visualizador de Himnos | IBC Tools',
  description:
    'Visualizador tipo ProPresenter para proyectar himnos en pantalla completa',
};

export default function VisualizadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark bg-background text-foreground">{children}</div>
  );
}
