// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Account, Contract } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
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
const depositAmount = 0;
const apiKeyHeaderName = 'X-Api-key';

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

async function mintCertificate(receiverAccountId: AccountId, certificationMetadata: any) {
  const account = await getNearAccount(issuingAuthorityAccountId, privateKey);
  const contract = getNftContract(account);
  const result = (contract as NFT).nft_mint(
    // https://github.com/near/near-api-js/issues/719
    {
      receiver_account_id: receiverAccountId,
      certification_metadata: certificationMetadata,
      /* TODO: Remove.
        &mut self,
        token_id: TokenId,
        receiver_account_id: Option<AccountId>,
        token_metadata: TokenMetadata,
        certification_metadata: CertificationExtraMetadata,
        memo: Option<String>,
        */
    },
    gas, // attached GAS (optional)
    depositAmount, // attached deposit in yoctoNEAR (optional)
  );
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // Require that this request is authenticated!
  const { headers } = req; // https://stackoverflow.com/a/63529345/470749
  if (headers?.[apiKeyHeaderName] === apiKey) {
    const { receiverAccountId, certificationMetadata } = req.query;
    const receiverAccountIdString = getSimpleStringFromParam(receiverAccountId);
    mintCertificate(receiverAccountIdString, certificationMetadata)
      .then((result) => {
        res.status(HTTP_SUCCESS).json({ result });
      })
      .catch(() => {
        res.status(HTTP_ERROR).json({ status: 'error', message: 'Issuing the certificate failed.' });
      });
  } else {
    res.status(HTTP_UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized. Please provide the API key.' });
  }
}
