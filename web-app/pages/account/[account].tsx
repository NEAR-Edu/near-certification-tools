/* eslint-disable canonical/filename-match-regex */
// This page is visible at /account/example.near

import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link'; // https://nextjs.org/docs/api-reference/next/link
import ExplorerAccountLink from '../../components/ExplorerAccountLink';
import Layout from '../../components/Layout';
import { Token, isValid } from '../../helpers/certificate';
import { AccountId, getNearAccountWithoutAccountIdOrKeyStoreForFrontend, getNftContractOfAccount } from '../../helpers/near';
import { getImageUrl, getSimpleStringFromParameter } from '../../helpers/strings';
import styles from '../../styles/Account.module.scss';

function Tile({ tokenId }: { tokenId: string }): JSX.Element {
  const svgUrl = getImageUrl(tokenId);
  return (
    <div className={styles.card} key={tokenId}>
      <Link href={`/certificate/${tokenId}`}>
        <a href={`/certificate/${tokenId}`}>
          <img src={svgUrl} alt={`certificate ${tokenId}`} />
        </a>
      </Link>
    </div>
  );
}

type AccountPageProps = { accountId: AccountId; tokenIds: string[] };

async function getTokenIdsOfCertificates(accountId: string): Promise<string[]> {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForFrontend();
  const contract = getNftContractOfAccount(account);
  const response = await contract.nft_tokens_for_owner({ account_id: accountId });
  console.log({ account, accountId, response });
  return response.filter((cert) => isValid(cert as Required<Token>)).map((cert) => cert.token_id);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props
  // TODO: Replace `"near-api-js": "ryancwalsh/near-api-js#gracefully-handle-window-and-buffer"` with the official "near-api-js" in `package.json` once https://github.com/near/near-api-js/issues/747 is fixed.
  const { account } = context.query; // https://nextjs.org/docs/routing/dynamic-routes
  const accountId = getSimpleStringFromParameter(account);
  const tokenIds = await getTokenIdsOfCertificates(accountId);
  console.log({ accountId, tokenIds });
  // Pass data to the page via props
  const props: AccountPageProps = { accountId, tokenIds };
  return { props };
};

const Account: NextPage<AccountPageProps> = ({ accountId, tokenIds }: AccountPageProps) => {
  const tiles = tokenIds.map((tokenId: string) => <Tile tokenId={tokenId} key={tokenId} />);
  return (
    <Layout>
      <h1 className="text-center text-3xl sm:text-4xl">{accountId}&rsquo;s Certificates</h1>

      <div className={styles.grid}>{tokenIds.length > 0 ? tiles : <span>No certificates yet!</span>}</div>
      <div className="mt-5">
        <ExplorerAccountLink accountId={accountId} />
      </div>
    </Layout>
  );
};

export default Account;
