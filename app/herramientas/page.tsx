import Link from 'next/link';
import Navbar from '@/app/sections/Navbar';
import { Card, CardHeader, CardTitle, CardDescription } from '@/lib/shadcn/ui';
import { Package } from 'lucide-react';

const tools = [
  {
    title: 'Empaquetador de Himnos',
    description: 'Selecciona himnos, configura letras y audio, y descarga un ZIP listo para usar.',
    href: '/empaquetador',
    icon: Package,
  },
];

export default function HerramientasPage() {
  return (
    <div className="">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Herramientas</h1>
        <p className="text-lg text-slate-600 mb-8">Aplicaciones internas de IBC</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <tool.icon className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
