// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  // registerFont,
  createCanvas,
  loadImage,
} from 'canvas';

// TODO: Update this section:
const certificateBackgroundImage = './public/background.png';
// const fontFile = './fonts/Sign-Painter-Regular.ttf';
const fontFamily = 'signpainter';
const extensionRegEx = /\.png$/;

// TODO registerFont(fontFile, { family: fontFamily });

export default async function handler(req: NextApiRequest, res: NextApiResponse<Buffer>) {
  // Grab payload from query. https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
  const { imageFileName } = req.query;

  const imageFileNameString = typeof imageFileName === 'string' ? imageFileName : imageFileName[0];
  const hash = imageFileNameString.replace(extensionRegEx, '');
  console.log({ imageFileName, hash });

  // TODO: Using this hash, fetch other text (from NFT metadata) that will be added to the certificate image.

  // TODO: Change the design and content of this image.

  // Define the canvas
  const width = 200; // width of the image
  const height = 100; // height of the image
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  // Define the font style
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillStyle = 'red';
  context.font = `40px '${fontFamily}' bold`;

  // Load and draw the background image first
  await loadImage(certificateBackgroundImage).then((image) => {
    // Draw the background
    context.drawImage(image, 0, 0, width, height);

    // Draw the text
    context.fillText(hash, width / 2, height / 2);

    // Convert the Canvas to a buffer
    const buffer = canvas.toBuffer('image/png');

    // Set and send the response as a PNG
    res.setHeader('Content-Type', 'image/png');
    // TODO: cache
    res.send(buffer);
  });
}
