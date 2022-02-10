import React, { FormEvent, useState } from 'react';
import type { NextPage } from 'next';
import Layout from '../components/Layout';
import { networkId } from '../helpers/near';

const suffix = networkId === 'mainnet' ? '.near' : `.${networkId}`;

// eslint-disable-next-line max-lines-per-function
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
      <div className="">
        <div className="flex flex-col justify-center items-center h/5-screen mt-10 relative px-4 py-7 overflow-hidden sm:px-6 sm:py-8 lg:p-12 xl:p-16">
          <h1 className="text-2xl font-semibold font-display text-black sm:text-2xl">Welcome to NEAR University&rsquo;s Certificate Browser!</h1>
          <p className="mt-5 max-w-xl text-base text-black text-xl">Choose an account to view:</p>
          <div className="sm:flex flex-col jusitfy-center mt-6">
            <form onSubmit={onSubmit} className="flex flex-col md:flex-row w-full md:w-full max-w-sm md:space-x-3 space-y-3 md:space-y-0 justify-center">
              <input
                type="text"
                name="account"
                placeholder={`example${suffix}`}
                onChange={(event) => setAccount(event.target.value)}
                className="rounded-lg border-transparent flex-1 appearance-none border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="flex-shrink-0 px-4 py-2 text-base font-semibold text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-200"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
