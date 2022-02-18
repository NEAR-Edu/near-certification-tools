// This page is visible at /certificate/j3h45kjh345
/*
See:
https://ogp.me/
https://www.linkedin.com/post-inspector/
https://cards-dev.twitter.com/validator
*/

import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { baseUrl } from '../../helpers/strings';

function buildTwitterUrl(pngUrl: string) {
  // https://stevenwestmoreland.com/2018/07/creating-social-sharing-links-without-javascript.html
  const text = 'I got certified on the NEAR blockchain!';
  const hashtags = ['NEAR', 'blockchain', 'NEARUniversity'];
  const via = 'NEARedu';
  const url = encodeURI(`https://twitter.com/intent/tweet?text=${text}&url=${pngUrl}&hashtags=${hashtags.join(',')}&via=${via}`);
  console.log({ url });
  return url;
}

function buildLinkedInUrl(pngUrl: string) {
  // https://stackoverflow.com/a/61583006/470749
  const url = encodeURI(`https://www.linkedin.com/sharing/share-offsite/?url=${pngUrl}`);
  console.log({ url });
  return url;
}

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   // https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props
//   // TODO: In getServerSideProps, check for existence of cert of this tokenId, and ensure that it's valid. If does not exist or is invalid, return HTTP_ERROR_CODE_MISSING error.
//   const { account } = context.query; // https://nextjs.org/docs/routing/dynamic-routes

//   // Pass data to the page via props
//   const props: PageProps = { };
//   return { props };
// };

// eslint-disable-next-line max-lines-per-function
const Certificate: NextPage = (...props) => {
  const router = useRouter();
  const { tokenId } = router.query; // https://nextjs.org/docs/routing/dynamic-routes  
  const data = tokenId;
  const pngUrl = `${baseUrl}/api/cert/${data}.png`;
  // eslint-disable-next-line react/destructuring-assignment
  console.log('************************', { data });
  return (
    <Layout>
      <Head>
        <meta property="og:url" content={`/api/cert/${data}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="I got certified with NEAR university" />
        <meta property="og:description" content="View NEAR University certificates of any .near account" />
        <meta property="og:image" content={`/api/cert/${data}.png`} />
        <meta property="twitter:site" content="@NEARProtocol" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="/" />
        <meta property="twitter:url" content={`/certificate/${data}`} />
        <meta name="twitter:title" content="I got certified with NEAR university" />
        <meta name="twitter:description" content="View NEAR University certificates of any .near account" />
        <meta name="twitter:image" content={`/api/cert/${data}.png`} />
      </Head>
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
  );
};
export async function getServerSideProps(context: any) {
  const { tokenId } = context.query;
  console.log('---------------------------', { tokenId });
  const url = `${baseUrl}/api/cert/${tokenId}`;
  console.log('++++++++++++++++++++++++++++++++++++++++', { url });
  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'image/png',
    },
  };
  console.log('++++++++++++++++++++++++++++++++++++++++', { requestOptions });
  const results = tokenId;
  const fetchRes = await fetch(url, requestOptions);
  console.log('+++++++++++++++++++++++++++++++++++++++++', { fetchRes });
  // const resJson = await fetchRes.json();
  // console.log('+++++++++++++++++++++', resJson);
  return {
    props: {
      children: results,
    },
  };
}
export default Certificate;
