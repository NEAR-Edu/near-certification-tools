// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { utils } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import { type NextApiRequest, type NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { type CertificateRequiredFields, validate, buildTokenMetadata, buildCertificationMetadata } from '../../helpers/certificate';
import { apiKey, gas, getNftContract, HTTP_ERROR, HTTP_SUCCESS, rejectAsUnauthorized } from '../../helpers/near';
import { generateUUIDForTokenId, getImageUrl } from '../../helpers/strings';
import { type JsonResponse, type NftMintResult } from '../../helpers/types';

// Could also use https://github.com/near/units-js#parsing-strings for this:
export const depositAmountYoctoNear = utils.format.parseNearAmount('0.2') as string; // 0.2Ⓝ is max. There will be a certain deposit required to pay for the storage of the data on chain. Contract will automatically refund any excess.
const apiKeyHeaderName = 'x-api-key'; // Although the user interface of Integromat shows the capitalization as "X-API-Key", inspecting the actual header reveals that lowercase is used.

async function mintCertificate(tokenId: string, certificateRequiredFields: CertificateRequiredFields): Promise<NftMintResult> {
  const contract = await getNftContract();

  const payload = {
    receiver_account_id: certificateRequiredFields.original_recipient_id,
    token_id: tokenId,
    certification_metadata: buildCertificationMetadata(certificateRequiredFields),
    token_metadata: buildTokenMetadata(tokenId, certificateRequiredFields),
  };

  const result = await contract.nft_mint(
    // https://github.com/near/near-api-js/issues/719
    payload,
    gas, // attached GAS (optional)
    depositAmountYoctoNear, // attached deposit in yoctoNEAR (optional).
  );

  return result;
}

export default async function handler({ headers, body }: NextApiRequest, response: NextApiResponse<JsonResponse | { result: NftMintResult; tokenId: string; url: string }>) {
  // Require that this request is authenticated!
  const tokenId = generateUUIDForTokenId();
  console.log({ tokenId });

  if (headers[apiKeyHeaderName] !== apiKey) {
    rejectAsUnauthorized(response, headers);
    return;
  }

  console.log({ body, headers });
  const input = body?.details;
  let certificateRequiredFields: CertificateRequiredFields;

  try {
    certificateRequiredFields = validate(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const formatted = fromZodError(error);
      console.error(formatted);
      response.status(400).json({ message: JSON.stringify(formatted), status: 'error' });
    }

    response.status(400).json({ message: `Invalid data. ${JSON.stringify(error)}`, status: 'error' });

    return;
  }

  console.log('minting', { certificateRequiredFields, tokenId });

  try {
    const result = await mintCertificate(tokenId, certificateRequiredFields);
    const url = getImageUrl(tokenId);

    response.status(HTTP_SUCCESS).json({ result, tokenId, url });
  } catch (error) {
    console.error(error);
    response.status(HTTP_ERROR).json({ message: 'Issuing the certificate failed.', status: 'error' });
  }
}
