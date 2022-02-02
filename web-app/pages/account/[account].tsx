// This page is visible at /account/example.near

import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/Account.module.scss';

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

function DemoTiles({ num }: { num: number }): JSX.Element {
  // TODO: Remove
  const tiles = [];
  for (let i = 1; i <= num; i += 1) {
    tiles.push(`${i}`);
  }
  if (tiles.length > 0) {
    tiles[0] = '303216412112497cb6c193152a27c49c';
  }
  return (
    <>
      {tiles.map((tokenId) => (
        <Tile tokenId={tokenId} key={tokenId} />
      ))}
    </>
  );
}

const Account: NextPage = () => {
  const router = useRouter();
  const { account } = router.query; // https://nextjs.org/docs/routing/dynamic-routes

  const [num, setNum] = useState(0);
  useEffect(() => {
    // https://github.com/vercel/next.js/discussions/17443#discussioncomment-87097
    const rand = randomIntBetween(0, 9);
    console.log({ rand });
    setNum(rand);
  }, []);

  console.log({ account });

  return (
    <Layout>
      <h1 className={styles.title}>{account}&rsquo;s Certificates</h1>

      <div className={styles.grid}>{num ? <DemoTiles num={num} /> : <span>No certificates yet!</span>}</div>
    </Layout>
  );
};

export default Account;
