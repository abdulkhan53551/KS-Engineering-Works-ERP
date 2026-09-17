import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, Form } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveFirm, setActiveBranch } from '../../store/firm.slice';

const BranchSelectModal = ({
    show,
    onClose,
    onProceed,
    title = 'Select Issuing Location',
    actionLabel = 'Continue'
}) => {
    const dispatch = useDispatch();
    const { activeFirm, userFirms = [] } = useSelector((state) => state.firmReducer || {});

    const isConsolidatedAllFirms = !activeFirm || activeFirm?.id === 'all';

    const [selectedFirmId, setSelectedFirmId] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [switchHeaderContext, setSwitchHeaderContext] = useState(false);

    // Resolve current firm based on mode
    const currentFirm = isConsolidatedAllFirms
        ? (userFirms.find(f => f.id === Number(selectedFirmId)) || userFirms[0])
        : activeFirm;

    const branches = currentFirm?.branches || [];

    useEffect(() => {
        if (show) {
            if (isConsolidatedAllFirms && userFirms.length > 0) {
                const initialFirm = userFirms.find(f => f.isDefault) || userFirms[0];
                setSelectedFirmId(initialFirm?.id);
                const defaultBranch = initialFirm?.branches?.find(b => b.isHeadOffice) || initialFirm?.branches?.[0];
                if (defaultBranch) setSelectedBranchId(defaultBranch.id);
            } else if (activeFirm) {
                const defaultBranch = branches.find(b => b.isHeadOffice) || branches[0];
                if (defaultBranch) setSelectedBranchId(defaultBranch.id);
            }
        }
    }, [show, isConsolidatedAllFirms, activeFirm, userFirms]);

    // Update branches when selected firm changes in consolidated mode
    const handleFirmSelect = (firmId) => {
        setSelectedFirmId(firmId);
        const f = userFirms.find(x => x.id === Number(firmId));
        const defaultBranch = f?.branches?.find(b => b.isHeadOffice) || f?.branches?.[0];
        setSelectedBranchId(defaultBranch ? defaultBranch.id : null);
    };

    const handleConfirm = () => {
        const chosenBranch = branches.find(b => b.id === Number(selectedBranchId));
        if (!chosenBranch) return;

        if (switchHeaderContext) {
            if (isConsolidatedAllFirms && currentFirm) {
                dispatch(setActiveFirm(currentFirm));
            }
            dispatch(setActiveBranch(chosenBranch));
        }

        onProceed(chosenBranch, currentFirm);
        onClose();
    };

    return (
        <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton className="border-0 pb-0">
                <div>
                    <Modal.Title className="h5 fw-bold mb-1">
                        📍 {title}
                    </Modal.Title>
                    {!isConsolidatedAllFirms && (
                        <div className="text-muted small">
                            Firm: <span className="fw-semibold text-dark">{activeFirm?.firmName || 'Active Firm'}</span>
                        </div>
                    )}
                </div>
            </Modal.Header>
            <Modal.Body className="pt-3">
                <div className="alert alert-soft-primary py-2 px-3 mb-3 d-flex align-items-center gap-2 small rounded-3">
                    <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                    <div>
                        {isConsolidatedAllFirms
                            ? <>You are currently in <strong>All Firms (Consolidated Group)</strong> mode. Please specify which firm and branch is issuing this record.</>
                            : <>You are currently in <strong>All Branches (Consolidated)</strong> mode. Please select which branch is issuing this transaction.</>
                        }
                    </div>
                </div>

                {isConsolidatedAllFirms && (
                    <div className="mb-3">
                        <Form.Label className="fw-semibold small text-dark mb-1">
                            Issuing Firm <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                            value={selectedFirmId || ''}
                            onChange={(e) => handleFirmSelect(e.target.value)}
                            className="form-select-sm fw-semibold"
                        >
                            {userFirms.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.firmName} {f.code ? `(${f.code})` : ''}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                )}

                <Form.Label className="fw-semibold small text-dark mb-1">
                    Issuing Branch <span className="text-danger">*</span>
                </Form.Label>
                <div className="d-flex flex-column gap-2 mb-3">
                    {branches && branches.length > 0 ? (
                        branches.map((b) => {
                            const isSelected = Number(selectedBranchId) === Number(b.id);
                            return (
                                <div
                                    key={b.id}
                                    onClick={() => setSelectedBranchId(b.id)}
                                    className={`p-3 rounded-3 border transition-all cursor-pointer d-flex align-items-center justify-content-between ${
                                        isSelected
                                            ? 'border-primary bg-soft-primary shadow-sm'
                                            : 'border-light bg-light hover-bg-gray'
                                    }`}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease-in-out',
                                        borderWidth: isSelected ? '2px' : '1px'
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <Form.Check
                                            type="radio"
                                            name="branchSelection"
                                            checked={isSelected}
                                            onChange={() => setSelectedBranchId(b.id)}
                                            id={`branch-radio-${b.id}`}
                                            className="m-0"
                                        />
                                        <div>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-bold text-dark">{b.branchName}</span>
                                                {b.isHeadOffice && (
                                                    <Badge bg="success" pill style={{ fontSize: '0.65rem' }}>
                                                        Head Office
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-muted small mt-0.5">
                                                Code: <span className="fw-semibold">{b.branchCode}</span>
                                                {b.gstin && <span> • GSTIN: {b.gstin}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <span className="text-primary fw-bold" style={{ fontSize: '1.1rem' }}>✓</span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-4 text-muted small">
                            No branches available for this firm.
                        </div>
                    )}
                </div>

                <Form.Check
                    type="checkbox"
                    id="switch-context-checkbox"
                    label="Switch active header context to this firm & branch"
                    checked={switchHeaderContext}
                    onChange={(e) => setSwitchHeaderContext(e.target.checked)}
                    className="small text-secondary fw-semibold mt-2"
                />
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={!selectedBranchId}
                    className="px-4 fw-semibold"
                >
                    {actionLabel}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default React.memo(BranchSelectModal);
