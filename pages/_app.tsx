import "../styles/globals.css";
import type { AppProps } from "next/app";
import {
  ChainProvider,
  defaultTheme as cosmosKitTheme,
} from "@cosmos-kit/react";
import { ChakraProvider, useColorMode } from "@chakra-ui/react";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import theme from "../config/theme";
import { SignerOptions } from "@cosmos-kit/core";
import { chains, assets } from "chain-registry";
import { Chain } from "@chain-registry/types";
import { QueryClient, QueryClientProvider } from "react-query";
import Head from "next/head";

const customChains: Chain[] = [
  ...chains,
  {
    $schema: "../../chain.schema.json",
    chain_name: "iristestnet",
    status: "live",
    network_type: "testnet",
    website: "https://stargaze.zone/",
    pretty_name: "Irisnet Testnet",
    chain_id: "gon-irishub-1",
    bech32_prefix: "iaa",
    daemon_name: "starsd",
    node_home: "$HOME/.starsd",
    slip44: 118,
    fees: {
      fee_tokens: [
        {
          denom: "uiris",
          low_gas_price: 0.03,
          average_gas_price: 0.04,
          high_gas_price: 0.05,
        },
      ],
    },
    codebase: {
      git_repo: "https://github.com/public-awesome/stargaze",
      recommended_version: "v7.0.0",
      compatible_versions: ["v7.0.0"],
      cosmos_sdk_version: "0.45",
      tendermint_version: "0.34",
      cosmwasm_version: "0.28",
      cosmwasm_enabled: true,
      genesis: {
        genesis_url:
          "https://github.com/public-awesome/testnets/blob/main/elgafar-1/genesis/genesis.tar.gz",
      },
    },
    peers: {
      seeds: [],
      persistent_peers: [
        {
          id: "e31886cba90a06e165b0df18cc5c8ae015ecd23e",
          address: "209.159.152.82:26656",
          provider: "stargaze",
        },
        {
          id: "de00d2d65594b672469ecd65826a94ec1be80b9f",
          address: "208.73.205.226:26656",
          provider: "stargaze",
        },
      ],
    },
    apis: {
      rpc: [
        {
          address: "http://34.80.93.133:26657",
          provider: "Stargaze Foundation",
        },
      ],
      rest: [
        {
          address: "https://api.gon.irisnet.org",
          provider: "Stargaze Foundation",
        },
      ],
      grpc: [
        {
          address: "http://34.80.93.133:9090",
          provider: "Stargaze Foundation",
        },
      ],
    },
    explorers: [
      {
        kind: "ping.pub",
        url: "https://gon.ping.pub/iris",
        tx_page: "https://gon.ping.pub/iris/tx/${txHash}",
      },
    ],
  },
];

console.log(chains.find((c) => c.chain_name == "stargazetestnet"));
const qc = new QueryClient({});
function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const signerOptions: SignerOptions = {
    // signingStargate: (_chain: Chain) => {
    //   return getSigningCosmosClientOptions();
    // }
  };

  const { colorMode } = useColorMode();
  return (
    <ChakraProvider theme={cosmosKitTheme}>
      <ChainProvider
        chains={customChains}
        assetLists={assets}
        wallets={[...keplrWallets, ...cosmostationWallets, ...leapWallets]}
        walletConnectOptions={{
          signClient: {
            projectId: "a8510432ebb71e6948cfd6cde54b70f7",
            relayUrl: "wss://relay.walletconnect.org",
            metadata: {
              name: "CosmosKit Template",
              description: "CosmosKit dapp template",
              url: "https://docs.cosmoskit.com/",
              icons: [],
            },
          },
        }}
        wrappedWithChakra={true}
        signerOptions={signerOptions}
      >
        <QueryClientProvider client={qc}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </ChainProvider>
    </ChakraProvider>
  );
}

export default CreateCosmosApp;
