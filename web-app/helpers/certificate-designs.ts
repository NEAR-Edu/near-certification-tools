// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
import {
  Canvas,
  // registerFont,
  loadImage,
} from 'canvas';

// TODO: Update this section:
export const width = 1160; // width of the image
export const height = 653; // height of the image
// const fontFile = './fonts/Sign-Painter-Regular.ttf';
const fontFamily = 'signpainter';

// TODO registerFont(fontFile, { family: fontFamily });

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

export async function populateDeveloperCert(canvas: Canvas, details: any) {
  // TODO
  console.log('populateDeveloperCert', { details });
  const { tokenId, date, programName, accountName, expiration } = details;

  const fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // This is just temporary and will be removed once we have final designs for each program's certificate. https://css-tricks.com/snippets/javascript/random-hex-color/
  const font = `40px '${fontFamily}' bold`;

  // Load and draw the background image first
  const certificateBackgroundSvgImage = './public/certificate-backgrounds/NCD_background.svg'; // Background images must be in SVG format
  const image = await loadImage(certificateBackgroundSvgImage);
  console.log({ image });
  const context = getBaseContext(canvas);
  context.drawImage(image, 0, 0, width, height);

  addText(canvas, tokenId, font, fillStyle, width * 0.5, height * 0.9);
  addText(canvas, date, font, fillStyle, width * 0.2, height * 0.8);
  addText(canvas, programName, font, fillStyle, width * 0.05, height * 0.4);
  addText(canvas, accountName, font, fillStyle, width * 0.5, height * 0.3);
  addText(canvas, expiration, font, fillStyle, width * 0.5, height * 0.4);
}

export async function populateAnalystCert(canvas: Canvas, details: any) {
  // TODO
  console.log({ canvas, details });
}
