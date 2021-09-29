const { getTransactionStream$, getStream$ } = require("./dist/index");
const { interval, from, concat } = require("rxjs");
const { take, mergeMap } = require("rxjs/operators");

const stream = getTransactionStream$({ blocknum: 57821679 });
// const stream = getStream$()

// function getFoo() {
//   console.log("getting a foo!!");
//   return Promise.resolve("foo");
// }

// const stream = concat(from(getFoo()), interval(1000).pipe(mergeMap(() => getFoo())))
//   .pipe(take(10))

console.log("Started!");
stream.subscribe({
  next(t) {
    console.log(t.block_num);
  },
  complete() {
    process.exit();
  },
});
