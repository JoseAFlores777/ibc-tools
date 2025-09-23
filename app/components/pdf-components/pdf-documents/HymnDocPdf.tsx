'use client';

import { Document } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import React from 'react';


import { HymnPagePdf } from '../pdf-pages/HymnPagePdf';
import { ActivityHymn } from '@/app/interfaces/Program.interface';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const PDFDownloadLink = dynamic<any>(() => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink), {
  ssr: false,
});
export interface HymnDocPdfProps {
  activityHymn: ActivityHymn;
}

//

// export const HymnDocPdf: React.FC<HymnDocPdfProps> = ({
//   activityHymn
// }) => {

//   return (
//     <div
//       style={{
//         width: '100%',
//         height: '100vh',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#f7f7f7',
//       }}
//     >
//       <PDFViewer width="100%" height="100%">
//         <Document title={`${activityHymn.hymn_number} - ${activityHymn.name}`}>
//           <HymnPagePdf activityHymn={activityHymn} />
//         </Document>
//       </PDFViewer>
//     </div>
//   );
// };




const MyDoc: React.FC<HymnDocPdfProps> = ({ activityHymn }) => {

  return (
    <Document title={`#${activityHymn.hymn_number} ${activityHymn.name} (${activityHymn.hymnal.name})`}>
      <HymnPagePdf activityHymn={activityHymn} />
    </Document>
  );
};

export const HymnDocPdf: React.FC<HymnDocPdfProps> = ({ activityHymn }) => {
    
    
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(189, 189, 189)',
      }}
    >
      <PDFViewer width="100%" height="90%">
        <MyDoc activityHymn={activityHymn} />
      </PDFViewer>
      <PDFDownloadLink
        document={<MyDoc activityHymn={activityHymn} />}
        fileName={`${activityHymn.hymn_number} - ${activityHymn.name}.pdf`}
        style={{
          alignSelf: 'center',
          margin: 'auto',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
        }}
      >
        {({ loading }: { loading: boolean }) => (loading ? 'Generating document...' : 'Descargar PDF')}
      </PDFDownloadLink>
    </div>
  );
};
