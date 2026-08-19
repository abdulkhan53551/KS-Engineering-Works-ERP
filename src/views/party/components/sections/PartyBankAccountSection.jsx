import React, { useState } from 'react';
import { Card, Table, Button, Badge, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { FaPlus, FaEye, FaPen, FaTrash, FaUniversity, FaCopy, FaCheck } from 'react-icons/fa';
import { useDeletePartyBankAccount, usePartyBankAccounts } from '../../hooks/usePartyApi';
import { useUIManager } from '../../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../../store/uiModal.slice';
import PartyBankAccountModal from '../modals/PartyBankAccountModal';
import { toast } from 'react-toastify';

/**
 * PartyBankAccountSection Component
 * Renders the Bank Accounts table inside PartyForm with Add/Edit/View/Delete actions.
 */
const PartyBankAccountSection = ({ partyId, disabled = false }) => {
    const dispatch = useDispatch();
    const { showModal } = useUIManager();

    const [modalState, setModalState] = useState({
        show: false,
        mode: 'create', // 'create' | 'edit' | 'view'
        selectedItem: null
    });

    const [copiedKey, setCopiedKey] = useState(null);

    const { data: bankAccounts = [], isLoading, isFetching } = usePartyBankAccounts(partyId);
    const { mutate: deleteBankAccount, isPending: isDeleting } = useDeletePartyBankAccount(partyId);

    const handleOpenModal = (mode = 'create', item = null) => {
        setModalState({
            show: true,
            mode,
            selectedItem: item
        });
    };

    const handleCloseModal = () => {
        setModalState({
            show: false,
            mode: 'create',
            selectedItem: null
        });
    };

    const handleCopy = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.info('Account number copied!', { autoClose: 1500 });
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDelete = (item) => {
        const label = `${item.bankName || 'Bank'} (${item.accountNumber || ''})`;
        showModal('confirm', {
            show: true,
            title: 'Delete Bank Account',
            message: `Are you sure you want to delete "${label}"?`,
            confirmText: 'Delete',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                deleteBankAccount(item.id);
            }
        });
    };

    return (
        <>
            <Card className="border shadow-none mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent py-3 px-4 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                        <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                            <FaUniversity className="text-primary" size={13} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Party Bank Accounts</h6>
                                {!isLoading && (
                                    <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-0.5" style={{ fontSize: '0.74rem' }}>
                                        {bankAccounts.length}
                                    </Badge>
                                )}
                                {isFetching && !isLoading && <Spinner animation="border" size="sm" variant="primary" style={{ width: '0.9rem', height: '0.9rem' }} />}
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Settlement accounts, IFSC details, and UPI IDs</span>
                        </div>
                    </div>
                    <div>
                        <Button
                            variant="primary"
                            size="sm"
                            className="d-inline-flex align-items-center gap-1.5 shadow-sm"
                            disabled={disabled || !partyId}
                            onClick={() => handleOpenModal('create')}
                            style={{ fontSize: '0.80rem', padding: '0.3rem 0.75rem', fontWeight: 600 }}
                        >
                            <FaPlus size={10} />
                            <span>Add Bank Account</span>
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table className="table-sortable align-middle mb-0" striped bordered hover responsive>
                            <thead className="light">
                                <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    <th className="text-center py-2" style={{ width: '48px', minWidth: '48px', padding: '0.45rem 0.3rem' }}>
                                        #ID
                                    </th>
                                    <th className="py-2" style={{ minWidth: '150px', padding: '0.45rem 0.5rem' }}>
                                        Bank Name
                                    </th>
                                    <th className="py-2" style={{ minWidth: '160px', padding: '0.45rem 0.5rem' }}>
                                        Account Number
                                    </th>
                                    <th className="py-2" style={{ minWidth: '110px', padding: '0.45rem 0.5rem' }}>
                                        IFSC Code
                                    </th>
                                    <th className="py-2" style={{ minWidth: '140px', padding: '0.45rem 0.5rem' }}>
                                        Branch
                                    </th>
                                    <th className="py-2" style={{ minWidth: '160px', padding: '0.45rem 0.5rem' }}>
                                        Account Holder Name
                                    </th>
                                    <th className="py-2" style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}>
                                        UPI ID
                                    </th>
                                    <th className="text-center py-2" style={{ width: '85px', minWidth: '85px', padding: '0.45rem 0.5rem' }}>
                                        Primary
                                    </th>
                                    <th className="text-center py-2" style={{ width: '115px', minWidth: '115px', padding: '0.45rem 0.5rem' }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '0.86rem' }}>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <tr key={`bank-skel-${idx}`}>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-6 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-9 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-7 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-9 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-7 rounded" />
                                            </td>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-6 rounded-pill" />
                                            </td>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : bankAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4 text-muted">
                                            <div className="small mb-2">No bank accounts added yet for this party.</div>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                disabled={disabled || !partyId}
                                                onClick={() => handleOpenModal('create')}
                                                style={{ fontSize: '0.80rem' }}
                                            >
                                                + Add First Bank Account
                                            </Button>
                                        </td>
                                    </tr>
                                ) : (
                                    bankAccounts.map((item) => (
                                        <tr key={item.id}>
                                            <td className="text-center text-muted fw-medium" style={{ padding: '0.45rem 0.3rem' }}>
                                                {item.id}
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <span className="fw-semibold text-dark">{item.bankName || '—'}</span>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <div className="d-inline-flex align-items-center gap-1.5">
                                                    <span className="font-monospace fw-medium text-dark small">
                                                        {item.accountNumber || '—'}
                                                    </span>
                                                    {item.accountNumber && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(item.accountNumber, `acc-${item.id}`)}
                                                            className="btn btn-xs btn-link p-0 text-muted hover-primary"
                                                            style={{ border: 'none', background: 'transparent' }}
                                                        >
                                                            {copiedKey === `acc-${item.id}` ? (
                                                                <FaCheck size={10} className="text-success" />
                                                            ) : (
                                                                <FaCopy size={10} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <span className="font-monospace fw-medium text-dark small">
                                                    {item.ifscCode || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <span className="text-dark small">{item.branchName || '—'}</span>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <span className="text-dark small">{item.accountHolderName || '—'}</span>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <span className="text-muted small font-monospace">{item.upiId || '—'}</span>
                                            </td>
                                            <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                {item.isPrimary ? (
                                                    <span className="badge bg-success">Primary</span>
                                                ) : (
                                                    <span className="text-muted small">—</span>
                                                )}
                                            </td>
                                            <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                <div className="d-inline-flex align-items-center gap-1">
                                                    <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                            onClick={() => handleOpenModal('view', item)}
                                                        >
                                                            <FaEye size={11} />
                                                        </Button>
                                                    </OverlayTrigger>

                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Edit Bank Account</Tooltip>}>
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                            disabled={disabled}
                                                            onClick={() => handleOpenModal('edit', item)}
                                                        >
                                                            <FaPen size={10} />
                                                        </Button>
                                                    </OverlayTrigger>

                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Delete Bank Account</Tooltip>}>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                            disabled={disabled || isDeleting}
                                                            onClick={() => handleDelete(item)}
                                                        >
                                                            <FaTrash size={10} />
                                                        </Button>
                                                    </OverlayTrigger>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {modalState.show && (
                <PartyBankAccountModal
                    show={modalState.show}
                    onHide={handleCloseModal}
                    partyId={partyId}
                    mode={modalState.mode}
                    initialData={modalState.selectedItem}
                />
            )}
        </>
    );
};

export default PartyBankAccountSection;
