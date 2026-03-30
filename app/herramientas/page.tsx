import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/app/sections/Navbar';
import { Button, Card, CardHeader, CardTitle, CardDescription } from '@/lib/shadcn/ui';
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
      <div className="relative min-h-screen">
        <Navbar />
        <Image
          className="absolute top-0 w-full h-full md:h-screen object-cover object-[50%_70%]"
          src="/images/altar_2.jpg"
          alt="hero"
          width={1920}
          height={1080}
          priority
        />
        <div className="absolute -inset-1 bg-gradient-to-t from-white via-white/60 to-white z-20" />

        <div className="relative z-20 pt-36 pb-16 px-5">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-extrabold text-slate-700 mb-2">Herramientas</h1>
            <p className="text-slate-600">Aplicaciones internas de IBC</p>
            <div className="mt-3 mb-8">
              <Button variant="outline" asChild>
                <Link href="/">Volver atrás</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="group">
                  <Card className="relative flex flex-col overflow-hidden border-slate-200/50 bg-white/20 backdrop-blur-2xl shadow-lg transition-shadow hover:shadow-xl">
                    <CardHeader className="py-3">
                      <tool.icon className="h-10 w-10 text-primary mb-2" />
                      <CardTitle className="text-base text-slate-800 leading-tight">
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600 mt-1">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
