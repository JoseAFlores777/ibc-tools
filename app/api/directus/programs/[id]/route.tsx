'use server';


import directus from '@/app/lib/directus';
import { readItems } from '@directus/sdk';
import { NextResponse } from 'next/server';


async function getGlobals():Promise<Record<string, Global>[]> {
	return directus.request(readItems('programs'));
}



export async function GET(request: Request, { params }: { params: { id: string } }) { 
console.log('params',params);
  
  await getGlobals().then((data) => { 
    console.log('DESDE SERVER',data);
  });
  
    // Usar el parámetro 'name' en la lógica de la función
    return NextResponse.json({ message: `Hello, ${params.id}` });
}




export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.email || !body.subject || !body.message) {
    return NextResponse.error();
  }

  try {
    // await transporter.sendMail({
    //   ...mailOptions,
    //   ...generateEmailContent(body),
    //   subject: body.subject,
    // });
  } catch (error) {
    return NextResponse.error();
  }

  return NextResponse.json('');
}
