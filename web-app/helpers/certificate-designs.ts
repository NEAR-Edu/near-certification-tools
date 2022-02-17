// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
import { Canvas, registerFont, loadImage } from 'canvas';

export const width = 1080; // width of the image
export const height = 1080; // height of the image
const manropeFontFile = './fonts/Manrope-VariableFont_wght.ttf';
const manropeFontFamily = 'Manrope, Sans Serif';
const monoFontFile = './fonts/DMMono-Medium.ttf';
const monoFontFamily = 'DM Mono, monospace';

registerFont(manropeFontFile, { family: manropeFontFamily });
registerFont(monoFontFile, { family: monoFontFamily });

function getBaseContext(canvas: Canvas) {
  const context = canvas.getContext('2d');
  context.textAlign = 'center';
  context.textBaseline = 'top';
  return context;
}

function addText(canvas: Canvas, text: string, font: string, fillStyle: string, leftPos: number, rightPos: number) {
  const context = getBaseContext(canvas);
  // Define the font style
  context.fillStyle = fillStyle;
  context.font = font;
  context.fillText(text, leftPos, rightPos);
}

/**
 * split long text into shorter lines
 */
function wrapText(canvas: Canvas, text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string, fillStyle: string) {
  const context = getBaseContext(canvas);
  context.textAlign = 'left';
  const words = text.split(' ');
  let line = '';
  let y2 = y;
  const NUMBER_OF_WORDS = 6;
  for (let n = 0; n < words.length; n += 1) {
    const testLine = `${line} ${words[n]}`;
    const metrics = context.measureText(testLine); // Check the width of the text, before writing it on the canvas
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > NUMBER_OF_WORDS) {
      context.fillStyle = fillStyle;
      context.font = font;
      // The x-axis coordinate of the point at which to begin drawing the text, in pixels.
      // The y-axis coordinate of the baseline on which to begin drawing the text, in pixels.
      context.fillText(line, x, y2);
      line = `${words[n]}`;

      y2 += lineHeight;
    } else {
      line = testLine.trim();
    }
  }
  context.fillStyle = fillStyle;
  context.font = font;
  context.fillText(line, x, y2);
}

// eslint-disable-next-line max-lines-per-function
export async function populateCert(canvas: Canvas, details: any) {
  console.log('populateCerts', { details });
  const { tokenId, date, programName, accountName, expiration, programDescription, instructor, programCode } = details;

  const gray = '#757575';
  const black = '#000000';
  const blue = '#5F8AFA';

  const WIDTH_OF_CERTIFICATE = 950;
  const CERTIFICATE_OF_ACHIEVEMENT = 'CERTIFICATE OF ACHIEVEMENT';
  const X_POSITION_OF_DATE = width / 2 + WIDTH_OF_CERTIFICATE / 2.5;
  const X_POSITION_OF_INSTRUCTOR = width / 2 - WIDTH_OF_CERTIFICATE / 3 - 30;
  const X_POSITION_OF_DESCRIPTION = width / 2 - WIDTH_OF_CERTIFICATE / 2;
  const X_POSITION = width / 2;

  const accountFont = `60px '${monoFontFamily}' medium`;
  const dateFont = `30px '${monoFontFamily}' medium`;
  const descriptionFont = `33px '${manropeFontFamily}' regular`;
  const tokenIdFont = `30px '${monoFontFamily}' medium`;
  const programFont = `40px '${monoFontFamily}' medium`;
  const titleFont = `64px '${manropeFontFamily}' extraBold`;

  // Load and draw the background image first
  // Background images must be in SVG format
  const certificateBackgroundNcdImage = './public/certificate-backgrounds/NCD_certificate.svg';
  const certificateBackgroundNcaImage = './public/certificate-backgrounds/NCA_certificate.svg';
  const certificateBackgroundNceImage = './public/certificate-backgrounds/NCE_certificate.svg';
  const certificateBackgroundNciImage = './public/certificate-backgrounds/NCI_certificate.svg';
  const certificateBackgroundNcarImage = './public/certificate-backgrounds/NCAR_certificate.svg';
  const certificateBackgroundNcsImage = './public/certificate-backgrounds/NCS_certificate.svg';
  const certificateBackgroundNcuxImage = './public/certificate-backgrounds/NCUX_certificate.svg';

  let image;

  switch (programCode) {
    case 'TR101': // programCode needs to change in a meaningful way.
      image = await loadImage(certificateBackgroundNcdImage);
      break;
    case 'TR102':
      image = await loadImage(certificateBackgroundNcaImage);
      break;
    case 'TR103':
      image = await loadImage(certificateBackgroundNceImage);
      break;
    case 'TR104':
      image = await loadImage(certificateBackgroundNciImage);
      break;
    case 'TR105':
      image = await loadImage(certificateBackgroundNcarImage);
      break;
    case 'TR106':
      image = await loadImage(certificateBackgroundNcsImage);
      break;
    case 'TR107':
      image = await loadImage(certificateBackgroundNcuxImage);
      break;
    default:
      image = await loadImage(certificateBackgroundNcaImage); // Need to think about what should be the default one
  }

  const context = getBaseContext(canvas);
  context.drawImage(image, 0, 0, width, height);

  addText(canvas, CERTIFICATE_OF_ACHIEVEMENT, titleFont, blue, X_POSITION, 170); //  do we need this or not?
  addText(canvas, accountName, accountFont, black, X_POSITION, 304);
  addText(canvas, programName, programFont, black, X_POSITION, 680);
  wrapText(canvas, programDescription, X_POSITION_OF_DESCRIPTION, 450, WIDTH_OF_CERTIFICATE, 50, descriptionFont, gray);
  wrapText(canvas, instructor, X_POSITION_OF_INSTRUCTOR, 807, WIDTH_OF_CERTIFICATE, 50, dateFont, black);
  addText(canvas, date, dateFont, black, X_POSITION_OF_DATE, 807);
  addText(canvas, expiration, dateFont, black, X_POSITION_OF_DATE, 864);
  addText(canvas, tokenId, tokenIdFont, black, X_POSITION, 995);
}
