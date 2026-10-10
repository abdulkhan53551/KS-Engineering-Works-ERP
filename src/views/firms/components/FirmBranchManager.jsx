import React, { useState, useCallback } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus, FaPen, FaTrash, FaBuilding, FaStar } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { firmBranchValidationSchema } from '../../../validation/firmBranch.validation';
import {
    useGetFirmBranches,
    useCreateFirmBranch,
    useUpdateFirmBranch,
    useDeleteFirmBranch
} from '../hooks/api.hooks';
import '../FirmModule.css';

const defaultBranchValues = {
    branchName: '',
    branchCode: '',
    isHeadOffice: false,
    gstin: '',
    phoneNumber: '',
    email: '',
    addressLine1: '',
    pincode: ''
};

const FirmBranchManager = ({ firmId, firm = null, noCard = false, readOnly = false }) => {
    const { data: branches = [], isLoading } = useGetFirmBranches(firmId);
    const { mutate: createBranch, isPending: isCreating } = useCreateFirmBranch(firmId);
    const { mutate: updateBranch, isPending: isUpdating } = useUpdateFirmBranch(firmId);
    const { mutate: deleteBranch, isPending: isDeleting } = useDeleteFirmBranch(firmId);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(firmBranchValidationSchema),
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: defaultBranchValues
    });

    const handleOpenCreate = useCallback(() => {
        setEditingBranch(null);
        reset({
            ...defaultBranchValues,
            // If this is the first branch, auto-designate as head office
            isHeadOffice: branches.length === 0
        });
        setModalOpen(true);
    }, [branches.length, reset]);

    const handleOpenEdit = useCallback((branch) => {
        setEditingBranch(branch);
        reset({
            branchName: branch.branchName || '',
            branchCode: branch.branchCode || '',
            isHeadOffice: Boolean(branch.isHeadOffice),
            gstin: branch.gstin || '',
            phoneNumber: branch.phoneNumber || branch.phone || '',
            email: branch.email || '',
            addressLine1: branch.addressLine1 || '',
            pincode: branch.pincode || ''
        });
        setModalOpen(true);
    }, [reset]);

    const onFormSubmit = useCallback((data) => {
        const payload = {
            branchName: data.branchName.trim(),
            branchCode: data.branchCode.trim().toUpperCase(),
            isHeadOffice: Boolean(data.isHeadOffice),
            gstin: data.gstin ? data.gstin.trim().toUpperCase() : null,
            phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : null,
            email: data.email ? data.email.trim() : null,
            addressLine1: data.addressLine1 ? data.addressLine1.trim() : null,
            pincode: data.pincode ? data.pincode.trim() : null
        };

        if (editingBranch) {
            updateBranch(
                { branchId: editingBranch.id, data: payload },
                { onSuccess: () => setModalOpen(false) }
            );
        } else {
            createBranch(payload, {
                onSuccess: () => setModalOpen(false)
            });
        }
    }, [editingBranch, createBranch, updateBranch]);

    const handleOpenDelete = (branch) => {
        setBranchToDelete(branch);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!branchToDelete) return;
        deleteBranch(branchToDelete.id, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setBranchToDelete(null);
            }
        });
    };

    const hoBranch = branches.find(b => b.isHeadOffice);

    // Toolbar Header
    const headerToolbar = noCard ? (
        <div className="d-flex justify-content-between align-items-center py-2.5 px-4 bg-light border-bottom flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center gap-1.5 small fw-semibold text-dark">
                    <FaBuilding className="text-primary" size={13} />
                    <span>{branches.length} Facility Location{branches.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-muted">•</span>
                {hoBranch ? (
                    <div className="d-flex align-items-center gap-1.5 small text-success fw-semibold">
                        <FaStar size={11} className="text-warning" />
                        <span>Head Office: {hoBranch.branchName} ({hoBranch.branchCode})</span>
                    </div>
                ) : (
                    <div className="d-flex align-items-center gap-1 small text-warning fw-semibold">
                        <span>⚠️ No Head Office assigned</span>
                    </div>
                )}
            </div>
            {!readOnly ? (
                <Button
                    variant="primary"
                    size="sm"
                    className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold shadow-sm"
                    onClick={handleOpenCreate}
                >
                    <FaPlus size={11} /> Add Branch
                </Button>
            ) : (
                <Badge bg="light" text="dark" className="border fw-semibold px-2.5 py-1.5" style={{ fontSize: '0.74rem' }}>
                    View-Only Directory
                </Badge>
            )}
        </div>
    ) : (
        <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3 px-4 border-bottom">
            <div>
                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                    <FaBuilding className="text-primary" />
                    Internal Firm Branches & Locations
                </h6>
                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Manage warehouses, manufacturing plants, and regional offices belonging to this firm.
                </span>
            </div>
            {!readOnly && (
                <Button
                    variant="primary"
                    size="sm"
                    className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold shadow-sm"
                    onClick={handleOpenCreate}
                >
                    <FaPlus size={11} /> Add Branch
                </Button>
            )}
        </Card.Header>
    );

    // Table Body
    const tableBody = (
        <div className="firm-branch-manager-container">
            {isLoading ? (
                <div className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <span className="ms-2 small fw-semibold">Loading branch network...</span>
                </div>
            ) : branches.length === 0 ? (
                <div className="empty-branch-card">
                    <div className="empty-branch-icon">
                        <FaBuilding />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">No Branches Configured</h6>
                    <p className="text-muted small mb-3" style={{ maxWidth: '380px', margin: '0 auto' }}>
                        This firm currently has no registered physical locations or branches.
                    </p>
                    {!readOnly && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleOpenCreate}
                            className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold shadow-sm"
                        >
                            <FaPlus size={11} /> Add Head Office / Branch
                        </Button>
                    )}
                </div>
            ) : (
                <div className="table-responsive">
                    <Table className="branch-table mb-0 align-middle" hover>
                        <thead>
                            <tr>
                                <th className="ps-4" style={{ minWidth: '220px' }}>Branch Facility</th>
                                <th style={{ width: '110px' }}>Code</th>
                                <th style={{ width: '130px' }}>Type</th>
                                <th style={{ minWidth: '150px' }}>Branch GSTIN</th>
                                <th style={{ minWidth: '160px' }}>Contact</th>
                                <th style={{ minWidth: '200px' }}>Physical Address</th>
                                {!readOnly && <th className="text-center pe-4" style={{ width: '100px' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map((b) => (
                                <tr key={b.id} className={b.isHeadOffice ? 'row-ho' : ''}>
                                    {/* Branch Facility Name */}
                                    <td className="ps-4">
                                        <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                            <FaBuilding className="text-muted opacity-75" size={12} />
                                            <span>{b.branchName}</span>
                                        </div>
                                    </td>

                                    {/* Code */}
                                    <td>
                                        <span className="branch-code-pill">
                                            {b.branchCode}
                                        </span>
                                    </td>

                                    {/* Type */}
                                    <td>
                                        {b.isHeadOffice ? (
                                            <span className="badge-ho">
                                                <FaStar size={10} /> Head Office
                                            </span>
                                        ) : (
                                            <Badge bg="light" text="secondary" className="border fw-semibold" style={{ fontSize: '0.72rem' }}>
                                                Branch
                                            </Badge>
                                        )}
                                    </td>

                                    {/* GSTIN */}
                                    <td>
                                        {b.gstin ? (
                                            <span className="font-monospace fw-semibold text-dark small">
                                                {b.gstin}
                                            </span>
                                        ) : (
                                            <span className="text-muted small fst-italic">Firm Default</span>
                                        )}
                                    </td>

                                    {/* Contact */}
                                    <td>
                                        <div className="d-flex flex-column" style={{ fontSize: '0.78rem' }}>
                                            {(b.phoneNumber || b.phone) ? (
                                                <span className="text-dark">📞 {b.phoneNumber || b.phone}</span>
                                            ) : null}
                                            {b.email ? (
                                                <span className="text-muted text-truncate" style={{ maxWidth: '160px' }}>
                                                    ✉️ {b.email}
                                                </span>
                                            ) : null}
                                            {!(b.phoneNumber || b.phone) && !b.email && (
                                                <span className="text-muted">—</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Address */}
                                    <td>
                                        <div className="small text-muted text-truncate" style={{ maxWidth: '240px' }}>
                                            {b.addressLine1 ? (
                                                <span>{b.addressLine1}</span>
                                            ) : (
                                                <span>—</span>
                                            )}
                                            {b.pincode ? ` (${b.pincode})` : ''}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    {!readOnly && (
                                        <td className="text-center pe-4">
                                            <div className="d-flex align-items-center justify-content-center gap-1">
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip>Edit Branch Details</Tooltip>}
                                                >
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="branch-action-btn"
                                                        onClick={() => handleOpenEdit(b)}
                                                    >
                                                        <FaPen size={11} />
                                                    </Button>
                                                </OverlayTrigger>

                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            {b.isHeadOffice && branches.length === 1
                                                                ? 'Cannot delete the only Head Office branch'
                                                                : 'Delete Branch'}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <span>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            className="branch-action-btn"
                                                            onClick={() => handleOpenDelete(b)}
                                                            disabled={b.isHeadOffice && branches.length === 1}
                                                        >
                                                            <FaTrash size={11} />
                                                        </Button>
                                                    </span>
                                                </OverlayTrigger>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </div>
    );

    return (
        <>
            {noCard ? (
                <div className="firm-branch-manager-modal-wrapper">
                    {headerToolbar}
                    {tableBody}
                </div>
            ) : (
                <Card className="mt-4 shadow-sm border bg-white firm-table-card">
                    {headerToolbar}
                    <Card.Body className="p-0">
                        {tableBody}
                    </Card.Body>
                </Card>
            )}

            {/* Create / Edit Branch Modal with react-hook-form */}
            <Modal
                show={modalOpen}
                onHide={() => setModalOpen(false)}
                size="lg"
                centered
                backdrop="static"
            >
                <Form noValidate onSubmit={handleSubmit(onFormSubmit)}>
                    <Modal.Header closeButton>
                        <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                            <FaBuilding className="text-primary" size={18} />
                            <span>{editingBranch ? `Edit Branch: ${editingBranch.branchName}` : 'Add New Branch'}</span>
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="p-4">
                        <Row>
                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="branchName"
                                        placeholder="Branch Name"
                                        isInvalid={!!errors.branchName}
                                        {...register("branchName")}
                                    />
                                    <Form.Label htmlFor="branchName">
                                        Branch Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.branchName?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="branchCode"
                                        placeholder="Branch Code"
                                        isInvalid={!!errors.branchCode}
                                        {...register("branchCode", {
                                            onChange: (e) => {
                                                setValue("branchCode", e.target.value.toUpperCase(), { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="branchCode">
                                        Branch Code <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.branchCode?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="branchGstin"
                                        placeholder="GSTIN"
                                        maxLength={15}
                                        isInvalid={!!errors.gstin}
                                        className="text-uppercase font-monospace"
                                        {...register("gstin", {
                                            onChange: (e) => {
                                                setValue("gstin", e.target.value.toUpperCase(), { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="branchGstin">
                                        GSTIN
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.gstin?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="branchPhone"
                                        placeholder="Phone Number"
                                        isInvalid={!!errors.phoneNumber}
                                        {...register("phoneNumber")}
                                    />
                                    <Form.Label htmlFor="branchPhone">
                                        Phone Number
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.phoneNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="email"
                                        id="branchEmail"
                                        placeholder="Email"
                                        isInvalid={!!errors.email}
                                        {...register("email")}
                                    />
                                    <Form.Label htmlFor="branchEmail">
                                        Email
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="branchPincode"
                                        placeholder="Pincode"
                                        maxLength={10}
                                        isInvalid={!!errors.pincode}
                                        {...register("pincode")}
                                    />
                                    <Form.Label htmlFor="branchPincode">
                                        Pincode
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.pincode?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col md={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        as="textarea"
                                        id="branchAddress"
                                        placeholder="Address"
                                        style={{ height: '80px' }}
                                        isInvalid={!!errors.addressLine1}
                                        {...register("addressLine1")}
                                    />
                                    <Form.Label htmlFor="branchAddress">
                                        Address
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.addressLine1?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col md={12}>
                                <div className="d-flex align-items-center justify-content-between p-3 rounded bg-light border mb-2">
                                    <div>
                                        <div className="fw-semibold text-dark small d-flex align-items-center gap-1.5">
                                            <FaStar className="text-warning" size={13} />
                                            Head Office Designation
                                        </div>
                                        <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                                            Mark this facility as the primary head office for operations and billing
                                        </div>
                                    </div>
                                    <Form.Check
                                        type="switch"
                                        id="isHeadOfficeSwitch"
                                        {...register("isHeadOffice")}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="light" size="sm" onClick={() => setModalOpen(false)} className="px-3">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isCreating || isUpdating}
                            className="px-4 fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
                        >
                            {isCreating || isUpdating ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{editingBranch ? 'Update Branch' : 'Save Branch'}</span>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Enhanced Delete Confirmation Modal */}
            <Modal show={deleteModalOpen} onHide={() => setDeleteModalOpen(false)} centered backdrop="static" className="firm-module-root">
                <Modal.Header closeButton className="py-3 px-4 border-bottom">
                    <Modal.Title className="h6 fw-bold text-danger d-flex align-items-center gap-2">
                        <FaTrash size={14} /> Delete Firm Branch
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p className="mb-2">
                        Are you sure you want to delete branch <strong>"{branchToDelete?.branchName}"</strong> ({branchToDelete?.branchCode})?
                    </p>
                    <p className="text-muted small mb-0">
                        Existing transactions will retain their historical records, but this branch will no longer be available for new transactions or user assignments.
                    </p>
                </Modal.Body>
                <Modal.Footer className="py-2.5 px-4 border-top">
                    <Button variant="light" size="sm" onClick={() => setDeleteModalOpen(false)} className="px-3 fw-semibold">
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="px-3 fw-semibold d-inline-flex align-items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <span>Delete Branch</span>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default React.memo(FirmBranchManager);
