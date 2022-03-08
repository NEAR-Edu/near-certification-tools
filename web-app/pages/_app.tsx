/* eslint-disable react/jsx-props-no-spreading */
import '../styles/globals.scss';
import type { AppProps } from 'next/app';
import Script from 'next/script';

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />

      <Script strategy="lazyOnload">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', ${googleAnalyticsId});
        `}
      </Script>
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;

// Set Up Google Analytics With Next.JS (Using Next.JS Script Component)
// https://youtu.be/QAdtc7VWuNE
// https://github.com/jarrodwatts/portfolio/blob/master/src/pages/_app.tsx#L23-L37
