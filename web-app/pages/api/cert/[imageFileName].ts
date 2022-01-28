// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Canvas,
  // registerFont,
  createCanvas,
  loadImage,
} from 'canvas';
import { getSimpleStringFromParam } from '../../../helpers/strings';

// TODO: Update this section:
const certificateBackgroundImage = './public/background.png';
// const fontFile = './fonts/Sign-Painter-Regular.ttf';
const fontFamily = 'signpainter';
const svg = 'svg';
const dot = '.';
const imagePng = 'image/png';

// TODO registerFont(fontFile, { family: fontFamily });

type CanvasTypeDef = 'pdf' | 'svg' | undefined;
type BufferTypeDef = 'image/png' | undefined;

function parseFileName(imageFileNameString: string) {
  const extension = imageFileNameString.split(dot).pop(); // https://stackoverflow.com/a/1203361/470749
  const contentType = extension === svg ? 'image/svg+xml' : imagePng;
  const bufferType: BufferTypeDef = extension === svg ? undefined : imagePng;
  const canvasType: CanvasTypeDef = extension === svg ? svg : undefined;
  const lastIndex = imageFileNameString.lastIndexOf(`${dot}${extension}`); // https://stackoverflow.com/a/9323226/470749
  const hash = imageFileNameString.substring(0, lastIndex);
  return { extension, bufferType, contentType, canvasType, hash };
}

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

async function generateImage(canvasType: CanvasTypeDef, bufferType: BufferTypeDef, details: any) {
  // TODO: Change the design and content of this image.

  // Define the canvas
  const width = 1160; // width of the image
  const height = 653; // height of the image
  const canvas = createCanvas(width, height, canvasType);

  const { hash, date, programName, accountName, competencies } = details;

  const fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // https://css-tricks.com/snippets/javascript/random-hex-color/
  const font = `40px '${fontFamily}' bold`;

  // Load and draw the background image first
  const image = await loadImage(certificateBackgroundImage);

  // Draw the background
  const context = getBaseContext(canvas);
  context.drawImage(image, 0, 0, width, height);

  // Draw the text
  addText(canvas, hash, font, fillStyle, width * 0.5, height * 0.9);
  addText(canvas, date, font, fillStyle, width * 0.2, height * 0.8);
  addText(canvas, programName, font, fillStyle, width * 0.05, height * 0.4);
  addText(canvas, accountName, font, fillStyle, width * 0.5, height * 0.3);
  addText(canvas, competencies, font, fillStyle, width * 0.5, height * 0.4);

  // Convert the Canvas to a buffer
  const buffer = bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
  return buffer;
}

async function fetchCertificateDetails(hash: string) {
  // TODO: Using this hash, fetch other text (mainnet address, date, program name, and competencies from NFT metadata) that will be added to the certificate image, and
  return {
    hash,
    date: '2022-01-13',
    programName: 'NEAR Certified Developer',
    accountName: 'ryancwalsh.near',
    competencies:
      'has successfully completed the NEAR Certified Developer program and demonstrated proficiency in reading and writing smart contracts to build the Open Web with NEAR',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Buffer>) {
  // Grab payload from query.
  const { imageFileName } = req.query;

  const imageFileNameString = getSimpleStringFromParam(imageFileName);
  const { bufferType, contentType, canvasType, hash } = parseFileName(imageFileNameString);
  const details = await fetchCertificateDetails(hash);

  // provide each piece of text to generateImage.
  const imageBuffer = await generateImage(canvasType, bufferType, details);
  res.setHeader('Content-Type', contentType);
  // TODO: cache
  res.send(imageBuffer);
}
