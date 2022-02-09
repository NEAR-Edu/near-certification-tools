// https://nextjs.org/docs/basic-features/layouts#single-shared-layout-with-custom-app

import Head from 'next/head';
import styles from '../styles/Layout.module.scss';
import Footer from './Footer';

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
      <div className="mt-4">
        <a className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700" href="/">
          NEAR University Certificate Browser
        </a>
      </div>
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
