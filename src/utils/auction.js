import algosdk from "algosdk";
import * as algo from "./constants";
import { Base64 } from "js-base64";
/* eslint import/no-webpack-loader-syntax: off */
import ApprovalProgram from "!!raw-loader!../contracts/auction_approval.teal";
import ClearProgram from "!!raw-loader!../contracts/auction_clear.teal";
import {
  base64ToUTF8String,
  utf8ToBase64String,
  convertMins,
  stringToMicroAlgos,
} from "./conversions";

class Auction {
  constructor(
    appId,
    appAddress,
    item_name,
    item_image,
    item_description,
    item_owner,
    starting_bid,
    highest_bid,
    highest_bidder,
    auction_start,
    auction_end,
    status,
    duration
  ) {
    this.appId = appId;
    this.appAddress = appAddress;
    this.item_name = item_name;
    this.item_description = item_description;
    this.item_image = item_image;
    this.item_owner = item_owner;
    this.starting_bid = starting_bid;
    this.highest_bid = highest_bid;
    this.highest_bidder = highest_bidder;
    this.auction_start = auction_start;
    this.auction_end = auction_end;
    this.status = status;
    this.duration = duration;
  }
}

// Compile smart contract in .teal format to program
const compileProgram = async (programSource) => {
  let encoder = new TextEncoder();
  let programBytes = encoder.encode(programSource);
  let compileResponse = await algo.algodClient.compile(programBytes).do();
  return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
};

// CREATE AUCTION: ApplicationCreateTxn
export const createAuctionAction = async (senderAddress, auction) => {
  

  let params = await algo.algodClient.getTransactionParams().do();

  // Compile Programs
  const compiledApprovalProgram = await compileProgram(ApprovalProgram);
  const compiledClearProgram = await compileProgram(ClearProgram);

  // Build note to identify transaction later and required app args as Uint8Array
  let note = new TextEncoder().encode(algo.auctionNote);
  let name = new TextEncoder().encode(auction.name);
  let image = new TextEncoder().encode(auction.image);
  let description = new TextEncoder().encode(auction.description);
  let duration = algosdk.encodeUint64(convertMins(auction.duration));
  let startingBid = algosdk.encodeUint64(auction.startingBid);
  let appArgs = [duration, name, image, description, startingBid];

  let txn = algosdk.makeApplicationCreateTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: compiledApprovalProgram,
    clearProgram: compiledClearProgram,
    numLocalInts: algo.numLocalInts,
    numLocalByteSlices: algo.numLocalBytes,
    numGlobalInts: algo.numGlobalInts,
    numGlobalByteSlices: algo.numGlobalBytes,
    note: note,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(txn.toByte());
  
  await algo.algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    txId,
    4
  );

  // Get the completed Transaction
  
  // Get created application id and notify about completion
  let transactionResponse = await algo.algodClient
    .pendingTransactionInformation(txId)
    .do();
  let appId = transactionResponse["application-index"];
  
  return appId;
};

// START:
export const startAuctionAction = async (senderAddress, auction) => {
  

  let params = await algo.algodClient.getTransactionParams().do();

  // Build required app args as Uint8Array
  let startArg = new TextEncoder().encode("start");
  let appArgs = [startArg];

  let amount = stringToMicroAlgos(1);

  // Create ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: auction.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
  });

  // Create PaymentTxn
  let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddress,
    to: auction.appAddress,
    amount: amount,
    suggestedParams: params,
  });

  let txnArray = [appCallTxn, paymentTxn];

  // Create group transaction out of previously build transactions
  let groupID = algosdk.computeGroupID(txnArray);
  for (let i = 0; i < 2; i++) txnArray[i].group = groupID;

  // Sign & submit the group transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(
    txnArray.map((txn) => txn.toByte())
  );
  
  let tx = await algo.algodClient
    .sendRawTransaction(signedTxn.map((txn) => txn.blob))
    .do();

  // Wait for group transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    tx.txId,
    4
  );

  // Notify about completion
  
};

// BID:
export const bidAction = async (senderAddress, auction, amount) => {
  

  let params = await algo.algodClient.getTransactionParams().do();

  if (auction.highest_bidder !== algo.zero_address) {
    params.flatFee = true;

    params.fee = algosdk.ALGORAND_MIN_TX_FEE * 3;
  }

  amount = stringToMicroAlgos(amount);

  

  // Build required app args as Uint8Array
  let bidArg = new TextEncoder().encode("bid");
  let appArgs = [bidArg];

  // Create ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: auction.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
    accounts: [auction.highest_bidder],
  });
  // Create PaymentTxn

  let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddress,
    to: auction.appAddress,
    amount: amount,
    suggestedParams: params,
  });

  let txnArray = [appCallTxn, paymentTxn];

  // Create group transaction out of previously build transactions
  let groupID = algosdk.computeGroupID(txnArray);
  for (let i = 0; i < 2; i++) txnArray[i].group = groupID;

  // Sign & submit the group transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(
    txnArray.map((txn) => txn.toByte())
  );
  
  let tx = await algo.algodClient
    .sendRawTransaction(signedTxn.map((txn) => txn.blob))
    .do();

  // Wait for group transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    tx.txId,
    4
  );

  // Notify about completion
  
};

