/* eslint-disable @next/next/no-page-custom-font */
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
    <Head>
    <title>Where should I eat? | whereshouldieat.app</title>
    <meta
      name='viewport'
      content='width=device-width, initial-scale=1'
    ></meta>
    <meta
      property='og:description'
      content="Put in where you are and what you're craving, and we'll tell you where to eat."
    />
    <meta
      name='description'
      content="Put in where you are and what you're craving, and we'll tell you where to eat."
    />
    <meta property='og:title' content='Where should I eat? | whereshouldieat.app' key='title' />
    <meta
      property='og:image'
      content={
        '/jordan.webp'
      }
    />
    <meta property='og:url' content={'https://whereshouldieat.app'} />
    <meta name='twitter:card' content='summary_large_image'></meta>
    <meta name='twitter:site' content='@jordantwells42' />
    <meta name='twitter:creator' content='@jordantwells42' />
    <meta name='twitter:title' content='Where should I eat? | whereshouldieat.app' />
    <meta
      name='twitter:description'
      content="Put in where you are and what you're craving, and we'll tell you where to eat."
    />
    <meta
      name='twitter:image'
      content='/jordan.webp'
    />
    <link rel="canonical" href={'https://whereshouldieat.app'} />
    <script type='application/ld+json'>{`
{
"@context": "https://schema.org/",
"@type": "Person",
"name": "Jordan Wells",
"url": "https://jordantwells.com",
"image": "",
"sameAs": [
"https://www.linkedin.com/in/jordantwells/",
"https://github.com/jordantwells42"
],
"jobTitle": "Student",
"worksFor": {
"@type": "Organization",
"name": "University of Texas at Austin"
}  
}
`}</script>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/logo.svg" />
  </Head>
  <Component {...pageProps} />
  </>
  );
}

export default MyApp;
