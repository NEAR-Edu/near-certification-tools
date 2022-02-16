// This page is visible at /certificate/j3h45kjh345
/*
See:
https://ogp.me/
https://www.linkedin.com/post-inspector/
https://cards-dev.twitter.com/validator
*/

import type { NextPage } from 'next';
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

const Certificate: NextPage = () => {
  const router = useRouter();
  const { tokenId } = router.query; // https://nextjs.org/docs/routing/dynamic-routes

  console.log({ tokenId });
  const pngUrl = `${baseUrl}/api/cert/${tokenId}.png`;

  return (
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
  );
};

export default Certificate;
