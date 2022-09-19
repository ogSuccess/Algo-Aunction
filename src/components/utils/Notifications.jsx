import React from "react";
import { ToastContainer } from "react-toastify";
import PropTypes from "prop-types";

const Notification = () => (
  <ToastContainer
    position="bottom-center"
    autoClose={5000}
    hideProgressBar
    newestOnTop
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable={false}
    pauseOnHover
  />
);

const NotificationSuccess = ({ text }) => (
  <div>
    <i className="bi bi-check-circle-fill text-success mx-2" />
    <span className="text-secondary mx-1">{text}</span>
  </div>
);

const NotificationError = ({ text }) => (
  <div>
    <i className="bi bi-x-circle-fill text-danger mx-2" />
    <span className="text-secondary mx-1">{text}</span>
  </div>
);

const NotificationInfo = ({ text }) => (
  <div>
    <i className="bi bi-info-circle-fill text-info mx-2" />
    <span className="text-secondary mx-1">{text}</span>
  </div>
);

const Props = {
  text: PropTypes.string,
};

const DefaultProps = {
  text: "",
};

NotificationSuccess.propTypes = Props;
NotificationSuccess.defaultProps = DefaultProps;

NotificationError.propTypes = Props;
NotificationError.defaultProps = DefaultProps;

NotificationInfo.propTypes = Props;
NotificationInfo.defaultProps = DefaultProps;

export {
  Notification,
  NotificationSuccess,
  NotificationError,
  NotificationInfo,
};
