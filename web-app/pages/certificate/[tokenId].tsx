// This page is visible at /certificate/j3h45kjh345

import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/Account.module.scss';

const Certificate: NextPage = () => {
  const router = useRouter();
  const { tokenId } = router.query; // https://nextjs.org/docs/routing/dynamic-routes

  console.log({ tokenId });

  return (
    <Layout>
      <h1 className={styles.title}>{tokenId}</h1>
    </Layout>
  );
};

export default Certificate;
