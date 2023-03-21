import { RelayedHeights } from "@confio/relayer/build/lib/link";
import { OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { doCheckAndRelayPrivate } from "./doCheckAndRelayPrivate";
import { Decimal } from "@cosmjs/math";
import { IbcClient, Link as IbcLink, Logger } from "@confio/relayer/build";

export async function relay(
  offlineSignerA: OfflineSigner,
  offlineSignerB: OfflineSigner,
  rpcA: string,
  rpcB: string,
  addrA: string,
  addrB: string,
  feeDenomA: string,
  feeDenomB: string,
  cxnA: string,
  cxnB: string,
  /// sender whose packets to relay on chain A
  senderA: string,
  /// sender whose packets to relay on chain B
  senderB: string,
  initHeightA?: number,
  initHeightB?: number,
  logger?: Logger
) {
  // after each line, console.log what it just did. then console log applicable data
  console.log("relay starting");
  const tmA = await Tendermint34Client.connect(rpcA);
  const tmB = await Tendermint34Client.connect(rpcB);

  if (initHeightA == undefined) {
    const abciA = await tmA.abciInfo();
    console.table(abciA);
    initHeightA = abciA.lastBlockHeight! - 50_000;
  }
  if (initHeightB == undefined) {
    const abciB = await tmB.abciInfo();
    initHeightB = abciB.lastBlockHeight! - 50_000;
  }
  const link = await IbcLink.createWithExistingConnections(
    await IbcClient.connectWithSigner(rpcA, offlineSignerA, addrA, {
      // @ts-ignore
      gasPrice: new GasPrice(Decimal.fromUserInput("0.025", 3), feeDenomA),
      logger,
    }),
    await IbcClient.connectWithSigner(rpcB, offlineSignerB, addrB, {
      // @ts-ignore
      gasPrice: new GasPrice(Decimal.fromUserInput("0.025", 3), feeDenomB),
      logger,
    }),
    cxnA,
    cxnB,
    logger
  );

  let relayFrom: RelayedHeights = {
    packetHeightA: initHeightA,
    packetHeightB: initHeightB,
    ackHeightA: initHeightA,
    ackHeightB: initHeightB,
  };
  let timeout: ReturnType<typeof setTimeout>;
  let running = true;
  const run = async () => {
    const out = await doCheckAndRelayPrivate(
      link,
      relayFrom,
      senderA,
      senderB,
      tmA,
      tmB,
      1000000000,
      1000000000,
      logger!
    );
    relayFrom = out.heights;
    console.log(out.info);
    console.log("sleeping for 6 seconds");
    if (!running) return;
    timeout = setTimeout(run, 6_000);
  };
  run();
  return {
    stop() {
      running = false;
      clearTimeout(timeout);
    },
  };
}
