// This page is visible at /account/example.near

import type { GetServerSideProps, NextPage } from 'next';
import Layout from '../../components/Layout';
import styles from '../../styles/Account.module.scss';
import { getImageUrl, getSimpleStringFromParam } from '../../helpers/strings';
import { AccountId, getNearAccountWithoutAccountIdOrKeyStoreForFrontend } from '../../helpers/near';
import { getNftContract, NFT } from '../api/mint-cert';
import { Certificate, isValid } from '../../helpers/certificate';
import ExplorerAccountLink from '../../components/ExplorerAccountLink';

function Tile({ tokenId }: { tokenId: string }): JSX.Element {
  const svgUrl = getImageUrl(tokenId);
  return (
    <div className={styles.card} key={tokenId}>
      <a href={`/certificate/${tokenId}`}>
        <img src={svgUrl} alt={`certificate ${tokenId}`} />
      </a>
    </div>
  );
}

type AccountPageProps = { accountId: AccountId; certificates: Certificate[] };

async function getCertificates(accountId: string): Promise<string[]> {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForFrontend();
  const contract = getNftContract(account);
  const response = await (contract as NFT).nft_tokens_for_owner({ account_id: accountId });
  console.log({ account, accountId, response });
  return response.filter((cert: Certificate) => isValid(cert)).map((cert: Certificate) => cert.token_id);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props
  // TODO: Replace `"near-api-js": "ryancwalsh/near-api-js#gracefully-handle-window-and-buffer"` with the official "near-api-js" in `package.json` once https://github.com/near/near-api-js/issues/747 is fixed.
  const { account } = context.query; // https://nextjs.org/docs/routing/dynamic-routes
  const accountId = getSimpleStringFromParam(account);
  const certificates = await getCertificates(accountId);
  console.log({ accountId, certificates });
  // Pass data to the page via props
  const props: AccountPageProps = { accountId, certificates };
  return { props };
};

const Account: NextPage<AccountPageProps> = ({ accountId, certificates }: AccountPageProps) => {
  return (
    <Layout>
      <h1 className="text-center text-3xl sm:text-4xl">{accountId}&rsquo;s Certificates</h1>

      <div className={styles.grid}>
        {certificates.length > 0 ? certificates.map((tokenId: string) => <Tile tokenId={tokenId} key={tokenId} />) : <span>No certificates yet!</span>}
      </div>
      <div className="mt-5">
        <ExplorerAccountLink accountId={accountId} />
      </div>
    </Layout>
  );
};

export default Account;
