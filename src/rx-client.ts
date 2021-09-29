import { fromEvent, Observable, from, concat, interval } from "rxjs";
import { switchMap, mergeMap, tap, withLatestFrom, takeUntil } from "rxjs/operators";

import { getBlockStream, getEstimatedBlockNumber, getFollowing } from "./hive";
import { logger } from "./logger";
import type {
  HiveBlock,
  OperationTuple,
  ProcessedBlockTransaction,
  ProcessedStream,
} from "./types";

type Blocknum = { blocknum: number };

function isBlocknum(val: unknown): val is Blocknum {
  return Object.prototype.hasOwnProperty.call(val, "blocknum");
}

/**
 * An RxJS observable that emits on matching matching operations. Each emission will contain information on the
 * containing block, as well as a list of url with the reasoning
 */
export function getTransactionStream$(
  durationOrBlocknum: Duration | { blocknum: number } = { minutes: 15 }
): Observable<ProcessedBlockTransaction> {
  return from(
    isBlocknum(durationOrBlocknum)
      ? Promise.resolve(durationOrBlocknum.blocknum)
      : getEstimatedBlockNumber(durationOrBlocknum)
  ).pipe(
    switchMap((estimatedBlockNumber) => {
      const blockStream = getBlockStream({
        from: estimatedBlockNumber,
        ignoreEnd: process.env.NODE_ENV === "production" || Boolean(process.env.IGNORE_END),
      });
      const data$ = fromEvent<HiveBlock>(blockStream, "data");
      const end$ = fromEvent(blockStream, "end");
      return data$.pipe(takeUntil(end$));
    }),
    tap((block) => logger.debug(`Processing ${block.block_num} - ${block.timestamp}`)),
    withLatestFrom(
      concat(from(getFollowing()), interval(120_000).pipe(mergeMap(() => getFollowing())))
    ),
    mergeMap(([block, followingList]) => {
      const b = block as HiveBlock;
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
          block_num: b.block_num,
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
