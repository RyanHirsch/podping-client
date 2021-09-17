import { Client, SignedBlock } from "@hiveio/dhive";
import { differenceInSeconds, sub } from "date-fns";
import { logger } from "./logger";
import type { Follow } from "./types";

function shuffleArray<T>(array: T[]): void {
  // eslint-disable-next-line no-plusplus
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const addressList = [
  "https://api.openhive.network",
  "https://api.hive.blog",
  "https://hive.roelandp.nl",
  "https://techcoderx.com",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.deathwing.me",
  "https://hive-api.arcange.eu",
  "https://rpc.ecency.com",
  "https://hived.privex.io",
];
shuffleArray(addressList);

export const client = new Client(addressList);

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
