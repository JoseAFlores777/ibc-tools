import { Navbar } from "./sections/Navbar";
import Image from 'next/image';



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
						" src="/images/altar_1.jpg" alt="hero" width={1920} height={1080} />
				<div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-white z-20"></div>
			</div>
			<div className="h-[500px] bg-slate-500"></div>
		</div>
	);
}