import { Client, SignedBlock } from "@hiveio/dhive";
import { differenceInSeconds, sub } from "date-fns";
import { logger } from "./logger";
import type { Follow } from "./types";

export const client = new Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.openhive.network",
]);

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
