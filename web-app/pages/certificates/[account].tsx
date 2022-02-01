// This page is visible at /certificates/example.near

import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/Account.module.scss';

function randomIntBetween(min: number, max: number): number {
  // TODO Remove this function when removing DemoTiles
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function DemoTiles({ num }: { num: number }): JSX.Element {
  const tiles = [];
  for (let i = 1; i <= num; i += 1) {
    tiles.push(i);
  }

  return (
    <>
      {tiles.map((i) => (
        <a href={`/api/cert/${i}.svg`} className={styles.card} key={i}>
          <h2>Cert {i}</h2>
          <p>something.</p>
        </a>
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
