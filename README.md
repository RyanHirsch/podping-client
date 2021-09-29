# podping-client

A client for reading from the Hive blockchain and pulling out [podping.cloud](https://podping.cloud/) transactions. This is designed to only work under node, but should be able to support the browser with changes if the need arises.

This client produces RxJS observables but that can be completely transparent to you as a consumer. You simply need to import/require the `*Stream$` function, call it with a duration (hours, minutes, seconds back to start checking the blockchain from) or starting block number, and call `.subscribe` to get events.

This package is also using `pino` for logging and the log level can be configured via `process.env.LOG`, by default `warn` level logging will be produced for `NODE_ENV=production` and `info` for all other environments.

## Install

```sh
yarn add podping-client
```

```sh
npm install podping-client
```

## Usage

When an error or end event occurs with the blockchain stream, it will attempt to recreate the stream transparently for the consumer if the following evaluates to `true`

```js
process.env.NODE_ENV === "production" || Boolean(process.env.IGNORE_END),
```

```js
const { getTransactionStream$ } = require("podping-client");

// Get a RxJS stream of transactions starting from 5 minutes ago
// Once subscribed, the callback will be called for every transaction
getTransactionStream$({ minutes: 5 }).subscribe((block) => {
  console.log(block);
  // {
  //   blocktime: 2021-09-29T14:03:24.000Z,
  //   block_id: '0372b4b6a33995e35427d4a4dec9ae4132981550',
  //   block_num: 57849014,
  //   payload_id: 'podping',
  //   posting_auth: 'podping.aaa',
  //   version: '0.3',
  //   num_urls: 5,
  //   reason: 'feed_update',
  //   urls: [
  //     'https://feeds.buzzsprout.com/1842728.rss',
  //     'https://feeds.buzzsprout.com/1588819.rss',
  //     'https://feeds.buzzsprout.com/265419.rss',
  //     'https://feeds.buzzsprout.com/1710223.rss',
  //     'https://feeds.buzzsprout.com/1776249.rss'
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
  //   url: 'https://media.rss.com/painintopurpose/feed.xml',
  //   blocktime: 2021-09-29T14:04:30.000Z,
  //   block_id: '0372b4ccc636fd90229fc88212ea29bf4d30f482',
  //   block_num: 57849036,
  //   payload_id: 'podping',
  //   posting_auth: 'podping.aaa',
  //   version: '0.3',
  //   num_urls: 4,
  //   reason: 'feed_update'
  // }
  // {
  //   url: 'https://feeds.buzzsprout.com/1117766.rss',
  //   blocktime: 2021-09-29T14:04:30.000Z,
  //   block_id: '0372b4ccc636fd90229fc88212ea29bf4d30f482',
  //   block_num: 57849036,
  //   payload_id: 'podping',
  //   posting_auth: 'podping.aaa',
  //   version: '0.3',
  //   num_urls: 4,
  //   reason: 'feed_update'
  // }
  // {
  //   url: 'https://feeds.buzzsprout.com/1830336.rss',
  //   blocktime: 2021-09-29T14:04:30.000Z,
  //   block_id: '0372b4ccc636fd90229fc88212ea29bf4d30f482',
  //   block_num: 57849036,
  //   payload_id: 'podping',
  //   posting_auth: 'podping.aaa',
  //   version: '0.3',
  //   num_urls: 4,
  //   reason: 'feed_update'
  // }
  // {
  //   url: 'https://media.rss.com/tes6071/feed.xml',
  //   blocktime: 2021-09-29T14:04:30.000Z,
  //   block_id: '0372b4ccc636fd90229fc88212ea29bf4d30f482',
  //   block_num: 57849036,
  //   payload_id: 'podping',
  //   posting_auth: 'podping.aaa',
  //   version: '0.3',
  //   num_urls: 4,
  //   reason: 'feed_update'
  // }
});
```
