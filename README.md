# podping-client

A client for reading from the Hive blockchain and pulling out [podping.cloud](https://podping.cloud/) transactions. This is designed to only work under node, but should be able to support the browser with changes if the need arises.

This client produces RxJS observables but that can be completely transparent to you as a consumer. You simply need to import/require the `*Stream$` function, call it with a duration (hours, minutes, seconds back to start checking the blockchain from), and call `.subscribe` to get events.

## Install

```sh
yarn add podping-client
```

```sh
npm install podping-client
```

## Usage

```js
const { getTransactionStream$ } = require("podping-client");

// Get a RxJS stream of transactions starting from 5 minutes ago
// Once subscribed, the callback will be called for every transaction
getTransactionStream$({ minutes: 5 }).subscribe((block) => {
  console.log(block);
  // {
  //   blocktime: '2021-09-13T15:04:54',
  //   block_id: '036bb5f43b77f874a0cd216d4192a127752ab778',
  //   version: '0.3',
  //   num_urls: 6,
  //   reason: 'feed_update',
  //   urls: [
  //     'https://feeds.buzzsprout.com/1363222.rss',
  //     'https://feeds.buzzsprout.com/4442.rss',
  //     'https://feeds.buzzsprout.com/1724216.rss',
  //     'https://feeds.buzzsprout.com/1826031.rss',
  //     'https://feeds.buzzsprout.com/1823965.rss',
  //     'https://feeds.buzzsprout.com/1848745.rss'
  //   ]
  // }
});
```

```js
const { getStream$ } = require("podping-client");

// Get a RxJS stream of urls starting from 15 minutes ago (default)
// Once subscribed, the callback will be called for every url
getStream$().subscribe((block) => {
  console.log(block);
  // {
  //   blocktime: '2021-09-13T15:04:54',
  //   block_id: '036bb5f43b77f874a0cd216d4192a127752ab778',
  //   version: '0.3',
  //   reason: 'feed_update',
  //   url: 'https://feeds.buzzsprout.com/1363222.rss'
  // }
});
```
