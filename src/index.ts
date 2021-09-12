import { Client, OperationName, SignedBlock, VirtualOperationName } from "@hiveio/dhive";
import { differenceInSeconds, sub } from "date-fns";
import { fromEvent } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";

const client = new Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.openhive.network",
]);

(async function main() {
  const [podping] = await client.database.getAccounts(["podping", "a", "blog", "100"]);
  const followers: Follower[] = await client.call("condenser_api", "get_following", [podping.name]);

  // for await (const block of client.blockchain.getBlocks()) {
  //   console.log(`New block, id: ${block.block_id}`);
  //   console.log(`  transactions: ${block.transactions.length}`);
  // }

  console.log(followers);

  const [current, currentNumber] = await Promise.all([
    client.blockchain.getCurrentBlock(),
    client.blockchain.getCurrentBlockNum(),
  ]);

  const startBlockNumber = 10;
  const earlier = await client.database.getBlock(startBlockNumber);

  const currentBlockTime = new Date(current.timestamp);
  const diff = differenceInSeconds(currentBlockTime, new Date(earlier.timestamp));
  const estimatedSecondsBetweenBlocks = Math.floor(diff / (currentNumber - startBlockNumber));
  const secondsBack = differenceInSeconds(currentBlockTime, sub(currentBlockTime, { minutes: 15 }));

  const estimatedBlockNumber =
    currentNumber - Math.floor(secondsBack / estimatedSecondsBetweenBlocks);

  console.log("Latest", current.timestamp);
  console.log("Guess", (await client.database.getBlock(estimatedBlockNumber)).timestamp);

  const stream = client.blockchain.getBlockStream({ from: estimatedBlockNumber });
  fromEvent(stream, "data")
    .pipe(
      tap((block) =>
        console.log(
          `Processing ${(block as SignedBlock).block_id} - ${(block as SignedBlock).timestamp}`
        )
      ),
      mergeMap((block) => {
        const b = block as SignedBlock;
        return b.transactions
          .flatMap((trans) => trans.operations as OperationTuple[])
          .filter(
            ([name, payload]) =>
              name === "custom_json" &&
              payload.id === "podping" &&
              Array.isArray(payload.required_posting_auths) &&
              followers.some((f) => payload.required_posting_auths.includes(f.following))
          )
          .map(([, payload]) => ({
            blocktime: b.timestamp,
            block_id: b.block_id,
            ...JSON.parse(payload.json),
          }));
      })
    )
    .subscribe(console.log);
  /*
  stream
    .on("data", function (block: SignedBlock) {
      const podpingTransactions = block.transactions.reduce((updates, transaction) => {
        const filtered = (transaction.operations as OperationTuple[]).filter(([name, payload]) => {
          return (
            name === "custom_json" &&
            payload.id === "podping" &&
            Array.isArray(payload.required_posting_auths) &&
            followers.some((f) => payload.required_posting_auths.includes(f.following))
          );
        });
        if (filtered.length > 0) {
          return [...updates, ...filtered];
        }
        return updates;
      }, [] as TODO[]);
      if (podpingTransactions.length > 0) {
        console.log(podpingTransactions);
      }
    })
    .on("end", function () {
      // done
      console.log("END");
    });
    */
})();
type TODO = any;

type Follower = {
  follower: string;
  following: string;
  what: string[];
};

type OperationTuple = [OpName, OpPayload];
type OpName = OperationName | VirtualOperationName;
type OpPayload = {
  required_auths: TODO[];
  required_posting_auths: TODO[];
  id: string;
  json: string;
};

