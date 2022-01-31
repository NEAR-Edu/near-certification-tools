// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto'; // Added in: node v14.17.0
import { Account, Contract, utils } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import { AccountId, getNearAccount } from '../../helpers/near';
import { getSimpleStringFromParam } from '../../helpers/strings';

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
const apiKeyHeaderName = 'X-Api-key';

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

type NFT = Contract & {
  // https://stackoverflow.com/a/41385149/470749
  nft_mint: (args: any, gas: any, depositAmount: any) => Promise<any>;
};

function getNftContract(account: Account) {
  const contract = new Contract(
    account, // the account object that is connecting
    certificateContractName,
    {
      viewMethods: [], // view methods do not change state but usually return a value
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

function getSvgUrl(baseUrl: string, tokenId: string) {
  return `${baseUrl}/api/cert/${tokenId}.svg`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // Require that this request is authenticated!
  const { headers } = req; // https://stackoverflow.com/a/63529345/470749
  if (headers?.[apiKeyHeaderName] === apiKey) {
    const { details } = req.query;
    const detailsJson = getSimpleStringFromParam(details);
    const certificateRequiredFields = JSON.parse(detailsJson); // Eventually we will want to add error-handling / validation.
    const tokenId = generateUUIDForTokenId();
    mintCertificate(tokenId, certificateRequiredFields)
      .then((result) => {
        const url = getSvgUrl(req.headers.host || '', tokenId);
        res.status(HTTP_SUCCESS).json({ result, tokenId, url });
      })
      .catch(() => {
        res.status(HTTP_ERROR).json({ status: 'error', message: 'Issuing the certificate failed.' });
      });
  } else {
    res.status(HTTP_UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized. Please provide the API key.' });
  }
}
