'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import { ProgramActivity, ProgramObject } from '../../interfaces/ProgramObject.interface';
import { ConditionalFormattingFiltered } from '@/app/interfaces/FileObject.interface';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  },
);

export interface IbcProgramPdfProps {
  programObject: ProgramObject;
  activitiesOptions: ConditionalFormattingFiltered[];
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 40,
    backgroundColor: '#f7f7f7',
    fontFamily: 'Helvetica',
  },
  header: {
    width: '20%',
    height: 'auto',
    display: 'flex',
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  date: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  sectionHeader: {
    fontSize: 20,
    marginBottom: 15,
    textDecoration: 'none',
    color: '#333',
  },
  section: {
    marginBottom: 10,
    fontSize: 14,
    paddingLeft: 10,
    paddingRight: 10,
  },
  activityText: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 1.5,
    color: '#444',
  },
  footer: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  }
});

export const IbcProgramPdf: React.FC<IbcProgramPdfProps> = ({ 
  programObject,
  activitiesOptions
}) => {

  const activities = programObject.program_activities.sort(
    (a: ProgramActivity, b: ProgramActivity) =>
      a.activity_order - b.activity_order
  );

  const startDatetime = new Date(programObject.start_datetime);

  const formattedDate = format(startDatetime, "dd 'de' MMMM yyyy", {
    locale: es
  });

  const startHour = format(startDatetime, "HH:mm a", {
    locale: es
  });

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' }}>
      <PDFViewer width="100%" height="100%">
        <Document title={`${programObject.program_title} ${formattedDate}`} >
          <Page size="A4" style={styles.page}>
            <Image src={'/IBC_Logo-min.png'} style={styles.header} fixed></Image>
            <Text style={styles.date}>{programObject.program_title}</Text>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Fecha</Text>
              <Text style={styles.activityText}>{formattedDate}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Horario</Text>
              <Text style={styles.activityText}>{startHour}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Programa</Text>
              {activities.map((activity, index) => {
                const filteredOptions = activitiesOptions.filter(item => item.id === activity.activities);
                const optionsString = filteredOptions.map(option => option.text).join(', ');
                return (
                  <Text key={index} style={styles.activityText}>
                    {activity.activity_order} -   
                {' '} {/* Añade un espacio aquí */}
                    {!activity.activity_hymn && (
                      <Text style={{ fontWeight: 'bold' }}>
                        {optionsString}
                      </Text>
                    )}
                
                    {activity.activity_hymn && (
                      <>
                        Himno #{activity.activity_hymn.hymn_number}
                        {' '} {/* Añade un espacio aquí */}
                        <Text style={{ fontWeight: 'normal' }}>
                          "{activity.activity_hymn.name}"
                        </Text>
                      </>
                    )}
                
                    {' '} {/* Añade un espacio aquí */}
                    <Text style={{ fontSize: 10, color: '#999' }}>
                      ({activity.activity_responsible.alias})
                    </Text>
                  </Text>
                );
                
              })}
            </View>
          </Page>
        </Document>
      </PDFViewer>
    </div>
  );
};
