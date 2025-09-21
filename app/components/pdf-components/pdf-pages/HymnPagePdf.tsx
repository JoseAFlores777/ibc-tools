'use client';

import { ActivityHymn } from '@/app/interfaces/Program.interface';
import { Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

export interface HymnPagePdfProps {
  activityHymn: ActivityHymn;
}

Font.register({
  family: 'Adamina',
  src: 'https://fonts.gstatic.com/s/adamina/v8/RUQfOodOMiVVYqFZcSlT9w.ttf',
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
    height: 'auto',
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
    marginBottom: 20,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    gap: 2,
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
  biblicalVerse: {
    marginTop: 15,
    paddingHorizontal: 100,
    marginBottom: 15,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  verseText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#c2c2c4',
  },
  verseReference: {
    fontSize: 10,
    marginTop: 10,

    textAlign: 'center',
    color: '#fff',
  },
  activitiesSection: {
    paddingTop: 20,
    paddingBottom: 20,
    fontSize: '9px',
    paddingHorizontal: 40,
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    textAlign: 'center',
    flexWrap: 'wrap',
    alignContent: 'center',
  },
  activityText: {
    marginBottom: 20,
    marginRight: 40,
    lineHeight: 0.2,
    color: '#444',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTextTitle: {
    marginTop: 5,
    marginBottom: 20,
    marginRight: 40,
    lineHeight: 0.2,
    color: '#9e7f19',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityResponsible: {
    marginLeft: 10,
    color: '#9e7f19',
  },
  hymnName: {},
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100px',
    backgroundColor: '#2E4067',
    overflow: 'hidden',
    borderTopColor: '#9e7f19',
    borderTopWidth: 9,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  footerHymnInfo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  footerChurchInfo: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hymnInfoText: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#c2c2c4',
    fontSize: 7,
    gap: 2,
  },
  footerChurchInfoLogo: {
    width: '20%',
    height: 'auto',
    display: 'flex',
    textAlign: 'right',
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 100,
  },
  footerChurchInfoTexts: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    textAlign: 'right',
    marginRight: 10,
  },
  footerChurchInfoTextsTitle: {
    color: '#c2c2c4',
    fontSize: 10,
    marginBottom: 5,
  },
  footerChurchInfoTextsSubTitle: {
    color: '#c2c2c4',
    fontSize: 9,
  },
});

export const HymnPagePdf: React.FC<HymnPagePdfProps> = ({ activityHymn }) => {
  const paragraphs = extractParagraphs(activityHymn.letter_hymn).slice(1);

  const keywords = ['CORO', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  const roleDescriptionsArray = Array.from(
    new Set(
      activityHymn.authors.flatMap((author) => {
        return author.author_roles.map((role) => role.author_roles_id.description);
      })
    )
  );

  console.log('roles', roleDescriptionsArray);

  const authorsTemplate = roleDescriptionsArray.map((roleDescription) => {
    return findAuthorsByRole(roleDescription, activityHymn);
  });

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.gradientOverlay} />
        <View style={styles.ImageOverlay}></View>
        <View style={styles.programHeaderTexts}>
          {activityHymn.hymn_number || activityHymn.hymn_number !=  0 ? (
            <Text style={styles.programDate}>{`Himno # ${activityHymn.hymn_number}`}</Text>
          ) : (
            <Text style={styles.programDate}>{`Himno`}</Text>
          )}

          <Text style={styles.programTitle}>{activityHymn.name}</Text>
          <Text style={styles.programTime}>{activityHymn.hymnal.name}</Text>
          <View style={styles.biblicalVerse}>
            <Text style={styles.verseText}>{activityHymn.bible_text}</Text>
            <Text style={styles.verseReference}>{activityHymn.bible_reference}</Text>
          </View>
        </View>
      </View>

      <View style={styles.activitiesSection}>
        {paragraphs.map((paragraph, index) => {
          if (keywords.includes(paragraph.trim())) {
            return (
              <Text key={index} style={styles.activityTextTitle}>
                {paragraph}
              </Text>
            );
          } else {
            return (
              <Text key={index} style={styles.activityText}>
                {paragraph}
              </Text>
            );
          }
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerHymnInfo}>
          {activityHymn.hymn_time_signature && (
            <Text style={styles.hymnInfoText}>
              {`Compás: ${activityHymn.hymn_time_signature}`}
            </Text>
          )}
          {authorsTemplate}
          {activityHymn.hymnal.publisher && (
            <Text style={styles.hymnInfoText}>
              {activityHymn.hymnal.publisher
                ? `${activityHymn.hymnal.name} , ${activityHymn.hymnal.publisher}`
                : ' '}
            </Text>
          )}
        </View>
        <View style={styles.footerChurchInfo}>
          <View style={styles.footerChurchInfoTexts}>
            <Text style={styles.footerChurchInfoTextsTitle}>DIOS ES FIEL</Text>
            <Text style={styles.footerChurchInfoTextsSubTitle}>Iglesia Bautista El Calvario</Text>
          </View>
          <Image src={'/images/IBC_Logo-min.png'} style={styles.footerChurchInfoLogo} fixed />
        </View>
      </View>
    </Page>
  );
};

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function extractParagraphs(htmlString: string): string[] {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;

  const paragraphs = tempDiv.querySelectorAll('p');
  const textArray: string[] = [];

  paragraphs.forEach((paragraph) => {
    const lines = paragraph.innerHTML.split(/<br\s*\/?>/i);

    lines.forEach((line) => {
      const cleanLine = decodeHtmlEntities(line.replace(/<[^>]+>/g, '').trim());
      if (cleanLine) {
        textArray.push(cleanLine);
      }
    });
  });

  return textArray;
}

function findAuthorsByRole(roleDescription: string, activityHymn: ActivityHymn): React.ReactNode {
  let abbr: string = '';
  const authors = activityHymn.authors
  .filter((author) =>
    author.author_roles.some((role) => role.author_roles_id.description === roleDescription)
)
.map((author) => {
  abbr = author.author_roles.filter((role) => role.author_roles_id.description === roleDescription)[0].author_roles_id.rol_abbr
      return author.authors_id.name;
    })
    .join(', ');

  return (
    <>
      {authors && (
        <Text style={styles.hymnInfoText}>
          {abbr}: {authors ? authors : ' '}
        </Text>
      )}
    </>
  );
}
