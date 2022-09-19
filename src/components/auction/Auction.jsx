import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Card,
  Col,
  FloatingLabel,
  Form,
  Stack,
} from "react-bootstrap";
import {
  microAlgosToString,
  truncateAddress,
  convertTime,
} from "../../utils/conversions";
import Identicon from "../utils/Identicon";

const Auction = ({
  address,
  auction,
  startAuction,
  placeBid,
  endAuction,
  deleteAuction,
}) => {
  const {
    appId,
    appAddress,
    item_name,
    item_image,
    item_description,
    item_owner,
    starting_bid,
    highest_bid,
    highest_bidder,
    auction_end,
    status,
    duration,
  } = auction;

  const now = new Date();
  const auction_endtime = new Date(auction_end * 1000);

  const hasEnded = () => now >= auction_endtime;

  const statuscheck = (num) => status === num;

  const isOwner = () => address === item_owner;

  const getBid = (bid) => {
    if (bid !== 0) {
      return microAlgosToString(bid);
    } else {
      return bid;
    }
  };

  const handleAction = () => {
    if (statuscheck(0 && isOwner())) {
      startAuction(auction);
    } else if (hasEnded() && isOwner() && statuscheck(1)) {
      endAuction(auction);
    } else if (statuscheck(1) && !isOwner() && !hasEnded()) {
      placeBid(auction, amount);
    }
  };

  const [amount, setAmount] = useState(getBid(highest_bid) * 1 + 1);

  return (
    <Col key={appId}>
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <Identicon size={28} address={item_owner} />
            <span className="font-monospace text-secondary">
              <a
                href={`https://testnet.algoexplorer.io/address/${appAddress}`}
                target="_blank"
                rel="noreferrer"
              >
                {truncateAddress(appAddress)}
              </a>
            </span>
            <Badge bg="secondary" className="ms-auto">
              {statuscheck(0)
                ? "NOT YET STARTED"
                : hasEnded()
                ? "ENDED"
                : "ACTIVE"}
            </Badge>
          </Stack>
        </Card.Header>
        <div className="ratio ratio-4x3">
          <img
            src={item_image}
            alt={item_name}
            style={{ objectFit: "cover" }}
          />
        </div>
        <Card.Body className="d-flex flex-column text-center">
          <Card.Title>{item_name}</Card.Title>
          <Card.Text className="flex-grow-1">{item_description}</Card.Text>
          <Card.Text className="flex-grow-1">
            Highest Bidder:{" "}
            <a
              href={`https://testnet.algoexplorer.io/address/${highest_bidder}`}
              target="_blank"
              rel="noreferrer"
            >
              {statuscheck(0) ? "No bids yet" : truncateAddress(highest_bidder)}
            </a>
          </Card.Text>
          <Card.Text className="flex-grow-1">
            {statuscheck(0)
              ? `Starting Bid: ${getBid(starting_bid)} ALGO`
              : `Highest Bid: ${getBid(highest_bid)} ALGO`}
          </Card.Text>
          <Card.Text className="flex-grow-1">
            {statuscheck(0)
              ? `Duration: ${duration / 60} Mins`
              : statuscheck(1)
              ? `Listing Ends: ${convertTime(auction_end)}`
              : `Listing Ended: ${convertTime(auction_end)}`}
          </Card.Text>

          <Form className="d-flex align-content-stretch flex-row gap-2">
            <FloatingLabel
              controlId="inputCount"
              label="Amount"
              className="w-25"
            >
              <Form.Control
                type="number"
                value={amount}
                disabled={hasEnded()}
                min={getBid() * 1 + 1}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                }}
              />
            </FloatingLabel>
            <Button
              variant="outline-dark"
              onClick={() => handleAction()}
              className="w-75 py-3"
              disabled={
                !isOwner() && (statuscheck(0) || statuscheck(2) || hasEnded())
              }
            >
              {isOwner()
                ? statuscheck(0)
                  ? "Start Auction"
                  : statuscheck(1)
                  ? hasEnded()
                    ? "Finish Auction"
                    : "Waiting for conclusion"
                  : "Auction Ended"
                : statuscheck(0)
                ? "Starting Soon"
                : !hasEnded()
                ? `Place Bid for ${amount} ALGO`
                : "Auction Ended"}
            </Button>
            {isOwner() && (
              <Button
                variant="outline-danger"
                onClick={() => deleteAuction(auction)}
                className="btn"
              >
                <i className="bi bi-trash"></i>
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Col>
  );
};

Auction.propTypes = {
  address: PropTypes.string.isRequired,
  auction: PropTypes.instanceOf(Object).isRequired,
  placeBid: PropTypes.func.isRequired,
  endAuction: PropTypes.func.isRequired,
  deleteAuction: PropTypes.func.isRequired,
};

export default Auction;
