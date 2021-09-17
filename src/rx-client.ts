import type { SignedBlock } from "@hiveio/dhive";
import { fromEvent, Observable, from } from "rxjs";
import { switchMap, mergeMap, tap, withLatestFrom } from "rxjs/operators";

import { client, getEstimatedBlockNumber, getFollowing } from "./hive";
import { logger } from "./logger";
import type { OperationTuple, ProcessedBlockTransaction, ProcessedStream } from "./types";

/**
 * An RxJS observable that emits on matching matching operations. Each emission will contain information on the
 * containing block, as well as a list of url with the reasoning
 */
export function getTransactionStream$(
  duration: Duration = { minutes: 15 }
): Observable<ProcessedBlockTransaction> {
  let blockNumber = 0;
  return from(getEstimatedBlockNumber(duration)).pipe(
    switchMap((estimatedBlockNumber) => {
      blockNumber = estimatedBlockNumber;
      return fromEvent(client.blockchain.getBlockStream({ from: estimatedBlockNumber }), "data");
    }),
    tap((block) =>
      logger.debug(
        `Processing ${(block as SignedBlock).block_id} - ${(block as SignedBlock).timestamp}`
      )
    ),
    withLatestFrom(getFollowing()),
    mergeMap(([block, followingList]) => {
      const b = block as SignedBlock;
      const thisBlock = blockNumber;
      blockNumber += 1;
      const followingNames = followingList.map((f) => f.following);
      return b.transactions
        .flatMap((trans) => {
          return trans.operations as OperationTuple[];
        })
        .filter(
          ([name, payload]) =>
            name === "custom_json" &&
            payload.id === "podping" &&
            Array.isArray(payload.required_posting_auths) &&
            followingNames.some((f) => payload.required_posting_auths.includes(f))
        )
        .map<ProcessedBlockTransaction>(([, payload]) => ({
          blocktime: new Date(`${b.timestamp}Z`),
          block_id: b.block_id,
          block_num: thisBlock,
          payload_id: payload.id,
          posting_auth: payload.required_posting_auths.find((auth) =>
            followingNames.includes(auth)
          ),
          ...JSON.parse(payload.json),
        }));
    })
  );
}

/**
 * An RxJS observable that emits on each url of a matching matching operations. Each emission will contain
 * a single url as well as information on the containing block and reasoning
 */
export function getStream$(duration: Duration = { minutes: 15 }): Observable<ProcessedStream> {
  return getTransactionStream$(duration).pipe(
    mergeMap(({ urls, ...rest }) =>
      urls.map((url) => ({
        url,
        ...rest,
      }))
    )
  );
}
