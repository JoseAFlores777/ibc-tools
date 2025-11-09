import Image from 'next/image';
import Navbar from '../sections/Navbar';
import HorariosClient from './HorariosClient';
import { Button } from '@/lib/shadcn/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HorariosPage() {
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
            <h1 className="text-4xl font-extrabold text-slate-700 mb-2">Horarios</h1>
            <p className="text-slate-600">Conoce nuestros próximos eventos y reuniones.</p>
            <div className="mt-3 mb-8">
              <Button variant="outline" asChild>
                <Link href="/">Volver atrás</Link>
              </Button>
            </div>

            <HorariosClient />
          </div>
        </div>
      </div>
    </div>
  );
}
