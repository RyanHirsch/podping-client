const { getTransactionStream$ } = require("./dist/index");

getTransactionStream$().subscribe((t) => {
  console.log(t.blocktime.toString());
  console.log(t);
});
