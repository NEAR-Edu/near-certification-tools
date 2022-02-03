import React, { FormEvent, useState } from 'react';
import type { NextPage } from 'next';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.scss';
import { networkId } from '../helpers/near';

const suffix = networkId === 'mainnet' ? '.near' : networkId;

const Home: NextPage = () => {
  const [account, setAccount] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log(account);
    const destinationPath = account.endsWith(suffix) ? account : `${account}${suffix}`;
    window.location.href = `/account/${destinationPath}`;
  }

  return (
    <Layout>
      <h1 className={styles.title}>Welcome to NEAR University&rsquo;s Certificate Browser!</h1>

      <p className={styles.description}>Choose an account to view:</p>

      <form onSubmit={onSubmit} className="mt-4">
        <input type="text" name="account" placeholder={`example${suffix}`} onChange={(event) => setAccount(event.target.value)} className="border border-gray-500 p-2" required />
        <button type="submit" className="border border-gray-500 p-2">
          Go
        </button>
      </form>
    </Layout>
  );
};

export default Home;
