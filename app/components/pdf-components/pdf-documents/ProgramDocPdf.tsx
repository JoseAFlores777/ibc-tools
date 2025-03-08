'use client';

import { ConditionalFormattingFiltered } from '@/app/interfaces/FileObject.interface';
import { Document, Page } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import dynamic from 'next/dynamic';
import React from 'react';

import { ProgramData } from '@/app/interfaces/Program.interface';
import { HymnPagePdf } from '../pdf-pages/HymnPagePdf';
import { ProgramPagePdf } from '../pdf-pages/ProgramPagePdf';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink), {
  ssr: false,
});

export interface ProgramDocPdfProps {
  programData: ProgramData;
  activitiesOptions: ConditionalFormattingFiltered[];
}

const MyDoc: React.FC<ProgramDocPdfProps> = ({ programData, activitiesOptions }) => {
  const formattedDate = format(new Date(programData.start_datetime), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <Document title={`${programData.program_title} ${formattedDate}`}>
      <ProgramPagePdf programData={programData} activitiesOptions={activitiesOptions} />
      {programData.program_activities.map((activity, index) =>
        activity.activity_hymn ? <HymnPagePdf key={index} activityHymn={activity.activity_hymn} /> : null
      )}
    </Document>
  );
};

export const ProgramDocPdf: React.FC<ProgramDocPdfProps> = ({ programData, activitiesOptions }) => {
    const startDatetime = new Date(programData.start_datetime);
    const formattedDate = format(startDatetime, "EEEE, d 'de' MMMM yyyy", { locale: es });
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
        <MyDoc programData={programData} activitiesOptions={activitiesOptions} />
      </PDFViewer>
      <PDFDownloadLink
        document={<MyDoc programData={programData} activitiesOptions={activitiesOptions} />}
        fileName={`${programData.program_title}- ${formattedDate}.pdf`}
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
        {({ loading }) => (loading ? 'Generating document...' : 'Descargar PDF')}
      </PDFDownloadLink>
    </div>
  );
};
