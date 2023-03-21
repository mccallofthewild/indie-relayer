"use client";

import Head from "next/head";
import {
  Box,
  Divider,
  Grid,
  Heading,
  Text,
  Stack,
  Container,
  Link,
  Button,
  Flex,
  Icon,
  useColorMode,
  useColorModeValue,
  Center,
  useToast,
  Select,
  Tbody,
  Td,
  Thead,
  Tr,
  Table,
  Th,
  Spinner,
  Progress,
} from "@chakra-ui/react";
import {
  BsArrowRepeat,
  BsFillMoonStarsFill,
  BsFillStopFill,
  BsFillSunFill,
} from "react-icons/bs";
import {
  Product,
  Dependency,
  WalletSection,
  SettingsModal,
} from "../components";
import { dependencies, products } from "../config";
import { useChain, useWallet } from "@cosmos-kit/react";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChainContext, ChainName } from "@cosmos-kit/core";
import { useQuery } from "react-query";
import {
  loadMatchingConnections,
  MatchingCxn,
} from "../helpers/loadMatchingCxns";
import { relay } from "../helpers/relay";

async function selectOptimalRpc(chainContext: ChainContext) {
  return (
    chainContext.chain.apis?.rpc?.find((a) =>
      a.provider?.toLowerCase().includes("notional")
    )?.address || (await chainContext.getRpcEndpoint())
  );
}

