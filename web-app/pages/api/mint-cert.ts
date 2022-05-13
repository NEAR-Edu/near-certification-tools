// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { randomUUID } from 'crypto'; // Added in: node v14.17.0
import { utils } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import type { NextApiRequest, NextApiResponse } from 'next';
import { Certificate } from '../../helpers/certificate';
import { getExpiration } from '../../helpers/expiration-date';
import { AccountId, apiKey, gas, getNftContract, HTTP_ERROR, HTTP_SUCCESS, NFT, rejectAsUnauthorized } from '../../helpers/near';
import { getImageUrl } from '../../helpers/strings';
import { convertMillisecondsTimestampToFormattedDate, convertStringDateToNanoseconds } from '../../helpers/time';
import { ImageIngredients } from '../../helpers/types';
import { getBase64ImageHash } from './cert/[imageFileName]';

// Could also use https://github.com/near/units-js#parsing-strings for this:
export const depositAmountYoctoNear = utils.format.parseNearAmount('0.2'); // 0.2Ⓝ is max. There will be a certain deposit required to pay for the storage of the data on chain. Contract will automatically refund any excess.
const apiKeyHeaderName = 'x-api-key'; // Although the user interface of Integromat shows the capitalization as "X-API-Key", inspecting the actual header reveals that lowercase is used.

type CertificateRequiredFields = {
  title: string;
  description: string;
  media: string;
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
  return randomUUID().replace(/-/g, ''); // https://stackoverflow.com/a/67624847/470749 https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
}

async function getImageIngredientsFromCertificateRequiredFields(
  tokenId: string,
  issuedAt: string,
  certificateRequiredFields: CertificateRequiredFields,
): Promise<ImageIngredients> {
  // Field mappings here must stay in sync with fetchCertificateDetails.
  const accountName = certificateRequiredFields.original_recipient_id;
  const expiration = await getExpiration(accountName, issuedAt); // If the indexer is unavailable, this should throw an error so that minting fails.
  return {
    tokenId,
    date: convertMillisecondsTimestampToFormattedDate(issuedAt),
    expiration,
    programCode: certificateRequiredFields.program,
    programName: certificateRequiredFields.program_name,
    accountName,
    programDescription: certificateRequiredFields.description,
    instructor: certificateRequiredFields.authority_id,
  };
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
  return { title, description, media, issued_at, copies: 1 };
  /* eslint-enable camelcase */
}

function buildCertificationMetadata(certificateRequiredFields: CertificateRequiredFields) {
  /* eslint-disable camelcase */
  const certificationMetadata = (({
    authority_id,
    authority_name,
    program,
    program_name,
    program_link,
    program_start_date,
    program_end_date,
    original_recipient_id,
    original_recipient_name,
    memo,
  }) => ({
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
  }))(certificateRequiredFields);
  /* eslint-enable camelcase */

  console.log({ certificationMetadata });
  return certificationMetadata;
}

async function mintCertificate(tokenId: string, certificateRequiredFields: CertificateRequiredFields) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
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
