/* eslint-disable @typescript-eslint/no-use-before-define */
import { BlockchainStreamOptions, Client, SignedBlock } from "@hiveio/dhive";
import { differenceInSeconds, sub } from "date-fns";
import EventEmitter from "events";

import { logger } from "./logger";
import type { Follow } from "./types";

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  // eslint-disable-next-line no-plusplus
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const addressList = [
  "https://api.openhive.network",
  "https://api.hive.blog",
  "https://techcoderx.com",
  "https://anyx.io",
  "https://api.deathwing.me",
  "https://hive-api.arcange.eu",
  "https://rpc.ecency.com",
  "https://hived.privex.io",
];

export function newClient(): Client {
  return new Client(shuffleArray(addressList), {
    timeout: 2000,
    failoverThreshold: 0,
  });
}

let client = newClient();

export function getClient(): Client {
  return client;
}

export function getNewClient(): Client {
  client = newClient();
  return getClient();
}

export function getBlockStream(
  opts: BlockchainStreamOptions & { ignoreEnd: boolean }
): EventEmitter {
  class MyEmitter extends EventEmitter {}
  const myEmitter = new MyEmitter();

  let currentBlockNumber = opts.from;

  let stream: NodeJS.ReadableStream | null = null; // = getClient().blockchain.getBlockStream(opts);

  const cleanUp = () => {
    if (stream) {
      stream.removeListener("error", errorHandler);
      stream.removeListener("data", dataHandler);
      stream.removeListener("end", endHandler);
    }
  };

  const listen = () => {
    if (!stream) {
      stream = getClient().blockchain.getBlockStream({ ...opts, from: currentBlockNumber });
    } else {
      cleanUp();
      stream = getNewClient().blockchain.getBlockStream({ ...opts, from: currentBlockNumber });
    }

    stream.addListener("data", dataHandler);
    stream.addListener("error", errorHandler);
    if (!opts.ignoreEnd) {
      stream.addListener("end", endHandler);
    }
  };

  const errorHandler = (err: Error) => {
    logger.error(err, "Recreating the stream");
    listen();
  };

  const dataHandler = (block: SignedBlock) => {
    if (currentBlockNumber) {
      myEmitter.emit("data", { ...block, block_num: currentBlockNumber });
      currentBlockNumber++;
    } else {
      logger.warn(`Current block number has an unexpected value ${currentBlockNumber}`);
      myEmitter.emit("data", block);
    }
  };

  const endHandler = () => {
    cleanUp();
    myEmitter.emit("end");
  };

  if (!currentBlockNumber) {
    getClient()
      .blockchain.getCurrentBlockNum()
      .then((num) => {
        currentBlockNumber = num;
        listen();
      });
  } else {
    listen();
  }

  return myEmitter;
}

export async function getFollowing(accountName = "podping"): Promise<Follow[]> {
  const [podping] = await client.database.getAccounts([accountName, "a", "blog", "100"]);
  const following: Follow[] = await client.call("condenser_api", "get_following", [podping.name]);
  logger.debug(following, `Fetched users ${accountName} is following`);

  return following;
}

export function getCurrentBlock(): Promise<[SignedBlock, number]> {
  return Promise.all([client.blockchain.getCurrentBlock(), client.blockchain.getCurrentBlockNum()]);
}

export async function getEstimatedBlockNumber(
  duration: Duration = { minutes: 15 }
): Promise<number> {
  const [current, currentNumber] = await getCurrentBlock();
  const startBlockNumber = 10;
  const earlier = await client.database.getBlock(startBlockNumber);

  const currentBlockTime = new Date(current.timestamp);
  const diff = differenceInSeconds(currentBlockTime, new Date(earlier.timestamp));
  const estimatedSecondsBetweenBlocks = Math.floor(diff / (currentNumber - startBlockNumber));
  const secondsBack = differenceInSeconds(currentBlockTime, sub(currentBlockTime, duration));

  return currentNumber - Math.floor(secondsBack / estimatedSecondsBetweenBlocks);
}
