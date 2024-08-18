'use client';

import { Document } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import React from 'react';
import { ActivityHymn } from '../../../interfaces/ProgramObject.interface';

import { HymnPagePdf } from '../pdf-pages/HymnPagePdf';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export interface HymnDocPdfProps {
  activityHymn: ActivityHymn;
}

export const HymnDocPdf: React.FC<HymnDocPdfProps> = ({
  activityHymn
}) => {

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
        <Document title={`${activityHymn.hymn_number} - ${activityHymn.name}`}>
          <HymnPagePdf activityHymn={activityHymn} />
        </Document>
      </PDFViewer>
    </div>
  );
};
