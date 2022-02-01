// https://nextjs.org/docs/basic-features/layouts#single-shared-layout-with-custom-app

import Head from 'next/head';
import styles from '../styles/Layout.module.scss';

export default function Layout({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>NEAR University - Certificate Browser</title>
        <meta name="description" content="View NEAR University certificates of any .near account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <a href="/">NEAR University Certificate Browser</a>
      </div>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <a href="https://NEAR.University" target="_blank" rel="noopener noreferrer">
          <img alt="NEAR University logo" src="https://assets-global.website-files.com/617fd6a2d7dd9a6b1c4c4dc6/618466f043553984d596b38d_nu_logo.svg" />
        </a>
      </footer>
    </div>
  );
}
