import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AddAuction from "./AddAuction";
import Auction from "./Auction";
import Loader from "../utils/Loader";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";
import {
  bidAction,
  createAuctionAction,
  endAuctionAction,
  deleteAuctionAction,
  getAuctionsAction,
  startAuctionAction,
} from "../../utils/auction";

import PropTypes from "prop-types";
import { Row } from "react-bootstrap";

const Auctions = ({ address, fetchBalance }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  const getListings = async () => {
    setLoading(true);
    getAuctionsAction()
      .then((listings) => {
        if (listings) {
          setListings(listings);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally((_) => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getListings();
  }, []);

  const createListing = async (data) => {
    setLoading(true);
    createAuctionAction(address, data)
      .then(() => {
        toast(<NotificationSuccess text="Listing added successfully." />);
        getListings();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to create a Listing." />);
        setLoading(false);
      });
  };

  const placeBid = async (auction, amount) => {
    setLoading(true);
    bidAction(address, auction, amount)
      .then(() => {
        toast(<NotificationSuccess text="Bid placed successfully" />);
        getListings();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to place bid" />);
        setLoading(false);
      });
  };

  const startAuction = async (auction) => {
    setLoading(true);
    startAuctionAction(address, auction)
      .then(() => {
        toast(<NotificationSuccess text="Auction Started" />);
        getListings();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to start auction." />);
        setLoading(false);
      });
  };

  const endAuction = async (auction) => {
    setLoading(true);
    endAuctionAction(address, auction)
      .then(() => {
        toast(<NotificationSuccess text="Auction Ended" />);
        getListings();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to end auction." />);
        setLoading(false);
      });
  };

  const deleteListing = async (auction) => {
    setLoading(true);
    deleteAuctionAction(address, auction.appId)
      .then(() => {
        toast(<NotificationSuccess text="Listing deleted successfully" />);
        getListings();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to delete listing." />);
        setLoading(false);
      });
  };

  if (loading) {
    return <Loader />;
  }
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">ALGO Auctions</h1>
        <AddAuction createAuction={createListing} />
      </div>
      <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
        <>
          {listings.map((listing, index) => (
            <Auction
              address={address}
              auction={listing}
              startAuction={startAuction}
              placeBid={placeBid}
              endAuction={endAuction}
              deleteAuction={deleteListing}
              key={index}
            />
          ))}
        </>
      </Row>
    </>
  );
};

Auctions.propTypes = {
  address: PropTypes.string.isRequired,
  fetchBalance: PropTypes.func.isRequired,
};

export default Auctions;
