"use client";

import { ConditionalFormattingFiltered } from "@/app/interfaces/FileObject.interface";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import dynamic from "next/dynamic";
import React from "react";
import {
  ActivityHymn,
  ProgramActivity,
  ProgramObject,
} from "../../interfaces/ProgramObject.interface";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  }
);

export interface IbcHymnPdfProps {
  activityHymn: ActivityHymn;
}

Font.register({
  family: "Adamina",
  src: "http://fonts.gstatic.com/s/adamina/v8/RUQfOodOMiVVYqFZcSlT9w.ttf",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#f7f7f7",
    fontFamily: "Adamina",
  },
  header: {
    position: "relative",
    width: "100%",
    height: "auto",
    backgroundColor: "#393572",
    overflow: "hidden",
    borderBottomColor: "#9e7f19",
    borderBottomWidth: 7,
  },
  headerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(53, 73, 115, 0.85)",
    zIndex: 1,
  },
  ImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    zIndex: 2,
  },
  programHeaderTexts: {
    top: 20,
    marginRight: 20,
    marginBottom: 20,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    gap: 2,
  },
  programTitle: {
    fontSize: 24,
    textTransform: "uppercase",
  },
  programDate: {
    fontSize: 15,
    marginTop: 5,
    color: "#eaba1c",
  },
  programTime: {
    fontSize: 11,
    marginTop: 2,
  },
  biblicalVerse: {
    marginTop: 15,
    paddingHorizontal: 100,
    marginBottom: 15,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  verseText: {
    fontSize: 10,
    textAlign: "center",
    color: "#c2c2c4",
  },
  verseReference: {
    fontSize: 10,
    marginTop: 10,
    
    textAlign: "center",
    color: "#fff",
  },
  activitiesSection: {
    paddingTop: 20,
    paddingBottom: 20,
    fontSize: "9px",
    paddingHorizontal: 40,
    height: "500px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    textAlign: "center",
    flexWrap: "wrap",
    alignContent: "center",
  },
  activityText: {
    marginBottom: 20,
    marginRight: 40,
    lineHeight: 0.2,
    color: "#444",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  activityTextTitle: {
    marginBottom: 20,
    marginRight: 40,
    lineHeight: 0.2,
    color: "#9e7f19",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  activityResponsible: {
    marginLeft: 10,
    color: "#9e7f19",
  },
  hymnName: {},
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "100px",
    backgroundColor: "#2E4067",
    overflow: "hidden",
    borderTopColor: "#9e7f19",
    borderTopWidth: 9,
  },
  logo: {
    width: "3%",
    height: "auto",
    display: "flex",
    textAlign: "center",
    backgroundColor: "#fff",
    padding: 2,
    borderRadius: 100,
    marginBottom: 7,
    top: 15,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  footerTitle: {
    justifyContent: "center",
    alignItems: "center",
    top: 15,
    textAlign: "center",
    color: "#c2c2c4",
    fontSize: 10,
    marginBottom: 5,
  },
  footerSubTitle: {
    justifyContent: "center",
    alignItems: "center",
    top: 15,
    textAlign: "center",
    color: "#c2c2c4",
    fontSize: 9,
  },
});

export const IbcHymnPdf: React.FC<IbcHymnPdfProps> = ({ activityHymn }) => {
  const verse =
    '"no sirviendo al ojo, como los que quieren agradar a los hombres, sino como siervos de Cristo, de corazón haciendo la voluntad de Dios..."';
  const verseReference = "Efesios 6:6";

  const paragraphs = extractParagraphs(activityHymn.letter_hymn).slice(1);

  const keywords = ["CORO", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.gradientOverlay} />
        <View style={styles.ImageOverlay}>
        </View>
        <View style={styles.programHeaderTexts}>
          <Text style={styles.programDate}>{`Himno # ${activityHymn.hymn_number}`}</Text>
          <Text style={styles.programTitle}>{activityHymn.name}</Text>
          <Text style={styles.programTime}>{"Himnos Majestuosos"}</Text>
          <View style={styles.biblicalVerse}>
          <Text style={styles.verseText}>{activityHymn.bible_text}</Text>
          <Text style={styles.verseReference}>{activityHymn.bible_reference}</Text>
        </View>
        </View>
      </View>


      <View style={styles.activitiesSection}>

        {paragraphs.map((paragraph, index) => {
          if (keywords.includes(paragraph.trim())) { 
            return <Text key={index} style={styles.activityTextTitle}>{paragraph}</Text>
          } else {
            return <Text key={index} style={styles.activityText}>{paragraph}</Text>
          }
        })}

      </View>

      <View style={styles.footer}>
      <Image src={"/IBC_Logo-min.png"} style={styles.logo} fixed />
        <Text style={styles.footerTitle}>DIOS ES FIEL</Text>
        <Text style={styles.footerSubTitle}>Iglesia Bautista El Calvario</Text>
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
  const textArray:string[] = [];

  paragraphs.forEach(paragraph => {
      const lines = paragraph.innerHTML.split(/<br\s*\/?>/i);
      
      lines.forEach(line => {
          const cleanLine = decodeHtmlEntities(line.replace(/<[^>]+>/g, '').trim());
          if (cleanLine) {
              textArray.push(cleanLine);
          }
      });
  });

  return textArray;
}
