import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BranchSelectModal from '../components/modal/BranchSelectModal';

export const useBranchAction = () => {
    const navigate = useNavigate();
    const { activeBranch, activeFirm } = useSelector((state) => state.firmReducer || {});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [modalTitle, setModalTitle] = useState('Select Issuing Branch');

    /**
     * executeWithBranch:
     * If activeBranch is selected and not in 'All Firms' mode, immediately calls onProceed(activeBranch, activeFirm).
     * If in "All Branches" or "All Firms" mode, opens BranchSelectModal first.
     */
    const executeWithBranch = useCallback((onProceedCallback, title = 'Select Issuing Location') => {
        if (activeBranch && activeFirm?.id !== 'all') {
            onProceedCallback(activeBranch, activeFirm);
        } else {
            setPendingAction(() => onProceedCallback);
            setModalTitle(title);
            setIsModalOpen(true);
        }
    }, [activeBranch, activeFirm]);

    /**
     * navigateWithBranch:
     * Shortcut to navigate to a target path, prompting for branch/firm if in consolidated mode.
     */
    const navigateWithBranch = useCallback((targetPath, title = 'Select Issuing Location') => {
        executeWithBranch((branch, firm) => {
            navigate(targetPath, { state: { issuingBranchId: branch?.id, issuingFirmId: firm?.id } });
        }, title);
    }, [executeWithBranch, navigate]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setPendingAction(null);
    }, []);

    const handleProceed = useCallback((chosenBranch, chosenFirm) => {
        if (pendingAction) {
            pendingAction(chosenBranch, chosenFirm);
        }
    }, [pendingAction]);

    const BranchModal = useCallback(() => (
        <BranchSelectModal
            show={isModalOpen}
            onClose={closeModal}
            onProceed={handleProceed}
            title={modalTitle}
        />
    ), [isModalOpen, closeModal, handleProceed, modalTitle]);

    return {
        executeWithBranch,
        navigateWithBranch,
        BranchModal,
        activeBranch,
        activeFirm
    };
};

export default useBranchAction;