// END AUCTION:
export const endAuctionAction = async (senderAddress, auction) => {
  

  let params = await algo.algodClient.getTransactionParams().do();

  params.flatFee = true;

  params.fee = algosdk.ALGORAND_MIN_TX_FEE * 2;

  

  // Build required app args as Uint8Array
  let endArg = new TextEncoder().encode("end");
  let appArgs = [endArg];

  // Create ApplicationCallTxn
  let txn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: auction.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(txn.toByte());
  
  await algo.algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    txId,
    4
  );

  // Get the completed Transaction
  
};

// DELETE AUCTION
export const deleteAuctionAction = async (senderAddress, index) => {
  

  let params = await algo.algodClient.getTransactionParams().do();
  let sender = new TextEncoder().encode(senderAddress);
  let appArgs = [sender];

  // Create ApplicationDeleteTxn
  let txn = algosdk.makeApplicationDeleteTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    appIndex: index,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(txn.toByte());
  
  await algo.algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    txId,
    4
  );

  // Get the completed Transaction
  

  // Get application id of deleted application and notify about completion
  let transactionResponse = await algo.algodClient
    .pendingTransactionInformation(txId)
    .do();
  let appId = transactionResponse["txn"]["txn"].apid;
  
};

// GET LISTINGS: Using Indexer
export const getAuctionsAction = async () => {
  
  let note = new TextEncoder().encode(algo.auctionNote);
  let encodedNote = Buffer.from(note).toString("base64");

  // Step 1: Get all transactions by notePrefix (+ minRound filter for performance)
  let transactionInfo = await algo.indexerClient
    .searchForTransactions()
    .notePrefix(encodedNote)
    .txType("appl")
    .minRound(algo.minRound)
    .do();

  let listings = [];
  for (const transaction of transactionInfo.transactions) {
    let appId = transaction["created-application-index"];
    if (appId) {
      // Step 2: Get each application by application id
      let listing = await getApplication(appId);
      if (listing) {
        listings.push(listing);
      }
    }
  }
  
  return listings;
};

const getApplication = async (appId) => {
  try {
    // 1. Get application by appId
    let response = await algo.indexerClient
      .lookupApplications(appId)
      .includeAll(true)
      .do();
    if (response.application.deleted) {
      return null;
    }

    // console.log(response.application);

    let globalState = response.application.params["global-state"];

    // 2. Parse fields of response and return product
    let item_name = "";
    let item_description = "";
    let item_image = "";
    let item_owner = "";
    let starting_bid = "";
    let highest_bid = "";
    let highest_bidder = "";
    let auction_start = "";
    let auction_end = "";
    let status = "";
    let duration = "";

    if (getField("NAME", globalState) !== undefined) {
      let field = getField("NAME", globalState).value.bytes;
      item_name = base64ToUTF8String(field);
    }

    if (getField("IMAGE", globalState) !== undefined) {
      let field = getField("IMAGE", globalState).value.bytes;
      item_image = base64ToUTF8String(field);
    }

    if (getField("DESC", globalState) !== undefined) {
      let field = getField("DESC", globalState).value.bytes;
      item_description = base64ToUTF8String(field);
    }

    if (getField("OWNER", globalState) !== undefined) {
      let field = getField("OWNER", globalState).value.bytes;

      item_owner = algosdk.encodeAddress(Base64.toUint8Array(field));
    }

    if (getField("STARTINGBID", globalState) !== undefined) {
      starting_bid = getField("STARTINGBID", globalState).value.uint;
    }

    if (getField("HIGHESTBID", globalState) !== undefined) {
      highest_bid = getField("HIGHESTBID", globalState).value.uint;
    }

    if (getField("HIGHESTBIDDER", globalState) !== undefined) {
      let field = getField("HIGHESTBIDDER", globalState).value.bytes;
      if (field) {
        highest_bidder = algosdk.encodeAddress(Base64.toUint8Array(field));
      }
    }

    if (getField("AUCTIONSTART", globalState) !== undefined) {
      auction_start = getField("AUCTIONSTART", globalState).value.uint;
    }

    if (getField("AUCTIONEND", globalState) !== undefined) {
      auction_end = getField("AUCTIONEND", globalState).value.uint;
    }

    if (getField("STATUS", globalState) !== undefined) {
      status = getField("STATUS", globalState).value.uint;
    }

    if (getField("DURATION", globalState) !== undefined) {
      duration = getField("DURATION", globalState).value.uint;
    }

    let appAddress = algosdk.getApplicationAddress(appId);

    return new Auction(
      appId,
      appAddress,
      item_name,
      item_image,
      item_description,
      item_owner,
      starting_bid,
      highest_bid,
      highest_bidder,
      auction_start,
      auction_end,
      status,
      duration
    );
  } catch (err) {
    return null;
  }
};

const getField = (fieldName, globalState) => {
  return globalState.find((state) => {
    return state.key === utf8ToBase64String(fieldName);
  });
};
