import { getStream$ } from "./rx-client";

(async function main() {
  (await getStream$({ minutes: 5 })).subscribe(console.log);
})();
