import { type NextApiRequest, type NextApiResponse } from 'next';

export default async function handler(request: NextApiRequest, response: NextApiResponse<{ error: string } | { test: string }>) {
  try {
    const test = [...Array.from({ length: 10 }).fill(0)].join('-').replaceAll('-', ';');
    console.log({ test });
    response.json({ test });
  } catch (error) {
    console.error({ error });
    response.status(500).json({ error: `${error}` });
  }
}
