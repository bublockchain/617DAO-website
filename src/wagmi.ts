import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: '617 DAO',
  projectId: '139dda84e33099d5143ed5e94d3a9ad8',
  chains: [
    polygon,
  ],
  ssr: true,
});