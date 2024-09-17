import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import Navbar from '../../layout/navbar/navbar';
import { useState } from 'react';
import { config } from '../wagmi';
import { UserProvider } from '../../components/ui/UserProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const [opened, setOpened] = useState(false)
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <UserProvider>
          <RainbowKitProvider modalSize="compact" theme={darkTheme({accentColor: '#d00404',})}>
            <Navbar setopened={setOpened}/>
            <Component {...pageProps} />
          </RainbowKitProvider>
        </UserProvider>
      </QueryClientProvider>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </WagmiProvider>
  );
}

export default MyApp;
