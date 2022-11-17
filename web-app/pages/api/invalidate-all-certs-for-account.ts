// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { type NextApiRequest, type NextApiResponse } from 'next';
import { z, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { checkAccountId } from '../../helpers/certificate';
import { type AccountId, apiKey, gas, getNftContract, HTTP_ERROR, HTTP_SUCCESS, rejectAsUnauthorized } from '../../helpers/near';
import { type JsonResponse } from '../../helpers/types';

const apiKeyHeaderName = 'x-api-key'; // Although the user interface of Integromat shows the capitalization as "X-API-Key", inspecting the actual header reveals that lowercase is used.

async function invalidateAllCertsForAccount(accountId: AccountId) {
  const contract = await getNftContract();
  const tokens = await contract.nft_tokens_for_owner({ account_id: accountId });

  try {
    await Promise.all(
      /* eslint-disable-next-line camelcase */
      tokens.map(({ token_id }) =>
        contract.cert_invalidate(
          // https://github.com/near/near-api-js/issues/719
          /* eslint-disable-next-line camelcase */
          { token_id }, // `memo` here?
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

function validateInput(input: unknown): string {
  const validationSchema = z.object({
    accountId: z.string().min(1).refine(checkAccountId, { message: 'Not a valid account ID.' }),
  });

  const result = validationSchema.parse(input);

  return result.accountId;
}

export default async function handler({ headers, body }: NextApiRequest, response: NextApiResponse<JsonResponse>) {
  // Require that this request is authenticated!
  if (headers[apiKeyHeaderName] !== apiKey) {
    rejectAsUnauthorized(response, headers);
    return;
  }

  console.log({ body, headers });
  let accountId: string;

  try {
    accountId = validateInput(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const formatted = fromZodError(error);
      console.error(formatted);
      response.status(400).json({ message: JSON.stringify(formatted), status: 'error' });
    }

    response.status(400).json({ message: `Invalid data. ${JSON.stringify(error)}`, status: 'error' });

    return;
  }

  try {
    const result = await invalidateAllCertsForAccount(accountId);

    response.status(HTTP_SUCCESS).json(result);
  } catch (error) {
    console.error(error);

    response.status(HTTP_ERROR).json({ message: 'invalidateAllCertsForAccount failed.', status: 'error' });
  }
}
