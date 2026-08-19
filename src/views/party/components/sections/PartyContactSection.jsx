import React, { useState } from 'react';
import { Card, Table, Button, Badge, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { FaPlus, FaEye, FaPen, FaTrash, FaUserCheck, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { useDeletePartyContact, usePartyContacts } from '../../hooks/usePartyApi';
import { useUIManager } from '../../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../../store/uiModal.slice';
import PartyContactModal from '../modals/PartyContactModal';

/**
 * PartyContactSection Component
 * Renders the Contacts table inside PartyForm with Add/Edit/View/Delete actions.
 */
const PartyContactSection = ({ partyId, disabled = false }) => {
    const dispatch = useDispatch();
    const { showModal } = useUIManager();

    const [modalState, setModalState] = useState({
        show: false,
        mode: 'create', // 'create' | 'edit' | 'view'
        selectedItem: null
    });

    const { data: contacts = [], isLoading, isFetching } = usePartyContacts(partyId);
    const { mutate: deleteContact, isPending: isDeleting } = useDeletePartyContact(partyId);

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

    const handleDelete = (item) => {
        const label = item.contactName || `Contact #${item.id}`;
        showModal('confirm', {
            show: true,
            title: 'Delete Contact',
            message: `Are you sure you want to delete "${label}"?`,
            confirmText: 'Delete',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                deleteContact(item.id);
            }
        });
    };

    return (
        <>
            <Card className="border shadow-none mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent py-3 px-4 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                        <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                            <FaUserCheck className="text-primary" size={13} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Party Contact Persons</h6>
                                {!isLoading && (
                                    <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-0.5" style={{ fontSize: '0.74rem' }}>
                                        {contacts.length}
                                    </Badge>
                                )}
                                {isFetching && !isLoading && <Spinner animation="border" size="sm" variant="primary" style={{ width: '0.9rem', height: '0.9rem' }} />}
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Key executives, purchase heads, and department representatives</span>
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
                            <span>Add Contact</span>
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
                                    <th className="py-2" style={{ minWidth: '160px', padding: '0.45rem 0.5rem' }}>
                                        Contact Person
                                    </th>
                                    <th className="py-2" style={{ minWidth: '140px', padding: '0.45rem 0.5rem' }}>
                                        Designation
                                    </th>
                                    <th className="py-2" style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}>
                                        Mobile
                                    </th>
                                    <th className="py-2" style={{ minWidth: '150px', padding: '0.45rem 0.5rem' }}>
                                        Email
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
                                        <tr key={`contact-skel-${idx}`}>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-6 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-7 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-7 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-6 rounded-pill" />
                                            </td>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : contacts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">
                                            <div className="small mb-2">No contact persons added yet for this party.</div>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                disabled={disabled || !partyId}
                                                onClick={() => handleOpenModal('create')}
                                                style={{ fontSize: '0.80rem' }}
                                            >
                                                + Add First Contact
                                            </Button>
                                        </td>
                                    </tr>
                                ) : (
                                    contacts.map((item) => (
                                        <tr key={item.id}>
                                            <td className="text-center text-muted fw-medium" style={{ padding: '0.45rem 0.3rem' }}>
                                                {item.id}
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <span className="fw-semibold text-dark">{item.contactName || '—'}</span>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                <Badge bg="soft-secondary" className="text-secondary fw-semibold px-2 py-1">
                                                    {item.designation || 'General'}
                                                </Badge>
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                {item.mobile ? (
                                                    <a
                                                        href={`tel:${item.mobile}`}
                                                        className="text-dark text-decoration-none hover-primary small font-monospace d-inline-flex align-items-center gap-1"
                                                    >
                                                        <FaPhoneAlt size={9} className="text-muted" />
                                                        <span>{item.mobile}</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-muted small">—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                {item.email ? (
                                                    <a
                                                        href={`mailto:${item.email}`}
                                                        className="text-muted text-decoration-none hover-primary small d-inline-flex align-items-center gap-1 text-truncate"
                                                        style={{ maxWidth: '170px' }}
                                                        title={item.email}
                                                    >
                                                        <FaEnvelope size={9} className="text-muted" />
                                                        <span className="text-truncate">{item.email}</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-muted small">—</span>
                                                )}
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

                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Edit Contact</Tooltip>}>
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

                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Delete Contact</Tooltip>}>
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
                <PartyContactModal
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

export default PartyContactSection;