let isRunning = false;
export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode();
  const wallet = useWallet();
  // const chainA = useChain("juno");
  // const chainB = useChain("osmosis");
  const [chainAName, setChainAName] = useState("stargazetestnet");
  const [chainBName, setChainBName] = useState("iristestnet");
  const chainA = useChain(chainAName);
  const chainB = useChain(chainBName);
  // const cxnA = "connection-0";
  // const cxnB = "connection-1142";
  const [cxnA, setCxnA] = useState("connection-173");
  const [cxnB, setCxnB] = useState("connection-21");

  const [isRelaying, setIsRelaying] = useState(false);
  const stopFn = useRef<() => void>();

  const connections = useQuery({
    queryKey: [
      "connections",
      chainAName,
      chainBName,
      chainA.address,
      chainB.address,
    ],
    queryFn: async () => {
      if (!chainA.address || !chainB.address) return;
      const tmA = await Tendermint34Client.connect(
        await selectOptimalRpc(chainA)
      );
      const tmB = await Tendermint34Client.connect(
        await selectOptimalRpc(chainB)
      );

      return loadMatchingConnections(tmA, tmB, chainA.address, chainB.address);
    },
  });

  // run stop function on unmount using react hook
  useEffect(() => {
    return () => {
      stopFn.current?.();
    };
  }, []);

  const toast = useToast();

  const startRelaying = useCallback(
    (cxnA: string, cxnB: string) => {
      stopFn.current?.();
      setCxnA(cxnA);
      setCxnB(cxnB);
      setIsRelaying(true);
      console.log(chainA.address, chainB.address);
      // @ts-ignore
      window.wallet = wallet;
      if (!(chainA.address && chainB.address)) return console.log("no address");
      // if same return
      if (chainA.address === chainB.address) return console.log("same address");

      // @ts-ignore
      (async () => {
        // relay(
        //   await chainA.getOfflineSigner(),
        //   "https://rpc-juno-ia.cosmosia.notional.ventures:443",
        //   "https://rpc-osmosis-ia.cosmosia.notional.ventures:443",
        //   chainA.address!,
        //   chainB.address!,
        //   chainA.chain.fees!.fee_tokens[0].denom,
        //   chainB.chain.fees!.fee_tokens[0].denom,
        //   cxnA,
        //   cxnB,
        //   chainA.address!,
        //   chainB.address!
        // );
        const config = await relay(
          await chainA.getOfflineSigner(),
          await chainB.getOfflineSigner(),
          await selectOptimalRpc(chainA),
          await selectOptimalRpc(chainB),
          chainA.address!,
          chainB.address!,
          chainA.chain.fees!.fee_tokens[0].denom,
          chainB.chain.fees!.fee_tokens[0].denom,
          cxnA,
          cxnB,
          chainA.address!,
          chainB.address!,
          0,
          0,
          {
            warn(msg, meta) {
              toast({
                title: msg,
                description: JSON.stringify(meta, null, 2)?.substring(0, 100),
                status: "warning",
                duration: 5000,
                isClosable: true,
              });
              console.warn(msg, meta);
              return this;
            },
            info(msg, meta) {
              toast({
                title: msg,
                description: JSON.stringify(meta, null, 2)?.substring(0, 100),
                status: "info",
                duration: 5000,
                isClosable: true,
              });
              console.info(msg, meta);
              return this;
            },
            error(msg, meta) {
              toast({
                title: msg,
                description: JSON.stringify(meta, null, 2)?.substring(0, 100),
                status: "error",
                duration: 5000,
                isClosable: true,
              });
              console.error(msg, meta);
              return this;
            },
            verbose(msg, meta) {
              toast({
                title: msg,
                description: JSON.stringify(meta, null, 2)?.substring(0, 100),
                status: "info",
                duration: 5000,
                isClosable: true,
              });
              console.log(msg, meta);
              return this;
            },
            debug(msg, meta) {
              toast({
                title: msg,
                description: JSON.stringify(meta, null, 2)?.substring(0, 100),
                status: "info",
                duration: 5000,
                isClosable: true,
              });
              console.log(msg, meta);
              return this;
            },
          }
        );
        stopFn.current = () => {
          config.stop();
          setIsRelaying(false);
          setCxnA("");
          setCxnB("");
        };
      })();
    },
    [chainA, chainB, cxnA, cxnB, chainA.address, chainB.address, wallet]
  );

  const ConnectionRow = ({ connection }: { connection: MatchingCxn }) => {
    return (
      <Tr key={connection.cxnA + "/" + connection.cxnB}>
        <Td>
          {connection.cxnA + "/" + connection.cxnB}
          <br />
          <Text fontSize="xs" color="gray.500">
            {connection.cxnA + " -> " + connection.cxnB}
          </Text>
        </Td>
        {/* <Td>
          {connection.arbitraryPriority
            ? Math.round(
                (Date.now() - connection.arbitraryPriority) / 1000 / 60
              )
            : "never"}
        </Td> */}
        {/* <Td>{connection.packetsPending}</Td> */}
        <Td>
          <Button
            onClick={() => {
              const isActive =
                cxnA == connection.cxnA &&
                cxnB == connection.cxnB &&
                isRelaying;
              if (!isActive) startRelaying(connection.cxnA, connection.cxnB);
              else stopFn.current?.();
            }}
          >
            {cxnA == connection.cxnA &&
            cxnB == connection.cxnB &&
            isRelaying ? (
              //  stop icon
              <Icon as={BsFillStopFill} />
            ) : (
              <Icon as={BsArrowRepeat} />
            )}
          </Button>
        </Td>
      </Tr>
    );
  };
  return (
    <Container maxW="5xl" py={10}>
      <Head>
        <title>Indie Relayer</title>
        <meta name="description" content="Generated by create cosmos app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex justifyContent="end" mb={4}>
        <Button variant="outline" px={0} onClick={toggleColorMode}>
          <Icon
            as={colorMode === "light" ? BsFillMoonStarsFill : BsFillSunFill}
          />
        </Button>
      </Flex>
      <Box textAlign="center">
        <Heading
          as="h1"
          fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
          fontWeight="extrabold"
          mb={3}
          // fontFamily="lulo-one"
        >
          INDIE RELAYER
        </Heading>
        <Heading
          as="h2"
          fontWeight="bold"
          fontSize={{ base: "1xl", sm: "1xl", md: "3xl" }}
        >
          {/* <Text as="span">Welcome to</Text> */}
          <Text
            as="span"
            color={useColorModeValue("primary.500", "primary.200")}
          >
            IBC without the Middleman
          </Text>
        </Heading>
      </Box>
      {/* Headings for each wallet selection: Chain A an Chain B */}
      <Box mt={10}>
        <Grid
          // i want a 2x2 grid on desktop, but a 1x4 grid on mobile
          templateColumns={{
            md: "repeat(2, 1fr)",
          }}
          gap={8}
          mb={14}
        >
          <Box>
            <Heading
              as="h2"
              fontSize={{ base: "1xl", sm: "2xl", md: "3xl" }}
              fontWeight="bold"
              mb={3}
              textAlign="center"
            >
              <Text as="span">CHAIN A</Text>
            </Heading>
            <WalletSection
              storageKey="chainA"
              onChainChange={(chainName) => {
                setChainAName(chainName);
              }}
            />
          </Box>
          <Box>
            <Heading
              as="h2"
              fontSize={{ base: "1xl", sm: "2xl", md: "3xl" }}
              fontWeight="bold"
              mb={3}
              textAlign="center"
            >
              <Text as="span">CHAIN B</Text>
            </Heading>
            <WalletSection
              storageKey="chainB"
              onChainChange={(chainName) => {
                setChainBName(chainName);
              }}
            />
          </Box>
        </Grid>
        <Box>
          {/* infinite chakra horizontal progress indicator */}
          <Progress
            size="xs"
            isIndeterminate
            colorScheme="primary"
            display={isRelaying ? "block" : "none"}
          />
        </Box>
        <Box>
          <Table variant="simple" size="sm" mt={4}>
            <Thead>
              <Tr>
                <Th>Connection</Th>
                {/* <Th>Minutes Ago</Th> */}
                {/* <Th>Packets Pending</Th> */}
                <Th>Relay</Th>
              </Tr>
            </Thead>
            <Tbody>
              {connections.data?.map((connection) => (
                <ConnectionRow key={connection.cxnA} connection={connection} />
              ))}
            </Tbody>
          </Table>
        </Box>
        {/* padding */}
        <Box mt={10} />
      </Box>
      <Grid
        templateColumns={{
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        gap={8}
        mb={14}
      >
        {products.map((product) => (
          <Product key={product.title} {...product}></Product>
        ))}
      </Grid>
      <Grid templateColumns={{ md: "1fr 1fr" }} gap={8} mb={20}>
        {dependencies.map((dependency) => (
          <Dependency key={dependency.title} {...dependency}></Dependency>
        ))}
      </Grid>
      <Box mb={3}>
        <Divider />
      </Box>
      <Stack
        isInline={true}
        spacing={1}
        justifyContent="center"
        opacity={0.5}
        fontSize="sm"
      >
        <Text>Built with</Text>
        <Link
          href="https://cosmology.tech/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cosmology
        </Link>
      </Stack>
    </Container>
  );
}
