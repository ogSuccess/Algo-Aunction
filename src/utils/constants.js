import algosdk from "algosdk";
import MyAlgoConnect from "@randlabs/myalgo-connect";

const config = {
  algodToken: "",
  algodServer: "https://node.testnet.algoexplorerapi.io",
  algodPort: "",
  indexerToken: "",
  indexerServer: "https://algoindexer.testnet.algoexplorerapi.io",
  indexerPort: "",
};

export const algodClient = new algosdk.Algodv2(
  config.algodToken,
  config.algodServer,
  config.algodPort
);

export const indexerClient = new algosdk.Indexer(
  config.indexerToken,
  config.indexerServer,
  config.indexerPort
);

export const myAlgoConnect = new MyAlgoConnect();

export const minRound = 21540981;

// https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0002.md
export const auctionNote = "auction:uv2";

// Maximum local storage allocation, immutable
export const numLocalInts = 0;
export const numLocalBytes = 0;
// Maximum global storage allocation, immutable
export const numGlobalInts = 6; // Global variables stored as Int: duration, auction_start, auction_end, starting_bid, highest_bid, status
export const numGlobalBytes = 5; // Global variables stored as Bytes: name, image, description, item_owner, highest_bidder

export const ALGORAND_DECIMALS = 6;
export const zero_address =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
