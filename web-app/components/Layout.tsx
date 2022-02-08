// https://nextjs.org/docs/basic-features/layouts#single-shared-layout-with-custom-app

import Head from 'next/head';
import styles from '../styles/Layout.module.scss';
// eslint-disable-next-line import/no-named-as-default
// eslint-disable-next-line import/no-named-as-default-member
import Footer from './Footer';
import Header from './Header';

export default function Layout({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>NEAR University - Certificate Browser</title>
        <meta name="description" content="View NEAR University certificates of any .near account" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/brands.min.css"
          integrity="sha512-rQgMaFKZKIoTKfYInSVMH1dSM68mmPYshaohG8pK17b+guRbSiMl9dDbd3Sd96voXZeGerRIFFr2ewIiusEUgg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
