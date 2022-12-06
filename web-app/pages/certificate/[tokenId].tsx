/* eslint-disable canonical/filename-match-regex */
// This page is visible at /certificate/j3h45kjh345
/*
See:
https://ogp.me/
https://www.linkedin.com/post-inspector/
https://cards-dev.twitter.com/validator
*/

import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link'; // https://nextjs.org/docs/api-reference/next/link
import ExplorerAccountLink from '../../components/ExplorerAccountLink';
import Layout from '../../components/Layout';
import { baseUrl } from '../../helpers/strings';
import { fetchCertificateDetails } from '../api/cert/[imageFileName]';

const title = 'I got certified on the NEAR blockchain!';
const description = 'View NEAR University certificates of any .near account';
// const certificateUrl = 'https://weak-dog-93.loca.lt/certificate/103216412152497cb6c193162a27c49h';
function buildTwitterUrl(certificateUrl: string) {
  // https://stevenwestmoreland.com/2018/07/creating-social-sharing-links-without-javascript.html
  const hashtags = ['NEAR', 'blockchain', 'NEARUniversity'];
  const via = 'NEARUniversity';
  const url = encodeURI(`https://twitter.com/intent/tweet?text=${title}&url=${certificateUrl}&hashtags=${hashtags.join(',')}&via=${via}`);
  console.log({ url });
  return url;
}

function buildLinkedInUrl(certificateUrl: string) {
  // https://stackoverflow.com/a/61583006/470749
  const url = encodeURI(`https://www.linkedin.com/sharing/share-offsite/?url=${certificateUrl}&title=${title}&summary=${description}`);
  console.log({ url });
  return url;
}

function OpenGraphMetaData({ pngUrl, certificateUrl }: { pngUrl: string; certificateUrl: string }) {
  return (
    <Head>
      <meta property="og:url" content={certificateUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={pngUrl} />
      <meta property="twitter:site" content="@NEARProtocol" />
      <meta name="twitter:card" content="summary" />
      <meta property="twitter:domain" content="/" />
      <meta property="twitter:url" content={pngUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={pngUrl} />
      <meta property="og:image:width" content="1080" />
      <meta property="og:image:height" content="1080" />
    </Head>
  );
}

type CertificatePageProps = {
  details: {
    tokenId: string;
    accountName: string;
  };
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { tokenId } = context.query; // https://nextjs.org/docs/routing/dynamic-routes
  const castingTokenId: string = tokenId as string;
  const details = await fetchCertificateDetails(castingTokenId);

  if (!details) {
    return {
      notFound: true, // https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props#notfound
    };
  }

  return {
    props: {
      details,
    },
  };
};

const CertificatePage: NextPage<CertificatePageProps> = ({ details }: CertificatePageProps) => {
  // https://nextjs.org/docs/routing/dynamic-routes
  const { tokenId, accountName } = details;
  const pngUrl = `${baseUrl}/api/cert/${tokenId}.png`;
  console.log(pngUrl);
  const certificateUrl = `${baseUrl}/certificate/${tokenId}`;

  return (
    <>
      <OpenGraphMetaData pngUrl={pngUrl} certificateUrl={certificateUrl} />
      <Layout>
        <a href={`/api/cert/${tokenId}.svg`} className="md:max-w-lg lg:max-w-2xl">
          <img src={pngUrl} alt={`certificate ${tokenId}`} />
        </a>
        <div className="text-xl mt-2 ml-2">
          Share:{' '}
          <a href={buildTwitterUrl(certificateUrl)} target="_blank" rel="noreferrer">
            <i className="fab fa-twitter-square not-italic text-sky-700 p-1" />
          </a>
          <a href={buildLinkedInUrl(certificateUrl)} target="_blank" rel="noreferrer">
            <i className="fab fa-linkedin-in not-italic text-sky-700 p-1" />
          </a>
        </div>
        <div className="mt-5">
          <Link href={`/account/${accountName}`}>
            <a href={`/account/${accountName}`} className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
              View all certificates for {accountName}
            </a>
          </Link>
        </div>
        <div className="mt-5">
          <ExplorerAccountLink accountId={accountName} />
        </div>
      </Layout>
    </>
  );
};

export default CertificatePage;
