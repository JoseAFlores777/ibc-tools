
import Image from 'next/image';
import Navbar from './sections/Navbar';
import { Button } from '@/lib/shadcn/ui';
import Link from 'next/link';



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
						<h1 className="text-5xl font-extrabold text-slate-600">¡En Construcción!</h1>
						<p className="text-xl text-slate-700">Muy Pronto ...</p>
						<p className="text-lg font-bold text-slate-700">Visita nuestras redes:</p>
						<div className="flex flex-col mt-5 gap-5 w-10/12">
						<Button size={'lg'} variant="outline" asChild>
							<Link href={'https://www.facebook.com/ibcunafamiliaconamor'} target='_blank'>Facebook</Link>
						</Button>

						<Button size={'lg'} variant="outline" asChild>
							<Link href={'https://www.youtube.com/@ibchn'} target='_blank'>Youtube</Link>
						</Button>

						<Button size={'lg'} variant="outline" asChild>
							<Link href={'https://stream-172.zeno.fm/rjmlzssxpi4uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJyam1senNzeHBpNHV2IiwiaG9zdCI6InN0cmVhbS0xNzIuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6InhiQWt2MXJuU25pM1NpWjBWYUxiZnciLCJpYXQiOjE3MjgzNjkzOTMsImV4cCI6MTcyODM2OTQ1M30.HO23TAbWb0E5Ny5omqKts230P-G7v5CRJP0M3Mp53Ao&inappbrowser=true'} target='_blank'>Radio IBC</Link>
						</Button>

						<Button size={'lg'} variant="outline" asChild>
							<Link href={'https://onelink.to/ibchn'} target='_blank'>Descarga nuestra App</Link>
						</Button>

						</div>
					</div>
					</div>

			</div>
			<div className="h-auto bg-slate-500"></div>
		</div>
	);
}