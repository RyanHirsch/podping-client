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

async function retry<T>(fn: () => Promise<T>, max = 2): Promise<T> {
  let retryCount = 1;

  while (retryCount <= 2) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (err) {
      logger.warn((err as Error).message);
      logger.debug(`Retry failed on attempt ${retryCount}`);
      newClient();
    }
    retryCount++;
  }

  throw new Error(`Failed to complete after ${max} tries`);
}

export function newClient(): Client {
  const serverList = shuffleArray(addressList);
  logger.debug(`Creating client with ${serverList[0]}`);

  return new Client(serverList, {
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
  logger.debug("Generating a new client");
  return getClient();
}

export function getBlockStream(
  opts: BlockchainStreamOptions & { ignoreEnd: boolean }
): EventEmitter {
  class MyEmitter extends EventEmitter {}
  const myEmitter = new MyEmitter();

  let currentBlockNumber = opts.from;

  let stream: NodeJS.ReadableStream | null = null;

  if (opts.ignoreEnd) {
    logger.info("END events will be ignored due to configuration");
  }

  const cleanUp = () => {
    if (stream) {
      logger.debug("Cleaning up listeners");
      stream.removeListener("error", errorHandler);
      stream.removeListener("data", dataHandler);
      stream.removeListener("end", endHandler);
    }
  };

  const listen = () => {
    if (!stream) {
      logger.info("Creating blockchain stream");
      stream = client.blockchain.getBlockStream({ ...opts, from: currentBlockNumber });
    } else {
      logger.info("Recreating blockchain stream");
      cleanUp();
      stream = getNewClient().blockchain.getBlockStream({ ...opts, from: currentBlockNumber });
    }

    logger.debug("Attaching listeners");
    stream.addListener("data", dataHandler);
    stream.addListener("error", errorHandler);
    stream.addListener("end", endHandler);
  };

  const errorHandler = (err: Error) => {
    logger.error(err);
  };

  const dataHandler = (block: SignedBlock) => {
    logger.trace(block, "data recieved");

    if (currentBlockNumber) {
      myEmitter.emit("data", { ...block, block_num: currentBlockNumber });
      currentBlockNumber++;
    } else {
      logger.warn(`Current block number has an unexpected value ${currentBlockNumber}`);
      myEmitter.emit("data", block);
    }
  };

  const endHandler = () => {
    logger.trace("end recieved");

    if (opts.ignoreEnd) {
      listen();
    } else {
      cleanUp();
      myEmitter.emit("end");
    }
  };

  if (!currentBlockNumber) {
    getCurrentBlockNumWithRetry().then(
      (num: number) => {
        currentBlockNumber = num;
        listen();
      },
      (err) => {
        logger.error(err.message);
      }
    );
  } else {
    listen();
  }

  return myEmitter;
}

export async function getCurrentBlockNum(): Promise<number> {
  return client.blockchain.getCurrentBlockNum();
}
export async function getCurrentBlockNumWithRetry(): ReturnType<typeof getCurrentBlockNum> {
  return retry(() => getCurrentBlockNum());
}

export async function getFollowing(accountName = "podping"): Promise<Follow[]> {
  const [podping] = await client.database.getAccounts([accountName, "a", "blog", "100"]);
  const following: Follow[] = await client.call("condenser_api", "get_following", [podping.name]);
  logger.debug(
    { following: following.map((f) => f.following) },
    `Fetched users ${accountName} is following`
  );

  return following;
}
export async function getFollowingWithRetry(
  accountName = "podping"
): ReturnType<typeof getFollowing> {
  return retry(() => getFollowing(accountName));
}

export function getCurrentBlock(): Promise<[SignedBlock, number]> {
  return Promise.all([client.blockchain.getCurrentBlock(), client.blockchain.getCurrentBlockNum()]);
}
export async function getCurrentBlockWithRetry(): ReturnType<typeof getCurrentBlock> {
  return retry(() => getCurrentBlock());
}

export function getBlock(num?: number): Promise<SignedBlock> {
  return typeof num === "number"
    ? client.database.getBlock(num)
    : client.blockchain.getCurrentBlock();
}
export async function getBlockWithRetry(num?: number): ReturnType<typeof getBlock> {
  return retry(() => getBlock(num));
}

export async function getEstimatedBlockNumber(
  duration: Duration = { minutes: 15 }
): Promise<number> {
  const [current, currentNumber] = await getCurrentBlock();
  const startBlockNumber = 10;
  const earlier = await getBlock(startBlockNumber);

  const currentBlockTime = new Date(current.timestamp);
  const diff = differenceInSeconds(currentBlockTime, new Date(earlier.timestamp));
  const estimatedSecondsBetweenBlocks = Math.floor(diff / (currentNumber - startBlockNumber));
  const secondsBack = differenceInSeconds(currentBlockTime, sub(currentBlockTime, duration));

  return currentNumber - Math.floor(secondsBack / estimatedSecondsBetweenBlocks);
}
export async function getEstimatedBlockNumberWithRetry(
  duration: Duration = { minutes: 15 }
): ReturnType<typeof getEstimatedBlockNumber> {
  return retry(() => getEstimatedBlockNumber(duration));
}
