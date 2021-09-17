const { getTransactionStream$ } = require("./dist/index");
const { take } = require("rxjs/operators");

getTransactionStream$()
  .pipe(take(1))
  .subscribe({
    next(t) {
      console.log(t.blocktime.toString());
      console.log(t);
    },
    complete() {
      process.exit();
    },
  });
