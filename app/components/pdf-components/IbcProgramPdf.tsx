'use client';

import { ConditionalFormattingFiltered } from '@/app/interfaces/FileObject.interface';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import dynamic from 'next/dynamic';
import React from 'react';
import { ProgramActivity, ProgramObject } from '../../interfaces/ProgramObject.interface';
import { IbcHymnPdf } from './IbcHymnPdf';

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

Font.register({
  family: 'Adamina',
  src: 'http://fonts.gstatic.com/s/adamina/v8/RUQfOodOMiVVYqFZcSlT9w.ttf'
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#f7f7f7',
    fontFamily: 'Adamina',
  },
  header: {
    position: 'relative',
    width: '100%',
    height: '120px',
    backgroundColor: '#393572',
    overflow: 'hidden',
    borderBottomColor: '#9e7f19',
    borderBottomWidth: 7,
  },
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(53, 73, 115, 0.85)',
    zIndex: 1,
  },
  ImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    zIndex: 2,
  },
  programHeaderTexts: {
    top: 20,
    marginRight: 20,
    textAlign: 'right',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    color: '#fff',
  },
  programTitle: {
    fontSize: 24,
    textTransform: 'uppercase',
  },
  programDate: {
    fontSize: 15,
    marginTop: 5,
    color: '#eaba1c',
  },
  programTime: {
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    padding: 40,
  },
  logo: {
    width: '20%',
    height: 'auto',
    position: 'absolute',
    top: 50,
    left: 20,
    textAlign: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 100,
  },
  title: {
    fontSize: 25,
    textAlign: 'center',
    marginBottom: 20,
    color: '#9e7f19',
    textTransform: 'uppercase',
  },
  biblicalVerse: {
    paddingHorizontal: 100,
    marginBottom: 20,
  },
  verseText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#7f7f7f',
    
    
  },
  verseReference: {
    fontSize: 10,
    marginTop: 10,
    textAlign: 'right',
    color: '#494949',
  },
  activitiesSection: {
    marginBottom: 10,
    marginTop: 20,
    fontSize: 11,
    
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    
    
  },
  activityText: {
    marginBottom: 20,
    marginRight: 20,
    lineHeight: 1.5,
    color: '#444',
    alignSelf: 'flex-start',
  },
  activityResponsible: {
    marginLeft: 10,
    color: '#9e7f19',
  },
  hymnName: {
    
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100px',
    backgroundColor: '#2E4067',
    overflow: 'hidden',
    borderTopColor: '#9e7f19',
    borderTopWidth: 9,
  },
  footerTitle: {
    justifyContent: 'center',
    alignItems: 'center',
    top: 30,
    textAlign: 'center',
    color: '#c2c2c4',
    fontSize: 10,
    marginBottom: 5,
  },
  footerSubTitle: {
    justifyContent: 'center',
    alignItems: 'center',
    top: 30,
    textAlign: 'center',
    color: '#c2c2c4',
    fontSize: 9,
  },
});

export const IbcProgramPdf: React.FC<IbcProgramPdfProps> = ({
  programObject,
  activitiesOptions,
}) => {
  const activities = programObject.program_activities.sort(
    (a: ProgramActivity, b: ProgramActivity) => a.activity_order - b.activity_order
  );

  const startDatetime = new Date(programObject.start_datetime);
  const formattedDate = format(startDatetime, "EEEE, d 'de' MMMM yyyy", { locale: es });
  const startHour = format(startDatetime, "h:mm aaaa", { locale: es });

  const verse = '"no sirviendo al ojo, como los que quieren agradar a los hombres, sino como siervos de Cristo, de corazón haciendo la voluntad de Dios..."';
  const verseReference = 'Efesios 6:6';

  

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' }}>
      <PDFViewer width="100%" height="100%">
        <Document title={`${programObject.program_title} ${formattedDate}`}>
          <Page size="LETTER" style={styles.page} >
            <View style={styles.header}>
              <View style={styles.gradientOverlay} />
              <View style={styles.ImageOverlay}>
              <Image src={'/altar.jpg'} style={styles.headerImage} />
              </View>
                <View style={styles.programHeaderTexts}>
                  <Text style={styles.programTitle}>{programObject.program_title}</Text>
                  <Text style={styles.programDate}>{formattedDate}</Text>
                  <Text style={styles.programTime}>{startHour}</Text>
                </View>
            </View>
            <Image src={'/IBC_Logo-min.png'} style={styles.logo} fixed />
            <View style={styles.content}>
              <Text style={styles.title}>Programa</Text>
              <View style={styles.biblicalVerse}>
                <Text style={styles.verseText}>{programObject.bible_text}</Text>
                <Text style={styles.verseReference}>{programObject.bible_reference}</Text>
              </View>
              <View style={styles.activitiesSection}>
                {activities.map((activity, index) => {
                  const filteredOptions = activitiesOptions.filter(item => item.id === activity.activities);
                  const optionsString = filteredOptions.map(option => option.text).join(', ');
                  return (
                    <Text key={index} style={styles.activityText}>
                      {activity.activity_order} -{' '}
                      {!activity.activity_hymn && (
                        <Text style={{ fontWeight: 'bold' }}>{optionsString}</Text>
                      )}
                      {activity.activity_hymn && (
                        <>
                         
                          <Text style={styles.hymnName} >
                          Himno # {activity.activity_hymn.hymn_number}{' '}
                            {activity.activity_hymn.name}</Text>
                        </>
                      )}
                      {' '}
                      <Text style={styles.activityResponsible}>
                        {`( ${activity.activity_responsible.alias} )`}
                      </Text>
                    </Text>
                  );
                })}
              </View>
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerTitle}>
                DIOS ES FIEL
              </Text>
              <Text style={styles.footerSubTitle}>
                Iglesia Bautista El Calvario
              </Text>
</View>
          </Page>


          {programObject.program_activities.map((activity, index) => {
            if (activity.activity_hymn === null) {
              return null;
            }
            return (
              <IbcHymnPdf key={index} activityHymn={activity.activity_hymn} />
            )
          })}



        </Document>
      </PDFViewer>
    </div>
  );
};
