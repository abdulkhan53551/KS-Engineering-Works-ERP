import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Badge, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { FaPlus, FaEye, FaPen, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { useDeletePartyAddress, usePartyAddresses } from '../../hooks/usePartyApi';
import { useCountryState } from '../../../dashboard/hooks/api.hooks';
import { useQueries } from '@tanstack/react-query';
import { getCity } from '../../../dashboard/api';
import { useUIManager } from '../../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../../store/uiModal.slice';
import PartyAddressModal from '../modals/PartyAddressModal';

/**
 * PartyAddressSection Component
 * Renders the Addresses table inside PartyForm with Add/Edit/View/Delete actions.
 * Automatically resolves State and City names from IDs.
 */
const PartyAddressSection = ({ partyId, disabled = false }) => {
    const dispatch = useDispatch();
    const { showModal } = useUIManager();

    const [modalState, setModalState] = useState({
        show: false,
        mode: 'create', // 'create' | 'edit' | 'view'
        selectedItem: null
    });

    const { data: addresses = [], isLoading, isFetching } = usePartyAddresses(partyId);
    const { mutate: deleteAddress, isPending: isDeleting } = useDeletePartyAddress(partyId);

    // Load master states
    const { data: states = [] } = useCountryState();

    // Find unique state IDs across all addresses
    const uniqueStateIds = useMemo(() => {
        const ids = addresses.map((a) => a.stateId).filter(Boolean);
        return Array.from(new Set(ids));
    }, [addresses]);

    // Fetch cities for all unique state IDs
    const cityQueries = useQueries({
        queries: uniqueStateIds.map((stateId) => ({
            queryKey: ['cities', stateId],
            queryFn: () => getCity(stateId),
            staleTime: Infinity,
            select: (res) => res?.data ?? []
        }))
    });

    // Map stateId -> stateName
    const stateMap = useMemo(() => {
        const map = {};
        states.forEach((s) => {
            const id = s.id || s.stateId;
            const name = s.name || s.stateName;
            if (id) map[id] = name;
        });
        return map;
    }, [states]);

    // Map cityId -> cityName
    const cityMap = useMemo(() => {
        const map = {};
        cityQueries.forEach((q) => {
            if (Array.isArray(q.data)) {
                q.data.forEach((c) => {
                    const id = c.id || c.cityId;
                    const name = c.name || c.cityName;
                    if (id) map[id] = name;
                });
            }
        });
        return map;
    }, [cityQueries]);

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
        const label = item.addressTypeName || item.address || `Address #${item.id}`;
        showModal('confirm', {
            show: true,
            title: 'Delete Address',
            message: `Are you sure you want to delete "${label}"?`,
            confirmText: 'Delete',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                deleteAddress(item.id);
            }
        });
    };

    return (
        <>
            <Card className="border shadow-none mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent py-3 px-4 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                        <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                            <FaMapMarkerAlt className="text-primary" size={13} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Party Addresses</h6>
                                {!isLoading && (
                                    <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-0.5" style={{ fontSize: '0.74rem' }}>
                                        {addresses.length}
                                    </Badge>
                                )}
                                {isFetching && !isLoading && <Spinner animation="border" size="sm" variant="primary" style={{ width: '0.9rem', height: '0.9rem' }} />}
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Manage billing, shipping, branch, and warehouse locations</span>
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
                            <span>Add Address</span>
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
                                    <th className="py-2" style={{ width: '120px', minWidth: '120px', padding: '0.45rem 0.5rem' }}>
                                        Address Type
                                    </th>
                                    <th className="py-2" style={{ minWidth: '220px', padding: '0.45rem 0.5rem' }}>
                                        Address Line
                                    </th>
                                    <th className="py-2" style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}>
                                        State
                                    </th>
                                    <th className="py-2" style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}>
                                        City
                                    </th>
                                    <th className="py-2" style={{ width: '90px', minWidth: '90px', padding: '0.45rem 0.5rem' }}>
                                        Pincode
                                    </th>
                                    <th className="py-2" style={{ width: '80px', minWidth: '80px', padding: '0.45rem 0.5rem' }}>
                                        Country
                                    </th>
                                    <th className="text-center py-2" style={{ width: '115px', minWidth: '115px', padding: '0.45rem 0.5rem' }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '0.86rem' }}>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <tr key={`addr-skel-${idx}`}>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-6 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                            <td className="py-2">
                                                <span className="placeholder col-10 rounded" />
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
                                            <td className="py-2">
                                                <span className="placeholder col-6 rounded" />
                                            </td>
                                            <td className="text-center py-2">
                                                <span className="placeholder col-8 rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : addresses.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-4 text-muted">
                                            <div className="small mb-2">No addresses added yet for this party.</div>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                disabled={disabled || !partyId}
                                                onClick={() => handleOpenModal('create')}
                                                style={{ fontSize: '0.80rem' }}
                                            >
                                                + Add First Address
                                            </Button>
                                        </td>
                                    </tr>
                                ) : (
                                    addresses.map((item) => {
                                        const displayState = item.stateName || (item.stateId && stateMap[item.stateId]) || '—';
                                        const displayCity = item.cityName || (item.cityId && cityMap[item.cityId]) || '—';

                                        return (
                                            <tr key={item.id}>
                                                <td className="text-center text-muted fw-medium" style={{ padding: '0.45rem 0.3rem' }}>
                                                    {item.id}
                                                </td>
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <Badge bg="soft-info" className="text-info fw-semibold px-2 py-1">
                                                        {item.addressTypeName || item.addressTypeCode || 'Standard'}
                                                    </Badge>
                                                </td>
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <span className="text-dark small fw-medium">{item.address || '—'}</span>
                                                </td>
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <span className="text-dark small fw-medium">{displayState}</span>
                                                </td>
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <span className="text-dark small fw-medium">{displayCity}</span>
                                                </td>
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <span className="font-monospace small text-dark">{item.pincode || '—'}</span>
                                                </td>
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <span className="text-muted small">{item.country || 'India'}</span>
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

                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Edit Address</Tooltip>}>
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

                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Delete Address</Tooltip>}>
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
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {modalState.show && (
                <PartyAddressModal
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

export default PartyAddressSection;
