// This page is visible at /certificate/j3h45kjh345
/*
See:
https://ogp.me/
https://www.linkedin.com/post-inspector/
https://cards-dev.twitter.com/validator
*/

import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { baseUrl } from '../../helpers/strings';

const title = 'I got certified on the NEAR blockchain!';
const description = 'View NEAR University certificates of any .near account';

function buildTwitterUrl(pngUrl: string) {
  // https://stevenwestmoreland.com/2018/07/creating-social-sharing-links-without-javascript.html
  const hashtags = ['NEAR', 'blockchain', 'NEARUniversity'];
  const via = 'NEARedu';
  const url = encodeURI(`https://twitter.com/intent/tweet?text=${title}&url=${pngUrl}&hashtags=${hashtags.join(',')}&via=${via}`);
  console.log({ url });
  return url;
}

function buildLinkedInUrl(pngUrl: string) {
  // https://stackoverflow.com/a/61583006/470749
  const url = encodeURI(`https://www.linkedin.com/sharing/share-offsite/?url=${pngUrl}`);
  console.log({ url });
  return url;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props
  const { tokenId } = context.query; // https://nextjs.org/docs/routing/dynamic-routes
  console.log({ tokenId });
  // TODO: In getServerSideProps, check for existence of cert of this tokenId, and ensure that it's valid. If does not exist or is invalid, return HTTP_ERROR_CODE_MISSING error.

  return {
    props: {
      tokenId,
    },
  };
};

function OpenGraphMetaData({ tokenId, pngUrl }: { tokenId: string; pngUrl: string }) {
  return (
    <Head>
      <meta property="og:url" content={pngUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={pngUrl} />
      <meta property="twitter:site" content="@NEARProtocol" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="/" />
      <meta property="twitter:url" content={`/certificate/${tokenId}`} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={pngUrl} />
    </Head>
  );
}

type CertificatePageProps = { tokenId: string };

const CertificatePage: NextPage<CertificatePageProps> = ({ tokenId }: CertificatePageProps) => {
  // https://nextjs.org/docs/routing/dynamic-routes
  const pngUrl = `${baseUrl}/api/cert/${tokenId}.png`;

  return (
    <>
      <OpenGraphMetaData tokenId={tokenId} pngUrl={pngUrl} />
      <Layout>
        <a href={`/api/cert/${tokenId}.svg`}>
          <img src={pngUrl} alt={`certificate ${tokenId}`} />
        </a>
        <div className="text-sm mt-2 ml-2">
          Share:{' '}
          <a href={buildTwitterUrl(pngUrl)} target="_blank" rel="noreferrer">
            <i className="fab fa-twitter-square not-italic text-sky-700 p-1" />
          </a>
          <a href={buildLinkedInUrl(pngUrl)} target="_blank" rel="noreferrer">
            <i className="fab fa-linkedin-in not-italic text-sky-700 p-1" />
          </a>
        </div>
      </Layout>
    </>
  );
};

export default CertificatePage;
