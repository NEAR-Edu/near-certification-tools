// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto'; // Added in: node v14.17.0
import { Account, Contract, utils } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import { AccountId, getNearAccount } from '../../helpers/near';
import { getImageUrl } from '../../helpers/strings';

const privateKey = process.env.NEAR_PRIVATE_KEY || '';
const apiKey = process.env.API_KEY || '';
// public vars:
const certificateContractName = process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_NAME || 'example-contract.testnet';
const issuingAuthorityAccountId = process.env.NEXT_PUBLIC_ISSUING_AUTHORITY_ACCOUNT_ID || 'example-authority.testnet';
const gas = process.env.NEXT_PUBLIC_GAS || 300000000000000;

console.log('public env vars', { certificateContractName, issuingAuthorityAccountId, gas });

const HTTP_SUCCESS = 200;
const HTTP_ERROR = 500;
const HTTP_UNAUTHORIZED = 401; // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
// Could also use https://github.com/near/units-js#parsing-strings for this:
const depositAmountYoctoNear = utils.format.parseNearAmount('0.2'); // 0.2Ⓝ is max. There will be a certain deposit required to pay for the storage of the data on chain. Contract will automatically refund any excess.
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

export type NFT = Contract & {
  // https://stackoverflow.com/a/41385149/470749
  nft_mint: (args: any, gas: any, depositAmount: any) => Promise<any>; // TODO Add types
  nft_token: (args: any) => Promise<any>;
  nft_tokens_for_owner: (args: any) => Promise<any>;
};

export function getNftContract(account: Account) {
  // TODO: Make `account` optional.
  const contract = new Contract(
    account, // the account object that is connecting
    certificateContractName,
    {
      viewMethods: ['nft_token', 'nft_tokens_for_owner'], // view methods do not change state but usually return a value
      changeMethods: ['nft_mint'], // change methods modify state
    },
  );
  return contract;
}

function generateUUIDForTokenId(): string {
  return randomUUID().replaceAll('-', ''); // https://stackoverflow.com/a/67624847/470749 https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
}

function buildMetadata(certificateRequiredFields: CertificateRequiredFields) {
  const issuedAt = new Date().toJSON();

  /* eslint-disable camelcase */
  const tokenMetadata = (({ title, description }) => ({ title, description, issued_at: issuedAt }))(certificateRequiredFields); // https://stackoverflow.com/a/67591318/470749
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
    program_start_date,
    program_end_date,
    original_recipient_id,
    original_recipient_name,
    valid: true,
    memo, // This will list out the competencies that have been certified.
  }))(certificateRequiredFields);
  /* eslint-enable camelcase */

  console.log({ tokenMetadata, certificationMetadata });
  return { tokenMetadata, certificationMetadata };
}

async function mintCertificate(tokenId: string, certificateRequiredFields: CertificateRequiredFields) {
  const account = await getNearAccount(issuingAuthorityAccountId, privateKey);
  const contract = getNftContract(account);
  const { tokenMetadata, certificationMetadata } = buildMetadata(certificateRequiredFields);
  const payload = {
    receiver_account_id: certificateRequiredFields.original_recipient_id,
    token_id: tokenId,
    token_metadata: tokenMetadata,
    certification_metadata: certificationMetadata,
    memo: null,
  };
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
  const { headers } = req; // https://stackoverflow.com/a/63529345/470749
  if (headers?.[apiKeyHeaderName] === apiKey) {
    const body = req?.body;
    console.log({ headers, body });
    const certificateRequiredFields = body?.details; // Eventually we will want to add error-handling / validation.
    const tokenId = generateUUIDForTokenId();
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
    const errorMsg = 'Unauthorized. Please provide the API key.';
    console.log({ errorMsg, headers });
    res.status(HTTP_UNAUTHORIZED).json({ status: 'error', message: errorMsg });
  }
}
