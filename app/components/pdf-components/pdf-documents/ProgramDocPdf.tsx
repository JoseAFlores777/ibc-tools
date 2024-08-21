'use client';

import { ConditionalFormattingFiltered } from '@/app/interfaces/FileObject.interface';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import dynamic from 'next/dynamic';
import React from 'react';


import { HymnPagePdf } from '../pdf-pages/HymnPagePdf';
import { ProgramPagePdf } from '../pdf-pages/ProgramPagePdf';
import { ProgramActivity, ProgramData } from '@/app/interfaces/Program.interface';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export interface ProgramDocPdfProps {
  programData: ProgramData;
  activitiesOptions: ConditionalFormattingFiltered[];
}

export const ProgramDocPdf: React.FC<ProgramDocPdfProps> = ({
  programData,
  activitiesOptions,
}) => {
  const activities = programData.program_activities.sort(
    (a: ProgramActivity, b: ProgramActivity) => a.activity_order - b.activity_order
  );

  console.log('programData:', programData);

  const startDatetime = new Date(programData.start_datetime);
  const formattedDate = format(startDatetime, "EEEE, d 'de' MMMM yyyy", { locale: es });
  const startHour = format(startDatetime, 'h:mm aaaa', { locale: es });

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
      }}
    >
      <PDFViewer width="100%" height="100%">
        <Document title={`${programData.program_title} ${formattedDate}`}>
          <ProgramPagePdf
            programData={programData}
            activitiesOptions={activitiesOptions}
          ></ProgramPagePdf>

          {programData.program_activities.map((activity, index) => {
            if (activity.activity_hymn === null) {
              return null;
            }
            return <HymnPagePdf key={index} activityHymn={activity.activity_hymn} />;
          })}
        </Document>
      </PDFViewer>
    </div>
  );
};
