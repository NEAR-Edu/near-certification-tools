// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
import { Canvas, registerFont, loadImage } from 'canvas';

// TODO: Update this section:
export const width = 1080; // width of the image
export const height = 1080; // height of the image
const fontFile = './fonts/Manrope-VariableFont_wght.ttf';
const fontFamily = 'manrope';

registerFont(fontFile, { family: fontFamily });

function getBaseContext(canvas: Canvas) {
  const context = canvas.getContext('2d');
  context.textAlign = 'left';
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

// eslint-disable-next-line max-lines-per-function
export async function populateDeveloperCert(canvas: Canvas, details: any) {
  // TODO
  console.log('populateDeveloperCert', { details });
  const { tokenId, date, programName, accountName, expiration, programDescription, instructor, programCode } = details;

  const programDescription1 = programDescription.split(',')[0];
  const programDescription2 = programDescription.split(',')[1];

  const gray = '#757575';
  const black = '#000000';
  const accountFont = `60px '${fontFamily}' bold`;
  const dateFont = `33px '${fontFamily}' regular`;
  const tokenIdFont = `30px '${fontFamily}' medium`;
  const programFont = `48px '${fontFamily}' bold`;

  // Load and draw the background image first
  // Background images must be in SVG format
  const certificateBackgroundNcdImage = './public/certificate-backgrounds/NCD_certificate.svg';
  const certificateBackgroundNcaImage = './public/certificate-backgrounds/NCD_background.svg';

  let image;

  switch (programCode) {
    case 'TR101': // programCode needs to change in a meaningfull way.
      image = await loadImage(certificateBackgroundNcdImage);
      console.log({ image });
      break;
    case 'TR102':
      image = await loadImage(certificateBackgroundNcaImage);
      console.log({ image });
      break;
    default:
      image = await loadImage(certificateBackgroundNcaImage); // Need to think about what should be the default one
      console.log({ image });
  }
  const context = getBaseContext(canvas);
  context.drawImage(image, 0, 0, width, height);

  addText(canvas, accountName, accountFont, black, 302, 304);
  addText(canvas, programName, programFont, black, 240, 670);
  addText(canvas, programDescription1, dateFont, gray, 65, 450);
  addText(canvas, programDescription2, dateFont, gray, 65, 500);
  addText(canvas, instructor, dateFont, black, 200, 800);
  addText(canvas, date, dateFont, black, 830, 803);
  addText(canvas, expiration, dateFont, black, 830, 860);
  addText(canvas, tokenId, tokenIdFont, black, 250, 995);
}
