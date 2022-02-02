// This page is visible at /account/example.near

import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/Account.module.scss';
import { getSimpleStringFromParam } from '../../helpers/strings';

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

function randomIntBetween(min: number, max: number): number {
  // TODO Remove this function when removing DemoTiles
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function Tile({ tokenId }: { tokenId: string }): JSX.Element {
  const svgUrl = `${baseUrl}/api/cert/${tokenId}.svg`;
  return (
    <div className={styles.card} key={tokenId}>
      <a href={`/certificate/${tokenId}`}>
        <img src={svgUrl} alt={`certificate ${tokenId}`} />
      </a>
    </div>
  );
}

async function getCertificates(accountId: string): Promise<string[]> {
  // TODO Fetch from blockchain instead. See impl_non_fungible_token_enumeration in data-contract/src/contract/nft.rs and https://docs.rs/near-contract-standards/latest/near_contract_standards/macro.impl_non_fungible_token_enumeration.html
  const num = randomIntBetween(0, 9);
  const certificates = [];
  for (let i = 1; i <= num; i += 1) {
    certificates.push(`${i}`);
  }
  if (certificates.length > 0) {
    certificates[0] = '303216412112497cb6c193152a27c49c';
  }
  console.log({ accountId, num, certificates });
  return certificates;
}

const Account: NextPage = () => {
  const router = useRouter();
  const { account } = router.query; // https://nextjs.org/docs/routing/dynamic-routes
  const accountId = getSimpleStringFromParam(account);

  const [certificates, setCertificates] = useState<string[]>([]);
  useEffect(() => {
    // https://github.com/vercel/next.js/discussions/17443#discussioncomment-87097
    async function fetchCertsOncePerPageLoad() {
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
