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
import { getNftContract, NFT } from '../mint-cert';
import { getNearAccountWithoutAccountIdOrKeyStoreForBackend } from '../../../helpers/near';

const HTTP_ERROR_CODE_MISSING = 404;

// TODO: Update this section:
const ncdCertificateBackgroundSvgImage = './public/certificate-backgrounds/NCD_background.svg'; // Background images must be in SVG format
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
  const tokenId = imageFileNameString.substring(0, lastIndex);
  return { extension, bufferType, contentType, canvasType, tokenId };
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

function getBackgroundSvgImageFromProgramCode(programCode: string) {
  console.log({ programCode });
  return ncdCertificateBackgroundSvgImage; // TODO: Switch which file is returned based on programCode.
}

async function generateImage(canvasType: CanvasTypeDef, bufferType: BufferTypeDef, details: any) {
  const { programCode } = details;
  // TODO: Change the design and content of this image based on programCode.

  // Define the canvas
  const width = 1160; // width of the image
  const height = 653; // height of the image
  const canvas = createCanvas(width, height, canvasType);

  const { tokenId, date, programName, accountName, competencies } = details;

  const fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // This is just temporary and will be removed once we have final designs for each program's certificate. https://css-tricks.com/snippets/javascript/random-hex-color/
  const font = `40px '${fontFamily}' bold`;

  // Load and draw the background image first
  const certificateBackgroundSvgImage = getBackgroundSvgImageFromProgramCode(programCode);
  const image = await loadImage(certificateBackgroundSvgImage);

  // Draw the background
  const context = getBaseContext(canvas);
  context.drawImage(image, 0, 0, width, height);

  // Draw the text
  addText(canvas, tokenId, font, fillStyle, width * 0.5, height * 0.9);
  addText(canvas, date, font, fillStyle, width * 0.2, height * 0.8);
  addText(canvas, programName, font, fillStyle, width * 0.05, height * 0.4);
  addText(canvas, accountName, font, fillStyle, width * 0.5, height * 0.3);
  addText(canvas, competencies, font, fillStyle, width * 0.5, height * 0.4);
  // TODO: Will we show an expiration?

  // Convert the Canvas to a buffer
  const buffer = bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
  return buffer;
}

async function getExpiration(accountName: string): Promise<string> {
  // TODO: Will we show an expiration? Is it always 'most recent mainnet activity' + 6 months?
  console.log({ accountName });
  return '';
}

async function fetchCertificateDetails(tokenId: string) {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForBackend();
  const contract = getNftContract(account);
  const response = await (contract as NFT).nft_token({ token_id: tokenId });
  if (response) {
    const { metadata } = response;
    const { extra } = metadata;
    const certificateMetadata = JSON.parse(extra);
    console.log({ contract, response, certificateMetadata });
    const accountName = certificateMetadata.original_recipient_id;
    const programCode = certificateMetadata.program;
    const competencies = certificateMetadata.memo || metadata.description; // TODO: Do we definitely want to show competencies? Where will they be stored?
    const expiration = await getExpiration(accountName);
    const date = metadata.issued_at; // TODO: Choose how we want to format the date.
    const programName = metadata.title;
    return {
      tokenId,
      date,
      programCode, // This will determine which background image gets used.
      programName,
      accountName,
      competencies,
      expiration,
    };
  } else {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Buffer | { error: string }>) {
  // Grab payload from query.
  const { imageFileName } = req.query;

  const imageFileNameString = getSimpleStringFromParam(imageFileName);
  const { bufferType, contentType, canvasType, tokenId } = parseFileName(imageFileNameString);
  const details = await fetchCertificateDetails(tokenId);
  if (details) {
    // Provide each piece of text to generateImage.
    const imageBuffer = await generateImage(canvasType, bufferType, details);
    res.setHeader('Content-Type', contentType);
    // TODO: cache
    res.send(imageBuffer);
  } else {
    res.status(HTTP_ERROR_CODE_MISSING).json({ error: `No certificate exists with this Token ID (${tokenId}).` });
  }
}
