import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Button, FloatingLabel, Form, Modal } from "react-bootstrap";
import { stringToMicroAlgos } from "../../utils/conversions";

const AddAuction = ({ createAuction }) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(0);
  const [startingBid, setStartingBid] = useState(0);

  const isFormFilled = useCallback(() => {
    return name && image && description && duration > 0 && startingBid > 0;
  }, [name, image, description, duration, startingBid]);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button
        onClick={handleShow}
        variant="dark"
        className="rounded-pill px-0"
        style={{ width: "38px" }}
      >
        <i className="bi bi-plus"></i>
      </Button>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Auction Listing</Modal.Title>
        </Modal.Header>
        <Form>
          <Modal.Body>
            <FloatingLabel
              controlId="inputName"
              label="Item Name"
              className="mb-3"
            >
              <Form.Control
                type="text"
                onChange={(e) => {
                  setName(e.target.value);
                }}
                maxLength={120}
                placeholder="Enter name of item"
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputUrl"
              label="Image URL"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Image URL"
                value={image}
                maxLength={120}
                onChange={(e) => {
                  setImage(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputDescription"
              label="Item Description"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="description"
                style={{ height: "80px" }}
                maxLength={120}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputDuration"
              label="Duration in Mins"
              className="mb-3"
            >
              <Form.Control
                type="number"
                min={0}
                placeholder="Duration"
                onChange={(e) => {
                  setDuration(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputStartingBid"
              label="Starting Bid in ALGO"
              className="mb-3"
            >
              <Form.Control
                type="number"
                min={0}
                placeholder="Starting Bid"
                onChange={(e) => {
                  setStartingBid(stringToMicroAlgos(e.target.value));
                }}
              />
            </FloatingLabel>
          </Modal.Body>
        </Form>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              createAuction({
                name,
                image,
                description,
                duration,
                startingBid,
              });
              handleClose();
            }}
          >
            Add Listing
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

AddAuction.propTypes = {
  createAuction: PropTypes.func.isRequired,
};

export default AddAuction;
