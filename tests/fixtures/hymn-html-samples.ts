/**
 * Sample HTML strings mimicking Directus TinyMCE output for letter_hymn field.
 * Used by html-to-pdf.test.ts to verify parser behavior.
 */

/** Standard hymn with chorus and two verses */
export const standardHymnHtml = `<p>CORO</p>
<p>Alabemos al Se&ntilde;or<br>Con todo el coraz&oacute;n<br>Que su nombre sea exaltado</p>
<p>I</p>
<p>Primera estrofa l&iacute;nea uno<br>Primera estrofa l&iacute;nea dos<br>Primera estrofa l&iacute;nea tres</p>
<p>II</p>
<p>Segunda estrofa l&iacute;nea uno<br>Segunda estrofa l&iacute;nea dos</p>`;

/** Hymn with bold and italic formatting */
export const formattedHymnHtml = `<p>CORO</p>
<p><strong>Texto en negrita</strong><br><em>Texto en cursiva</em><br>Texto normal</p>
<p>I</p>
<p>Verso con <b>negrita inline</b> y <i>cursiva inline</i></p>`;

/** Hymn with only one verse and no chorus marker */
export const minimalHymnHtml = `<p>Solo un verso sencillo<br>Segunda l&iacute;nea del verso</p>`;

/** Empty/null edge case */
export const emptyHymnHtml = '';

/** Hymn with HTML entities */
export const entityHymnHtml = `<p>CORO</p>
<p>&iquest;D&oacute;nde est&aacute; tu fe?<br>&iexcl;Alabad al Se&ntilde;or!</p>`;
