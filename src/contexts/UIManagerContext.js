// contexts/UIManagerContext.js
import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmModal from "../components/modal/ConfirmModal";
import { useSelector } from "react-redux";

const UIManagerContext = createContext();
export const useUIManager = () => useContext(UIManagerContext);

export const UIManagerProvider = ({ children }) => {
    const { isLoading } = useSelector(state => state.uiModalReducer);

    /** MODAL STATE */
    const [modalState, setModalState] = useState({ type: null, props: {} });

    const showModal = useCallback((type, props) => {
        setModalState({ type, props });
    }, []);

    const closeModal = useCallback(() => {
        setModalState({ type: null, props: {} });
    }, []);

    /** TOAST STATE */
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    return (
        <UIManagerContext.Provider value={{ showModal, closeModal, showToast }}>
            {children}

            {/* Render Modal based on type */}
            {modalState.type === "confirm" && (
                <ConfirmModal
                    {...modalState.props}
                    isLoading={isLoading}
                    onClose={closeModal}
                />
            )}
        </UIManagerContext.Provider>
    );
};