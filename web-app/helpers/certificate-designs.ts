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
const X_POSITION_OF_INSTRUCTOR = 200; // https://www.figma.com/file/sTYSqGHiCoH0p82uh1TsTs/NC-Certs?node-id=0%3A1 does not have the actual measurements needed for left-align, so this is just a guess, but it's possibly good enough.
const X_POSITION_OF_DATE = LEFT_PADDING + BODY_WIDTH;
const X_POSITION_OF_DESCRIPTION = LEFT_PADDING;
const X_CENTER = width / 2;

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

function addText(context: CanvasRenderingContext2D, text: string, font: string, fillStyle: string, xPos: number, yPos: number, textAlign: CanvasTextAlign) {
  // Define the font style
  context.fillStyle = fillStyle;
  context.font = font;
  context.textAlign = textAlign;
  context.fillText(text, xPos, yPos); // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
}

/**
 * Adds text (via addText) but also iteratively decreases the fontSize until the whole string fits the context.
 */
function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fillStyle: string,
  x: number,
  y: number,
  textWidth: number,
  textAlign: CanvasTextAlign,
  fontWeight = 'medium',
) {
  let font;
  let currentFontSize = fontSize;
  let currentY = y;

  // Decrease the font size until the text fits the context.
  do {
    currentY += 1;
    font = `${currentFontSize}px '${monoFontFamily}' ${fontWeight}`;
    context.font = font; // The font needs to be applied to the context here so that context.measureText can work.
    console.log({ font });
    console.log(context.measureText(text).width);
    currentFontSize -= 1;
  } while (context.measureText(text).width > textWidth);

  addText(context, text, font, fillStyle, x, currentY, textAlign);
}

/**
 * Split long text into shorter lines.
 * Dynamic Width (Build Regex) https://stackoverflow.com/a/51506718
 * maxChars is the max number of characters per line
 */
function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxChars: number, font: string, fillStyle: string) {
  const replacedText = text.replace(new RegExp(`(?![^\\n]{1,${maxChars}}$)([^\\n]{1,${maxChars}})\\s`, 'g'), '$1\n');
  addText(context, replacedText, font, fillStyle, x, y, 'left');
}

export async function populateCert(canvas: Canvas, details: any) {
  console.log('populateCert', { details });
  const { tokenId, date, programName, accountName, programDescription, instructor, programCode } = details;

  // Load and draw the background image first
  const certificateBackgroundImage = `./public/certificate-backgrounds/${programCode}_certificate.svg`; // Background images must be in SVG format

  const image = await loadImage(certificateBackgroundImage);

  const context = getBaseContext(canvas);
  context.drawImage(image, 0, 0, width, height);

  addText(context, CERTIFICATE_OF_ACHIEVEMENT, titleFont, blue, X_CENTER, 170, 'center');
  fitText(context, accountName, 60, black, X_CENTER, 304, BODY_WIDTH, 'center');
  wrapText(context, programDescription, X_POSITION_OF_DESCRIPTION, 450, 60, descriptionFont, gray);
  addText(context, programName, programFont, black, X_CENTER, 680, 'center');
  fitText(context, instructor, 30, black, X_POSITION_OF_INSTRUCTOR, 807, 550, 'left');
  addText(context, date, dateFont, black, X_POSITION_OF_DATE, 807, 'right');
  addText(context, tokenId, tokenIdFont, black, X_CENTER, 995, 'center');
}
