import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Badge, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { FaPlus, FaEye, FaPen, FaTrash, FaBuilding, FaStar, FaRegStar } from 'react-icons/fa';
import { useDeletePartyBranch, usePartyBranches, useSetDefaultPartyBranch } from '../../hooks/usePartyApi';
import { useCountryState } from '../../../dashboard/hooks/api.hooks';
import { useQueries } from '@tanstack/react-query';
import { getCity } from '../../../dashboard/api';
import { useUIManager } from '../../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../../store/uiModal.slice';
import PartyBranchModal from '../modals/PartyBranchModal';

/**
 * PartyBranchSection Component
 * Renders the Branches table inside PartyForm with Add/Edit/View/Delete/Set-Default actions.
 * Automatically resolves State and City names from IDs.
 */
const PartyBranchSection = ({ partyId, disabled = false }) => {
    const dispatch = useDispatch();
    const { showModal } = useUIManager();

    const [modalState, setModalState] = useState({
        show: false,
        mode: 'create', // 'create' | 'edit' | 'view'
        selectedItem: null
    });

    const { data: branches = [], isLoading, isFetching } = usePartyBranches(partyId);
    const { mutate: deleteBranch, isPending: isDeleting } = useDeletePartyBranch(partyId);
    const { mutate: setDefaultBranch, isPending: isSettingDefault } = useSetDefaultPartyBranch(partyId);

    // Load master states
    const { data: states = [] } = useCountryState();

    // Find unique state IDs across all branches
    const uniqueStateIds = useMemo(() => {
        const ids = branches
            .map((b) => b.stateId || b.billingAddress?.stateId)
            .filter(Boolean);
        return Array.from(new Set(ids));
    }, [branches]);

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

    const handleSetDefault = (branch) => {
        if (branch.isDefault) return;
        setDefaultBranch(branch.id);
    };

    const handleDelete = (item) => {
        if (branches.length <= 1) {
            return;
        }

        const label = item.branchName || `Branch #${item.id}`;
        showModal('confirm', {
            show: true,
            title: 'Delete Branch',
            message: `Are you sure you want to delete branch "${label}"?`,
            confirmText: 'Delete',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                deleteBranch(item.id);
            }
        });
    };

    return (
        <>
            <Card className="border shadow-none mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent py-3 px-4 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                        <div
                            className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '32px', height: '32px' }}
                        >
                            <FaBuilding className="text-primary" size={13} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
                                    Party Branches / Facilities
                                </h6>
                                {!isLoading && (
                                    <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-0.5" style={{ fontSize: '0.74rem' }}>
                                        {branches.length}
                                    </Badge>
                                )}
                                {isFetching && !isLoading && (
                                    <Spinner animation="border" size="sm" variant="primary" style={{ width: '0.9rem', height: '0.9rem' }} />
                                )}
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                Manage branch offices, manufacturing plants, regional offices, and warehouses
                            </span>
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
                            <span>Add Branch</span>
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" size="sm" />
                            <p className="text-muted small mt-2 mb-0">Loading branches...</p>
                        </div>
                    ) : branches.length === 0 ? (
                        <div className="text-center py-5 px-3">
                            <div
                                className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: '56px', height: '56px' }}
                            >
                                <FaBuilding className="text-muted" size={22} />
                            </div>
                            <h6 className="fw-semibold text-dark mb-1" style={{ fontSize: '0.90rem' }}>
                                No Branches Registered
                            </h6>
                            <p className="text-muted small mb-3" style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.78rem' }}>
                                Add registered branches, plants, or warehouse locations for this party to enable multi-location billing and shipping.
                            </p>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                disabled={disabled || !partyId}
                                onClick={() => handleOpenModal('create')}
                                className="d-inline-flex align-items-center gap-1.5"
                                style={{ fontSize: '0.78rem' }}
                            >
                                <FaPlus size={10} />
                                <span>Add First Branch</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                                <thead className="bg-light text-secondary border-bottom">
                                    <tr>
                                        <th style={{ width: '40px' }} className="text-center py-2.5">#</th>
                                        <th style={{ minWidth: '180px' }} className="py-2.5">Branch Name</th>
                                        <th style={{ minWidth: '130px' }} className="py-2.5">Branch GSTIN</th>
                                        <th style={{ minWidth: '220px' }} className="py-2.5">Facility Address</th>
                                        <th style={{ minWidth: '150px' }} className="py-2.5">State & City</th>
                                        <th style={{ minWidth: '140px' }} className="py-2.5">Contact</th>
                                        <th style={{ width: '130px' }} className="text-center py-2.5">Status</th>
                                        <th style={{ width: '120px' }} className="text-center py-2.5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.map((branch, index) => {
                                        const resolvedStateId = branch.stateId || branch.billingAddress?.stateId;
                                        const resolvedCityId = branch.cityId || branch.billingAddress?.cityId;
                                        const stateName = branch.stateName || stateMap[resolvedStateId] || branch.billingAddress?.stateName || (resolvedStateId ? `State #${resolvedStateId}` : '-');
                                        const cityName = branch.cityName || cityMap[resolvedCityId] || branch.billingAddress?.cityName || (resolvedCityId ? `City #${resolvedCityId}` : '-');
                                        const addrText = branch.address || (typeof branch.billingAddress === 'object' ? branch.billingAddress?.address : branch.billingAddress) || '-';
                                        const pin = branch.pincode || branch.billingAddress?.pincode || '';

                                        const canDelete = branches.length > 1;

                                        return (
                                            <tr key={branch.id || index}>
                                                <td className="text-center text-muted fw-semibold" style={{ fontSize: '0.76rem' }}>
                                                    {index + 1}
                                                </td>

                                                {/* Branch Name & Code */}
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-semibold text-dark">
                                                                {branch.branchName || 'Primary Branch'}
                                                            </span>
                                                            {branch.isDefault && (
                                                                <Badge bg="success" className="px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                                                    Default
                                                                </Badge>
                                                            )}
                                                            {branch.isHeadOffice && (
                                                                <Badge bg="info" className="px-1.5 py-0.5 text-white" style={{ fontSize: '0.65rem' }}>
                                                                    HQ
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {branch.branchCode && (
                                                            <span className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                                                Code: {branch.branchCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Branch GSTIN */}
                                                <td>
                                                    {branch.gstin ? (
                                                        <Badge bg="light" className="text-dark border font-monospace px-2 py-1" style={{ fontSize: '0.74rem' }}>
                                                            {branch.gstin}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            Same as Party
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Address Line */}
                                                <td>
                                                    <div className="text-dark text-truncate" style={{ maxWidth: '280px' }} title={addrText}>
                                                        {addrText}
                                                    </div>
                                                    {pin && (
                                                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                            PIN: {pin}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* State & City */}
                                                <td>
                                                    <div className="fw-medium text-dark">{cityName}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{stateName}</div>
                                                </td>

                                                {/* Contact */}
                                                <td>
                                                    {branch.mobile && (
                                                        <div className="text-dark" style={{ fontSize: '0.75rem' }}>
                                                            📞 {branch.mobile}
                                                        </div>
                                                    )}
                                                    {branch.email && (
                                                        <div className="text-muted text-truncate" style={{ maxWidth: '140px', fontSize: '0.72rem' }} title={branch.email}>
                                                            ✉️ {branch.email}
                                                        </div>
                                                    )}
                                                    {!branch.mobile && !branch.email && (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>

                                                {/* Default Toggle / Status */}
                                                <td className="text-center">
                                                    {branch.isDefault ? (
                                                        <Badge bg="soft-success" className="text-success border border-success-subtle px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                                            <FaStar className="me-1" size={10} /> Default
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            disabled={disabled || isSettingDefault}
                                                            onClick={() => handleSetDefault(branch)}
                                                            className="btn-xs py-0 px-2"
                                                            style={{ fontSize: '0.70rem' }}
                                                            title="Set as Default Billing Branch"
                                                        >
                                                            <FaRegStar className="me-1" size={9} /> Set Default
                                                        </Button>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`view-b-${branch.id}`}>View Details</Tooltip>}>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-1 text-secondary"
                                                                onClick={() => handleOpenModal('view', branch)}
                                                            >
                                                                <FaEye size={13} />
                                                            </Button>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`edit-b-${branch.id}`}>Edit Branch</Tooltip>}>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-1 text-primary"
                                                                disabled={disabled}
                                                                onClick={() => handleOpenModal('edit', branch)}
                                                            >
                                                                <FaPen size={12} />
                                                            </Button>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={
                                                                <Tooltip id={`del-b-${branch.id}`}>
                                                                    {canDelete
                                                                        ? 'Delete Branch'
                                                                        : 'A party must have at least one registered branch.'}
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <span>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className={`p-1 ${canDelete ? 'text-danger' : 'text-muted opacity-50'}`}
                                                                    disabled={disabled || isDeleting || !canDelete}
                                                                    onClick={() => handleDelete(branch)}
                                                                >
                                                                    <FaTrash size={12} />
                                                                </Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {modalState.show && (
                <PartyBranchModal
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

export default PartyBranchSection;
