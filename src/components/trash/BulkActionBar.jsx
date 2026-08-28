import React from 'react';
import { Button, Badge, Spinner } from 'react-bootstrap';
import { FaTrash, FaUndo, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

/**
 * BulkActionBar Component
 * Floating / Inline banner displaying bulk action options when rows are selected.
 */
const BulkActionBar = ({
    selectedCount = 0,
    isTrash = false,
    onBulkDelete,
    onBulkRestore,
    onBulkPermanentDelete,
    onClearSelection,
    isLoading = false
}) => {
    if (selectedCount <= 0) return null;

    return (
        <div
            className={`d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-2 my-2 rounded border shadow-sm ${
                isTrash ? 'bg-soft-danger border-danger-subtle' : 'bg-soft-primary border-primary-subtle'
            }`}
            style={{ fontSize: '0.84rem' }}
        >
            <div className="d-flex align-items-center gap-2">
                <Badge bg={isTrash ? 'danger' : 'primary'} className="px-2.5 py-1.5" style={{ fontSize: '0.78rem' }}>
                    {selectedCount} Selected
                </Badge>
                <span className="text-dark fw-medium" style={{ fontSize: '0.82rem' }}>
                    {isTrash ? 'Selected items in Recycle Bin' : 'Selected active items'}
                </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
                {!isTrash ? (
                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="d-flex align-items-center gap-1.5 px-3 py-1 shadow-none"
                        onClick={onBulkDelete}
                        disabled={isLoading}
                        style={{ fontSize: '0.80rem', fontWeight: 600 }}
                    >
                        {isLoading ? <Spinner animation="border" size="sm" /> : <FaTrash size={11} />}
                        <span>Move to Trash</span>
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="success"
                            size="sm"
                            className="d-flex align-items-center gap-1.5 px-3 py-1 text-white shadow-none"
                            onClick={onBulkRestore}
                            disabled={isLoading}
                            style={{ fontSize: '0.80rem', fontWeight: 600 }}
                        >
                            {isLoading ? <Spinner animation="border" size="sm" /> : <FaUndo size={11} />}
                            <span>Restore Selected</span>
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            className="d-flex align-items-center gap-1.5 px-3 py-1 shadow-none"
                            onClick={onBulkPermanentDelete}
                            disabled={isLoading}
                            style={{ fontSize: '0.80rem', fontWeight: 600 }}
                        >
                            {isLoading ? <Spinner animation="border" size="sm" /> : <FaExclamationTriangle size={11} />}
                            <span>Delete Permanently</span>
                        </Button>
                    </>
                )}

                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="d-flex align-items-center gap-1 px-2.5 py-1 shadow-none"
                    onClick={onClearSelection}
                    disabled={isLoading}
                    style={{ fontSize: '0.78rem' }}
                >
                    <FaTimes size={10} />
                    <span>Deselect</span>
                </Button>
            </div>
        </div>
    );
};

export default React.memo(BulkActionBar);
