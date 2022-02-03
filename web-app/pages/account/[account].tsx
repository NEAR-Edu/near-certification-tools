// This page is visible at /account/example.near

import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/Account.module.scss';
import { getImageUrl, getSimpleStringFromParam } from '../../helpers/strings';
import { getNearAccountWithoutAccountIdOrKeyStoreForFrontend } from '../../helpers/near';
import { getNftContract, NFT } from '../api/mint-cert';

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

async function getCertificates(accountId: string): Promise<string[]> {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForFrontend();
  const contract = getNftContract(account);
  if (accountId) {
    // TODO: Clean this up so that it isn't being called multiple times (with the first time having an empty accountId).
    const response = await (contract as NFT).nft_tokens_for_owner({ account_id: accountId });
    console.log({ account, accountId, response });
    return response.map((cert: any) => cert.token_id);
  } else {
    return [];
  }
}

const Account: NextPage = () => {
  const router = useRouter();
  const { account } = router.query; // https://nextjs.org/docs/routing/dynamic-routes
  const accountId = getSimpleStringFromParam(account);

  const [certificates, setCertificates] = useState<string[]>([]);
  useEffect(() => {
    // TODO Use getServerSideProps https://nextjs.org/docs/basic-features/typescript#static-generation-and-server-side-rendering
    // https://github.com/vercel/next.js/discussions/17443#discussioncomment-87097
    async function fetchCertsOncePerPageLoad() {
      console.log('fetchCertsOncePerPageLoad');
      const certs: string[] = await getCertificates(accountId);
      setCertificates(certs);
    }

    fetchCertsOncePerPageLoad();
  }, [accountId]);

  console.log({ account });

  return (
    <Layout>
      <h1 className={styles.title}>{account}&rsquo;s Certificates</h1>

      <div className={styles.grid}>
        {certificates.length > 0 ? certificates.map((tokenId: string) => <Tile tokenId={tokenId} key={tokenId} />) : <span>No certificates yet!</span>}
      </div>
    </Layout>
  );
};

export default Account;
