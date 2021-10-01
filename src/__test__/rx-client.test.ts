import { take } from "rxjs/operators";
// import type { SignedBlock } from "@hiveio/dhive";

import * as rxClient from "../rx-client";
import {
  getCurrentBlock,
  getBlockStream,
  getEstimatedBlockNumberWithRetry,
  getFollowingWithRetry,
} from "../hive";
// import type { TODO } from "../types";
import { mockBlock } from "../types";

jest.mock("../hive");

function waitUntil(isTrue: () => boolean, timeout = 1000) {
  const startedAt = Date.now();
  return new Promise<void>((resolve, reject) => {
    const runner = () => {
      if (isTrue()) {
        resolve();
      } else if (Date.now() - startedAt > timeout) {
        reject(new Error(`Waiting timed out after ${Date.now() - startedAt}ms`));
      } else {
        setTimeout(runner, 0);
      }
    };

    runner();
  });
}

describe("rx-client", () => {
  describe("block stream", () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const handlers = new Map<string, Function>();
    const obj = {
      // eslint-disable-next-line @typescript-eslint/ban-types
      on: (name: string, handler: Function) => {
        handlers.set(name, handler);
      },
      off: (name: string) => {
        handlers.delete(name);
      },
    };

    afterEach(() => {
      handlers.clear();
    });
    it("emits a for each transaction in a block", (done) => {
      expect.assertions(4);
      const orderedBlocks = [
        { auth: "podping.bbb", urlCount: 7 },
        { auth: "podping.aaa", urlCount: 4 },
      ];

      let count = 0;

      (getEstimatedBlockNumberWithRetry as jest.Mock).mockResolvedValue(1);
      (getCurrentBlock as jest.Mock).mockResolvedValue([{ block_id: "12" }, 1]);
      (getFollowingWithRetry as jest.Mock).mockResolvedValue([
        { follower: "a", following: "podping.aaa", what: "blog" },
        { follower: "b", following: "podping.bbb", what: "blog" },
      ]);
      (getBlockStream as jest.Mock).mockReturnValue(obj);

      rxClient
        .getTransactionStream$()
        .pipe(take(2))
        .subscribe({
          next(b) {
            expect(b).toHaveProperty("posting_auth", orderedBlocks[count].auth);
            expect(b.urls).toHaveLength(orderedBlocks[count].urlCount);
            count++;
          },
          complete() {
            done();
          },
          error: done,
        });

      waitUntil(() => handlers.has("data")).then(() => {
        handlers.get("data")?.(mockBlock());
      }, done);
    });

    it("emits filters out trasaction from non followers", (done) => {
      expect.assertions(2);
      const orderedBlocks = [{ auth: "podping.aaa", urlCount: 4 }];

      let count = 0;

      (getEstimatedBlockNumberWithRetry as jest.Mock).mockResolvedValue(1);
      (getCurrentBlock as jest.Mock).mockResolvedValue([{ block_id: "12" }, 1]);
      (getFollowingWithRetry as jest.Mock).mockResolvedValue([
        { follower: "a", following: "podping.aaa", what: "blog" },
      ]);
      (getBlockStream as jest.Mock).mockReturnValue(obj);

      rxClient
        .getTransactionStream$()
        .pipe(take(1))
        .subscribe({
          next(b) {
            expect(b).toHaveProperty("posting_auth", orderedBlocks[count].auth);
            expect(b.urls).toHaveLength(orderedBlocks[count].urlCount);
            count++;
          },
          complete() {
            done();
          },
          error: done,
        });

      waitUntil(() => handlers.has("data")).then(() => {
        handlers.get("data")?.(mockBlock());
      }, done);
    });

    it("recieves values until an 'end' event", (done) => {
      expect.assertions(4);
      const orderedBlocks = [
        { auth: "podping.bbb", urlCount: 7 },
        { auth: "podping.aaa", urlCount: 4 },
      ];

      let count = 0;

      (getEstimatedBlockNumberWithRetry as jest.Mock).mockResolvedValue(1);
      (getCurrentBlock as jest.Mock).mockResolvedValue([{ block_id: "12" }, 1]);
      (getFollowingWithRetry as jest.Mock).mockResolvedValue([
        { follower: "a", following: "podping.aaa", what: "blog" },
        { follower: "b", following: "podping.bbb", what: "blog" },
      ]);
      (getBlockStream as jest.Mock).mockReturnValue(obj);

      rxClient.getTransactionStream$().subscribe({
        next(b) {
          expect(b).toHaveProperty("posting_auth", orderedBlocks[count].auth);
          expect(b.urls).toHaveLength(orderedBlocks[count].urlCount);
          count++;
        },
        complete() {
          done();
        },
        error: done,
      });

      waitUntil(() => handlers.has("data") && handlers.has("end")).then(() => {
        handlers.get("data")?.(mockBlock());
        handlers.get("end")?.();
      }, done);
    });
  });
});
