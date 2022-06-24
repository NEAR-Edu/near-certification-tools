// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { randomUUID } from 'crypto'; // Added in: node v14.17.0
import { utils } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import type { NextApiRequest, NextApiResponse } from 'next';
import { Certificate } from '../../helpers/certificate';
import { AccountId, apiKey, gas, getNftContract, HTTP_ERROR, HTTP_SUCCESS, NFT, rejectAsUnauthorized } from '../../helpers/near';
import { getImageUrl } from '../../helpers/strings';
import { convertStringDateToNanoseconds } from '../../helpers/time';
import { JsonResponse, NftMintResult } from '../../helpers/types';

// Could also use https://github.com/near/units-js#parsing-strings for this:
export const depositAmountYoctoNear = utils.format.parseNearAmount('0.2'); // 0.2Ⓝ is max. There will be a certain deposit required to pay for the storage of the data on chain. Contract will automatically refund any excess.
const apiKeyHeaderName = 'x-api-key'; // Although the user interface of Integromat shows the capitalization as "X-API-Key", inspecting the actual header reveals that lowercase is used.

type CertificateRequiredFields = {
  title: string;
  description: string;
  authority_id: AccountId;
  authority_name: string;
  program: string;
  program_name: string;
  program_link: string;
  program_start_date: string;
  program_end_date: string;
  original_recipient_id: AccountId;
  original_recipient_name: string;
  memo: string;
};

function generateUUIDForTokenId(): string {
  return randomUUID().replace(/-/g, ''); // https://stackoverflow.com/a/67624847/470749 https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID https://stackoverflow.com/questions/72637010/replaceall-is-not-working-in-next-js-node-js-when-deployed-to-render-com-ser
}

/**
 *
 * @see https://nomicon.io/Standards/Tokens/NonFungibleToken/Metadata#interface
 */
function buildTokenMetadata(tokenId: string, certificateRequiredFields: CertificateRequiredFields): Certificate['metadata'] {
  /* eslint-disable camelcase */
  const issued_at = Date.now().toString(); // issued_at expects milliseconds since epoch as string
  const media = getImageUrl(tokenId);
  const { title, description } = certificateRequiredFields;
  return { title, description, media, issued_at, copies: 1 }; // Jacob L, Ryan W, and Petar V just decided to omit media_hash (even though the NFT standard requires it) since `media` points to a URL that dynamically generates the image (and since these NFTs aren't transferrable anyway).
  /* eslint-enable camelcase */
}

function buildCertificationMetadata(certificateRequiredFields: CertificateRequiredFields) {
  /* eslint-disable camelcase */
  const { authority_id, authority_name, program, program_name, program_link, program_start_date, program_end_date, original_recipient_id, original_recipient_name, memo } =
    certificateRequiredFields;

  const certificationMetadata = {
    authority_id,
    authority_name,
    program,
    program_name,
    program_link,
    program_start_date: convertStringDateToNanoseconds(program_start_date),
    program_end_date: convertStringDateToNanoseconds(program_end_date),
    original_recipient_id,
    original_recipient_name,
    valid: true,
    memo, // This will list out the competencies that have been certified.
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
    receiver_account_id: certificateRequiredFields.original_recipient_id,
    token_id: tokenId,
    token_metadata: tokenMetadata,
    certification_metadata: certificationMetadata,
    memo: null,
  };
  console.log({ payload });
  const result = (contract as NFT).nft_mint(
    // https://github.com/near/near-api-js/issues/719
    payload,
    gas, // attached GAS (optional)
    depositAmountYoctoNear, // attached deposit in yoctoNEAR (optional).
  );
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<JsonResponse | { url: string; tokenId: string; result: NftMintResult }>) {
  // Require that this request is authenticated!
  const tokenId = generateUUIDForTokenId();
  console.log({ tokenId });
  const { headers } = req; // https://stackoverflow.com/a/63529345/470749
  if (headers?.[apiKeyHeaderName] === apiKey) {
    const body = req?.body;
    console.log({ headers, body });
    const certificateRequiredFields = body?.details; // Eventually we will want to add error-handling / validation.
    // const tokenId = generateUUIDForTokenId();
    console.log('minting', { tokenId, certificateRequiredFields });
    try {
      const result = await mintCertificate(tokenId, certificateRequiredFields);
      const url = getImageUrl(tokenId);
      res.status(HTTP_SUCCESS).json({ url, tokenId, result });
    } catch (err) {
      console.error(err);
      res.status(HTTP_ERROR).json({ status: 'error', message: 'Issuing the certificate failed.' });
    }
  } else {
    rejectAsUnauthorized(res, headers);
  }
}
