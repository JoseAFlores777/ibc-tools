
import Image from 'next/image';
import Navbar from './sections/Navbar';
import { Button } from '@/lib/shadcn/ui';



export default async function HomePage() {

  
	return (
		<div className="">
			<div className="relative h-screen">
				<Navbar />
					<Image
						className="
						absolute
						top-0
						w-full
						h-screen
						object-cover
						object-[50%_70%]
						" src="/images/altar_2.jpg" alt="hero" width={1920} height={1080} />
				<div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-white z-20">
				</div>

				<div className="absolute inset-0 flex items-center justify-center z-20 px-5">
					<div className="flex flex-col gap-5 items-center text-center">
						<h1 className="text-5xl font-extrabold text-slate-600">¡Bienvenido al Calvario!</h1>
						<p className="text-xl text-slate-700">Una Familia con Amor</p>
						<div className="flex flex-col mt-5 gap-5 w-10/12">
						<Button size={'lg'} variant="outline"> Declaración de Fe</Button>
						<Button size={'lg'} variant="outline">Servicios</Button>
						</div>
					</div>
					</div>

			</div>
			<div className="h-[1000px] bg-slate-500">asdas</div>
		</div>
	);
}