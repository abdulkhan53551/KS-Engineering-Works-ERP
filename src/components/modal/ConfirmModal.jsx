import { Modal, Button, Spinner } from "react-bootstrap";
import React from "react";

const ConfirmModal = ({ show, title, message, confirmText = "Confirm", cancelText = "Cancel", confirmVariant = "danger", isLoading, onConfirm, onClose }) => (
    <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
            <Modal.Title>{title || "Are you sure?"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>{cancelText}</Button>
            <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
                {isLoading && <Spinner animation="border" size="sm" className="me-2" />}
                {isLoading ? `${confirmText}...` : confirmText}
            </Button>
        </Modal.Footer>
    </Modal>
);

export default React.memo(ConfirmModal);