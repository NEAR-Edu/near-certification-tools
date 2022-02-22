// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
import { Canvas, registerFont, loadImage } from 'canvas';

export const width = 1080; // width of the image
export const height = 1080; // height of the image
const manropeFontFile = './fonts/Manrope-VariableFont_wght.ttf';
const manropeFontFamily = 'Manrope, Sans Serif';
const monoFontFile = './fonts/DMMono-Medium.ttf';
const monoFontFamily = 'DM Mono, monospace';

const gray = '#757575';
const black = '#000000';
const blue = '#5F8AFA';

const CERTIFICATE_OF_ACHIEVEMENT = 'CERTIFICATE OF ACHIEVEMENT';
const BODY_WIDTH = 950;
const LEFT_PADDING = 65;
const X_POSITION_OF_INSTRUCTOR = 200; // TODO: https://www.figma.com/file/sTYSqGHiCoH0p82uh1TsTs/NC-Certs?node-id=0%3A1 does not have the actual measurements needed for left-align. Get from Dan.
const X_POSITION_OF_DATE = LEFT_PADDING + BODY_WIDTH - 180; // TODO: Either figure out how to use textAlign: 'right' and use 65 for the X, or get from Dan the correct X value to use for left-align since https://www.figma.com/file/sTYSqGHiCoH0p82uh1TsTs/NC-Certs?node-id=0%3A1 does not have the actual measurements needed for left-align and is fudged here.
const X_POSITION_OF_DESCRIPTION = LEFT_PADDING;
const X_CENTER = width / 2;

const accountFont = `60px '${monoFontFamily}' medium`;
const dateFont = `30px '${monoFontFamily}' medium`;
const descriptionFont = `33px '${manropeFontFamily}' regular`;
const tokenIdFont = `30px '${monoFontFamily}' medium`;
const programFont = `40px '${monoFontFamily}' medium`;
const titleFont = `64px '${manropeFontFamily}' extraBold`;

registerFont(manropeFontFile, { family: manropeFontFamily });
registerFont(monoFontFile, { family: monoFontFamily });

function getBaseContext(canvas: Canvas) {
  const context = canvas.getContext('2d');
  context.textBaseline = 'top';
  return context;
}

function addText(canvas: Canvas, text: string, font: string, fillStyle: string, xPos: number, yPos: number, textAlign: CanvasTextAlign) {
  const context = getBaseContext(canvas);
  // Define the font style
  context.fillStyle = fillStyle;
  context.font = font;
  context.textAlign = textAlign;
  context.fillText(text, xPos, yPos); // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
}

/**
 * Split long text into shorter lines.
 * // TODO: This looks for 6 words, which have unpredictable length, so instead we should replace with a better function. https://github.com/NEAR-Edu/near-certification-tools/issues/22
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

export async function populateCert(canvas: Canvas, details: any) {
  console.log('populateCert', { details });
  const { tokenId, date, programName, accountName, expiration, programDescription, instructor, programCode } = details;

  // Load and draw the background image first
  const certificateBackgroundImage = `./public/certificate-backgrounds/${programCode}_certificate.svg`; // Background images must be in SVG format

  const image = await loadImage(certificateBackgroundImage);

  const context = getBaseContext(canvas);
  context.drawImage(image, 0, 0, width, height);

  addText(canvas, CERTIFICATE_OF_ACHIEVEMENT, titleFont, blue, X_CENTER, 170, 'center');
  addText(canvas, accountName, accountFont, black, X_CENTER, 304, 'center'); // TODO: https://github.com/NEAR-Edu/near-certification-tools/issues/14
  wrapText(canvas, programDescription, X_POSITION_OF_DESCRIPTION, 450, BODY_WIDTH, 50, descriptionFont, gray);
  addText(canvas, programName, programFont, black, X_CENTER, 680, 'center');
  addText(canvas, instructor, dateFont, black, X_POSITION_OF_INSTRUCTOR, 807, 'left'); // TODO: https://github.com/NEAR-Edu/near-certification-tools/issues/14
  addText(canvas, date, dateFont, black, X_POSITION_OF_DATE, 807, 'left');
  addText(canvas, expiration, dateFont, black, X_POSITION_OF_DATE, 864, 'left');
  addText(canvas, tokenId, tokenIdFont, black, X_CENTER, 995, 'center');
}
