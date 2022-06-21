// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { randomUUID } from 'crypto'; // Added in: node v14.17.0
import { utils } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import { type NextApiRequest, type NextApiResponse } from 'next';
import { type Certificate } from '../../helpers/certificate';
import { type AccountId, type NFT, apiKey, gas, getNftContract, HTTP_ERROR, HTTP_SUCCESS, rejectAsUnauthorized } from '../../helpers/near';
import { getImageUrl } from '../../helpers/strings';
import { convertStringDateToNanoseconds } from '../../helpers/time';
import { type JsonResponse, type NftMintResult } from '../../helpers/types';

// Could also use https://github.com/near/units-js#parsing-strings for this:
export const depositAmountYoctoNear = utils.format.parseNearAmount('0.2'); // 0.2Ⓝ is max. There will be a certain deposit required to pay for the storage of the data on chain. Contract will automatically refund any excess.
const apiKeyHeaderName = 'x-api-key'; // Although the user interface of Integromat shows the capitalization as "X-API-Key", inspecting the actual header reveals that lowercase is used.

type CertificateRequiredFields = {
  authority_id: AccountId;
  authority_name: string;
  description: string;
  memo: string;
  original_recipient_id: AccountId;
  original_recipient_name: string;
  program: string;
  program_end_date: string;
  program_link: string;
  program_name: string;
  program_start_date: string;
  title: string;
};

function generateUUIDForTokenId(): string {
  return randomUUID().replaceAll('-', ''); // https://stackoverflow.com/a/67624847/470749 https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
}

/**
 *
 * @see https://nomicon.io/Standards/Tokens/NonFungibleToken/Metadata#interface
 */
function buildTokenMetadata(tokenId: string, certificateRequiredFields: CertificateRequiredFields): Certificate['metadata'] {
  const issuedAt = Date.now().toString(); // issued_at expects milliseconds since epoch as string
  const media = getImageUrl(tokenId);
  const { title, description } = certificateRequiredFields;
  return { copies: 1, description, issued_at: issuedAt, media, title }; // Jacob L, Ryan W, and Petar V just decided to omit media_hash (even though the NFT standard requires it) since `media` points to a URL that dynamically generates the image (and since these NFTs aren't transferrable anyway).
}

function buildCertificationMetadata(certificateRequiredFields: CertificateRequiredFields) {
  /* eslint-disable camelcase */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { authority_id, authority_name, program, program_name, program_link, program_start_date, program_end_date, original_recipient_id, original_recipient_name, memo } =
    certificateRequiredFields;

  const certificationMetadata = {
    authority_id,
    authority_name,
    memo,
    original_recipient_id,
    original_recipient_name,
    program,
    program_end_date: convertStringDateToNanoseconds(program_end_date),
    program_link,
    program_name,
    program_start_date: convertStringDateToNanoseconds(program_start_date),
    valid: true, // This will list out the competencies that have been certified.
  };
  /* eslint-enable camelcase */

  console.log({ certificationMetadata });
  return certificationMetadata;
}

async function mintCertificate(tokenId: string, certificateRequiredFields: CertificateRequiredFields): Promise<NftMintResult> {
  const contract = await getNftContract();
  const tokenMetadata = buildTokenMetadata(tokenId, certificateRequiredFields);
  const certificationMetadata = buildCertificationMetadata(certificateRequiredFields);
  const payload = {
    certification_metadata: certificationMetadata,
    memo: null,
    receiver_account_id: certificateRequiredFields.original_recipient_id,
    token_id: tokenId,
    token_metadata: tokenMetadata,
  };
  console.log({ payload });
  const result = (contract as NFT).nft_mint(
    // https://github.com/near/near-api-js/issues/719
    payload,
    gas, // attached GAS (optional)
    depositAmountYoctoNear, // attached deposit in yoctoNEAR (optional).
  );
  // eslint-disable-next-line no-return-await
  return await result;
}

export default async function handler(request: NextApiRequest, response: NextApiResponse<JsonResponse | { result: NftMintResult; tokenId: string; url: string }>) {
  // Require that this request is authenticated!
  const tokenId = generateUUIDForTokenId();
  console.log({ tokenId });
  const { headers } = request; // https://stackoverflow.com/a/63529345/470749
  if (headers[apiKeyHeaderName] === apiKey) {
    const { body } = request;
    console.log({ body, headers });
    const certificateRequiredFields = body?.details; // Eventually we will want to add error-handling / validation.
    // const tokenId = generateUUIDForTokenId();
    console.log('minting', { certificateRequiredFields, tokenId });
    try {
      const result = await mintCertificate(tokenId, certificateRequiredFields);
      const url = getImageUrl(tokenId);
      response.status(HTTP_SUCCESS).json({ result, tokenId, url });
    } catch (error) {
      console.error(error);
      response.status(HTTP_ERROR).json({ message: 'Issuing the certificate failed.', status: 'error' });
    }
  } else {
    rejectAsUnauthorized(response, headers);
  }
}
