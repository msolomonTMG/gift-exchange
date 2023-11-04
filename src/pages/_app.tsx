import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { ToastContainer } from 'react-toastify';
import { Zilla_Slab } from "next/font/google";
import { api } from "~/utils/api";
import { EdgeStoreProvider } from "~/lib/edgestore";

import "~/styles/globals.css";
import 'react-toastify/dist/ReactToastify.css';
import Layout from "~/components/utils/Layout";
import { ThemeProvider } from "next-themes";

const font = Zilla_Slab({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <div className={font.className}>
      <SessionProvider session={session}>
        <ThemeProvider>
          <EdgeStoreProvider>
            <Layout>
              <ToastContainer />
              <Component {...pageProps} />
              <div id="portal" />
            </Layout>
          </EdgeStoreProvider>
        </ThemeProvider>
      </SessionProvider>
    </div>
  );
};

export default api.withTRPC(MyApp);
