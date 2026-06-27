import "../styles/global.css";
import Head from "next/head";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>MovieMatch — Movie Recommendations</title>
        <meta
          name="description"
          content="Find movies similar to your favorites with AI-powered recommendations and summaries."
        />
        <meta name="theme-color" content="#ede8e2" />
      </Head>
      <div className={inter.className}>
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;
