import { Client, SignedBlock } from "@hiveio/dhive";
import { differenceInSeconds, sub } from "date-fns";
import { fromEvent, Observable } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";
import type { Follower, OperationTuple, TODO } from "./types";

const client = new Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.openhive.network",
]);

export async function getStream$(duration: Duration = { minutes: 15 }): Promise<Observable<TODO>> {
  const [podping] = await client.database.getAccounts(["podping", "a", "blog", "100"]);
  const followers: Follower[] = await client.call("condenser_api", "get_following", [podping.name]);

  console.log(followers);

  const [current, currentNumber] = await Promise.all([
    client.blockchain.getCurrentBlock(),
    client.blockchain.getCurrentBlockNum(),
  ]);

  const startBlockNumber = 10;
  const earlier = await client.database.getBlock(startBlockNumber);

  const currentBlockTime = new Date(current.timestamp);
  const diff = differenceInSeconds(currentBlockTime, new Date(earlier.timestamp));
  const estimatedSecondsBetweenBlocks = Math.floor(diff / (currentNumber - startBlockNumber));
  const secondsBack = differenceInSeconds(currentBlockTime, sub(currentBlockTime, duration));

  const estimatedBlockNumber =
    currentNumber - Math.floor(secondsBack / estimatedSecondsBetweenBlocks);

  console.log("Latest", current.timestamp);
  console.log("Guess", (await client.database.getBlock(estimatedBlockNumber)).timestamp);

  const stream = client.blockchain.getBlockStream({ from: estimatedBlockNumber });
  return fromEvent(stream, "data").pipe(
    tap((block) =>
      console.log(
        `Processing ${(block as SignedBlock).block_id} - ${(block as SignedBlock).timestamp}`
      )
    ),
    mergeMap((block) => {
      const b = block as SignedBlock;
      return b.transactions
        .flatMap((trans) => trans.operations as OperationTuple[])
        .filter(
          ([name, payload]) =>
            name === "custom_json" &&
            payload.id === "podping" &&
            Array.isArray(payload.required_posting_auths) &&
            followers.some((f) => payload.required_posting_auths.includes(f.following))
        )
        .map(([, payload]) => ({
          blocktime: b.timestamp,
          block_id: b.block_id,
          ...JSON.parse(payload.json),
        }));
    })
  );
}
