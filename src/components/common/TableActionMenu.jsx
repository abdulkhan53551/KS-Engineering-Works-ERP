import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Overlay } from 'react-bootstrap';
import { FaEllipsisV } from 'react-icons/fa';

/**
 * Custom hook to manage single-instance table action menu state.
 * Prevents multiple popups from persisting/stacking, handles auto-close
 * on pagination/filters change and table scroll.
 *
 * @param {Array} deps - Dependency list (e.g. [page, pageSize, search, filters]) that resets the menu
 */
export const useTableActionMenu = (deps = []) => {
    const [activeMenu, setActiveMenu] = useState(null);

    // Auto-close menu when page, search, or filters change
    useEffect(() => {
        setActiveMenu(null);
    }, deps);

    const toggleMenu = useCallback((id, item, target, extra = {}) => {
        setActiveMenu((prev) => (prev?.id === id ? null : { id, item, target, ...extra }));
    }, []);

    const closeMenu = useCallback(() => {
        setActiveMenu(null);
    }, []);

    const isOpen = useCallback((id) => activeMenu?.id === id, [activeMenu]);

    const tableWrapperProps = useMemo(() => ({
        onScroll: () => {
            if (activeMenu) setActiveMenu(null);
        }
    }), [activeMenu]);

    return {
        activeMenu,
        setActiveMenu,
        toggleMenu,
        closeMenu,
        isOpen,
        tableWrapperProps
    };
};

/**
 * Table Action Trigger Button Component.
 * Styled 3-dots trigger button that toggles the active menu for a specific row.
 */
export const TableActionTrigger = React.forwardRef(({
    isActive = false,
    className = '',
    title = 'More actions',
    children,
    onClick,
    ...rest
}, ref) => {
    return (
        <button
            ref={ref}
            type="button"
            className={`btn-action-more-dots ${isActive ? 'active' : ''} ${className}`}
            title={title}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}
            {...rest}
        >
            {children || <FaEllipsisV size={13} />}
        </button>
    );
});

TableActionTrigger.displayName = 'TableActionMenu.Trigger';

/**
 * Table Action Overlay Portal Component.
 * Renders a single-instance floating dropdown portal at document.body level.
 * Features:
 * - Zero clipping (renders outside table overflow container)
 * - Zero blank space (no artificial min-height needed)
 * - Zero stacking (only 1 menu in DOM)
 * - Safe ref guards (prevents 'Cannot read properties of null (reading ref)' on unmount)
 */
export const TableActionOverlay = ({
    activeMenu,
    onClose,
    placement = 'bottom-end',
    minWidth = 175,
    className = '',
    style = {},
    children
}) => {
    if (!activeMenu || !activeMenu.target) {
        return null;
    }

    return (
        <Overlay
            target={activeMenu.target}
            show={Boolean(activeMenu)}
            placement={placement}
            rootClose
            onHide={onClose}
            transition={false}
        >
            {({ placement: _p, arrowProps: _a, show: _s, popper: _pop, hasDoneInitialMeasure: _h, ...props }) => {
                const item = activeMenu?.item ?? activeMenu;
                if (!item) {
                    return <div {...props} style={{ ...props.style, display: 'none' }} />;
                }

                return (
                    <div
                        {...props}
                        className={`action-dropdown-menu shadow show ${className}`}
                        style={{
                            ...props.style,
                            zIndex: 1060,
                            position: 'absolute',
                            backgroundColor: '#ffffff',
                            minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
                            ...style
                        }}
                        onClick={onClose}
                    >
                        {typeof children === 'function' ? children(item, activeMenu) : children}
                    </div>
                );
            }}
        </Overlay>
    );
};

TableActionOverlay.displayName = 'TableActionMenu.Overlay';

export const TableActionMenu = {
    Trigger: TableActionTrigger,
    Overlay: TableActionOverlay
};

export default TableActionMenu;
