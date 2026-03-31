import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import '@/app/components/pdf-components/shared/pdf-fonts';

/**
 * Presentación de himnos: cada estrofa y coro es una diapositiva (página landscape).
 * Intercala el coro después de cada estrofa.
 *
 * Estructura por himno:
 *   1. Portada (título del himno)
 *   2. Estrofa I
 *   3. Coro
 *   4. Estrofa II
 *   5. Coro
 *   6. Estrofa III
 *   7. Coro
 *   ... etc.
 */

const styles = StyleSheet.create({
  coverPage: {
    backgroundColor: '#393572',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverNumber: {
    fontSize: 24,
    color: '#eaba1c',
    fontFamily: 'Adamina',
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 40,
    color: '#ffffff',
    fontFamily: 'Adamina',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 1,
  },
  coverHymnal: {
    fontSize: 14,
    color: '#c2c2c4',
    fontFamily: 'Adamina',
    marginTop: 16,
  },
  slidePage: {
    backgroundColor: '#393572',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    paddingHorizontal: 80,
  },
  slideMarker: {
    fontSize: 16,
    color: '#eaba1c',
    fontFamily: 'Adamina',
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 2,
  },
  slideLine: {
    fontSize: 28,
    color: '#ffffff',
    fontFamily: 'Adamina',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  // Portada general (primera slide del documento)
  mainCoverPage: {
    backgroundColor: '#393572',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  mainCoverTitle: {
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Adamina',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 2,
  },
  mainCoverSubtitle: {
    fontSize: 18,
    color: '#eaba1c',
    fontFamily: 'Adamina',
    marginTop: 20,
  },
});

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

/**
 * Extrae las secciones de un himno parseado y genera las slides con coro intercalado.
 * Retorna un array de slides, cada una con un marker (título) y líneas de texto.
 */
function buildSlides(verses: ParsedVerse[]): Array<{ marker: string; lines: string[] }> {
  // Separar versos numéricos y coro
  const sections: Array<{ marker: string; lines: string[] }> = [];
  let chorusLines: string[] | null = null;
  let chorusMarker = 'CORO';
  let currentMarker = '';
  let currentLines: string[] = [];
  let isCollectingChorus = false;

  for (const verse of verses) {
    if (verse.type === 'title') {
      // Si teníamos algo acumulado, guardarlo
      if (currentLines.length > 0) {
        if (isCollectingChorus) {
          chorusLines = currentLines;
          chorusMarker = currentMarker;
        } else {
          sections.push({ marker: currentMarker, lines: currentLines });
        }
      }
      currentMarker = verse.lines.map((l) => l.text).join(' ');
      currentLines = [];
      const upper = currentMarker.trim().toUpperCase();
      isCollectingChorus = upper === 'CORO' || upper === 'CHORUS';
    } else {
      currentLines.push(...verse.lines.map((l) => l.text));
    }
  }

  // Guardar la última sección
  if (currentLines.length > 0) {
    if (isCollectingChorus) {
      chorusLines = currentLines;
      chorusMarker = currentMarker;
    } else {
      sections.push({ marker: currentMarker, lines: currentLines });
    }
  }

  // Intercalar coro después de cada estrofa
  const slides: Array<{ marker: string; lines: string[] }> = [];
  for (const section of sections) {
    slides.push(section);
    if (chorusLines) {
      slides.push({ marker: chorusMarker, lines: chorusLines });
    }
  }

  return slides;
}

export interface HymnPresentationProps {
  hymns: ParsedHymn[];
  title?: string;
}

export function HymnPresentation({ hymns, title }: HymnPresentationProps) {
  return (
    <Document title={title || 'Presentación de Himnos'}>
      {/* Portada general */}
      <Page size="LETTER" orientation="landscape" style={styles.mainCoverPage}>
        <Text style={styles.mainCoverTitle}>
          {title || 'Himnos'}
        </Text>
        <Text style={styles.mainCoverSubtitle}>
          {hymns.length} himno{hymns.length !== 1 ? 's' : ''}
        </Text>
      </Page>

      {hymns.map((ph) => {
        const slides = buildSlides(ph.verses);

        return (
          <React.Fragment key={ph.hymn.id}>
            {/* Portada del himno */}
            <Page size="LETTER" orientation="landscape" style={styles.coverPage}>
              {ph.hymn.hymn_number != null && (
                <Text style={styles.coverNumber}>
                  Himno # {ph.hymn.hymn_number}
                </Text>
              )}
              <Text style={styles.coverTitle}>{ph.hymn.name}</Text>
              {ph.hymn.hymnal?.name && (
                <Text style={styles.coverHymnal}>{ph.hymn.hymnal.name}</Text>
              )}
            </Page>

            {/* Una slide por estrofa/coro */}
            {slides.map((slide, idx) => (
              <Page key={idx} size="LETTER" orientation="landscape" style={styles.slidePage}>
                <Text style={styles.slideMarker}>{slide.marker}</Text>
                <View>
                  {slide.lines.map((line, li) => (
                    <Text key={li} style={styles.slideLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              </Page>
            ))}
          </React.Fragment>
        );
      })}
    </Document>
  );
}
