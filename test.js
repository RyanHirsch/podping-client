const { getTransactionStream$, getStream$ } = require("./dist/index");
const { interval, from, concat } = require("rxjs");
const { take, mergeMap } = require("rxjs/operators");

// getTransactionStream$({ blocknum: 57821679 })

// function getFoo() {
//   console.log("getting a foo!!");
//   return Promise.resolve("foo");
// }

// console.log("Started!");
// concat(from(getFoo()), interval(1000).pipe(mergeMap(() => getFoo())))
//   .pipe(take(10))

getStream$().subscribe({
  next(t) {
    console.log(t);
  },
  complete() {
    process.exit();
  },
});