/**
 * Block
 {
  previous: '036a637261d4d706cc7c00f20c05162d2bb94190',
  timestamp: '2021-09-10T14:38:15',
  witness: 'timcliff',
  transaction_merkle_root: 'e63d859770f03601c75e5c3c1b576d6ced98f45c',
  extensions: [],
  witness_signature: '20dbd69ca762a8a0698b7adb705145759948132b6058cc9cd152f173778a35ef0f7f233a956da03ec81b1e45479c53f7e8ef905a241e170fb3ac68cee83c63a20e',
  transactions: [
    {
      ref_block_num: 25439,
      ref_block_prefix: 1765843964,
      expiration: '2021-09-10T14:48:09',
      operations: [Array],
      extensions: [],
      signatures: [Array],
      transaction_id: 'd38135540ba6d160c45e57975b17e2ff8f0e7bf1',
      block_num: 57303923,
      transaction_num: 0
    },
],
  block_id: '036a63739f9055ba273556552605b47fa67baf1c',
  signing_key: 'STM7ZgH3RUvjF2ZNJt7ozZNhpJBkUVDSc4MpCpbzwtLydGjS3zEX7',
  transaction_ids: [
    'd38135540ba6d160c45e57975b17e2ff8f0e7bf1',
    '610bcc2f8f941716ae9767349d982e41a6bd96e7',
    'f0294eadfb723018c952d2fb156aeb4cbdf5f6fc',
    '388b4fabb34f8e9eee10e44277b27d0abf008391',
    'c24e8f530922e964a23c06abc4f85b9fe4648364',
    'e649f2a22434bbd6adb953120a30fa9d7a455129',
    'c9a8ecd3fd6e5c9adc1712a0c606c2b1160efb8a',
    '3b924db1fae204ed95db68b4de026d5696ad2037',
    '0dae1f3c0b3444b127bb904d6fb1e649af4f089e',
    'd96fc63a54b75e4249e09d2e4603bd50588d4222',
    '45e999fd5abe6aa4e5d3de43317855dbfab908f9',
    '34597afdc4409afb3a44aa42aa19f4d0372f651a',
    '7e1a6e223cb61695e3ef522a07d0df2b1db3a43e',
    '5c4f0468c919b8c17f0047603b24478ef41ddcc9',
    'a199e44a3bcae70c706c60bbd6ba47d88ca1ce1b',
    '77506a4b5e7f14bb0cc5a23e286751df250324e4',
    '4bd2b5857529479f045b609f7676706b12ee2872',
    '76120543443ac1ff0f0e64517914d86d191814dc',
    '9ad6135a20b741ab003b69c4238fbce73a60e7dd',
    'c212185d843da6236e871a2286b906c218e50b3a',
    'b680e819e91f7c93d8ad72fa4828e191e865dcfb',
    '18dbdae0b8fbff26b4a270c4443a87b1c4996cdd',
    '750cd8104debac058b7a4e364026859e7e539e5c',
    'bdde688d1d1dca69e7fb158069222ff1a874d587'
  ]
}


Single Operation

  [
    'custom_json',
    {
      required_auths: [],
      required_posting_auths: [Array],
      id: 'sm_submit_team',
      json: '{"trx_id":"7684a2d3b938210fe080bcb24be2fef9484506c1","team_hash":"dfb55671314abe1e0c75cc6257776bfa","summoner":"C3-88-10LP4KOSFK","monsters":["C3-97-TB6O3HM2DC","C3-107-M0ZGLUPIXS","C3-91-9L8YK8NG9S","C3-131-4NP4SJHVMO"],"secret":"pyx3LnakRR","app":"steemmonsters/0.7.24"}'
    }
  ]


Single Operation for Podping
  [
    'custom_json',
    {
      required_auths: [],
      required_posting_auths: [Array],
      id: 'podping',
      json: '{"version":"0.3","num_urls":7,"reason":"feed_update","urls":["https://feeds.transistor.fm/into-the-bytecode","https://feeds.buzzsprout.com/1850299.rss","https://feeds.buzzsprout.com/273509.rss","https://feeds.buzzsprout.com/1662799.rss","https://feeds.buzzsprout.com/1610350.rss","https://media.rss.com/bass/feed.xml","https://media.rss.com/bass/feed.xml"]}'
    }
  ]

 */
