// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { type NextApiRequest, type NextApiResponse } from 'next';
import { type AccountId, apiKey, gas, getNftContract, HTTP_ERROR, HTTP_SUCCESS, rejectAsUnauthorized } from '../../helpers/near';
import { type JsonResponse } from '../../helpers/types';

const apiKeyHeaderName = 'x-api-key'; // Although the user interface of Integromat shows the capitalization as "X-API-Key", inspecting the actual header reveals that lowercase is used.

async function invalidateAllCertsForAccount(accountId: AccountId) {
  const contract = await getNftContract();
  const tokens = await contract.nft_tokens_for_owner({ account_id: accountId });

  try {
    await Promise.all(
      tokens.map((certificate) =>
        contract.cert_invalidate(
          // https://github.com/near/near-api-js/issues/719
          { token_id: certificate.token_id }, // `memo` here?
          gas,
          '1', // deposit exactly 1 yoctoNEAR
        ),
      ),
    );

    return { success: true };
  } catch (error) {
    console.error(error);

    return { error, success: false };
  }
}

export default async function handler(request: NextApiRequest, response: NextApiResponse<JsonResponse>) {
  // Require that this request is authenticated!

  const { headers } = request; // https://stackoverflow.com/a/63529345/470749
  if (headers[apiKeyHeaderName] !== apiKey) {
    rejectAsUnauthorized(response, headers);
  }

  const { body } = request;
  console.log({ body, headers });
  const { accountId } = body; // Eventually we will want to add error-handling / validation.

  try {
    const result = await invalidateAllCertsForAccount(accountId);
    response.status(HTTP_SUCCESS).json(result);
  } catch (error) {
    console.error(error);
    response.status(HTTP_ERROR).json({ message: 'invalidateAllCertsForAccount failed.', status: 'error' });
  }
}
