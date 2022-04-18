// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { AccountId, apiKey, gas, getNftContract, NFT, HTTP_SUCCESS, HTTP_ERROR, rejectAsUnauthorized } from '../../helpers/near';
import { depositAmountYoctoNear } from './mint-cert';

const apiKeyHeaderName = 'x-api-key'; // Although the user interface of Integromat shows the capitalization as "X-API-Key", inspecting the actual header reveals that lowercase is used.

async function invalidateAllCertsForAccount(accountId: AccountId) {
  const contract = await getNftContract();
  const tokens = await (contract as NFT).nft_tokens_for_owner(accountId);

  try {
    await Promise.all(
      tokens.map((token: string) =>
        (contract as NFT).cert_invalidate(
          // https://github.com/near/near-api-js/issues/719
          token,
          gas, // attached GAS (optional)
          depositAmountYoctoNear, // attached deposit in yoctoNEAR (optional).
        ),
      ),
    );

    return { success: true };
  } catch (error) {
    console.error(error);

    return { success: false, error };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // Require that this request is authenticated!

  const { headers } = req; // https://stackoverflow.com/a/63529345/470749
  if (headers?.[apiKeyHeaderName] !== apiKey) {
    rejectAsUnauthorized(res, headers);
  }

  const body = req?.body;
  console.log({ headers, body });
  const { accountId } = body; // Eventually we will want to add error-handling / validation.

  try {
    const result = await invalidateAllCertsForAccount(accountId);
    res.status(HTTP_SUCCESS).json({ result });
  } catch (err) {
    console.error(err);
    res.status(HTTP_ERROR).json({ status: 'error', message: 'invalidateAllCertsForAccount failed.' });
  }
}
