import React from 'react';
import { Nav, Badge } from 'react-bootstrap';
import { FaList, FaTrashAlt } from 'react-icons/fa';

/**
 * TrashTabFilter Component
 * Sleek tab switcher for toggling between Active records and Trashed records.
 */
const TrashTabFilter = ({
    isTrash = false,
    onTabChange,
    activeCount,
    trashCount,
    activeLabel = 'Active Records',
    trashLabel = 'Recycle Bin',
    className = ''
}) => {
    return (
        <Nav
            variant="pills"
            className={`trash-tab-filter d-inline-flex p-1 bg-soft-light rounded-pill border gap-1 ${className}`}
            style={{ fontSize: '0.82rem', fontWeight: 500 }}
        >
            <Nav.Item>
                <Nav.Link
                    active={!isTrash}
                    onClick={() => onTabChange(false)}
                    className={`d-flex align-items-center gap-2 py-1 px-3 rounded-pill transition-all cursor-pointer ${
                        !isTrash
                            ? 'bg-primary text-white shadow-sm fw-semibold'
                            : 'text-secondary hover-primary'
                    }`}
                    style={{ transition: 'all 0.18s ease-in-out' }}
                >
                    <FaList size={11} />
                    <span>{activeLabel}</span>
                    {activeCount !== undefined && activeCount !== null && (
                        <Badge
                            bg={!isTrash ? 'white' : 'light'}
                            className={`ms-1 ${!isTrash ? 'text-primary' : 'text-muted'}`}
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                        >
                            {activeCount}
                        </Badge>
                    )}
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    active={isTrash}
                    onClick={() => onTabChange(true)}
                    className={`d-flex align-items-center gap-2 py-1 px-3 rounded-pill transition-all cursor-pointer ${
                        isTrash
                            ? 'bg-danger text-white shadow-sm fw-semibold'
                            : 'text-secondary hover-danger'
                    }`}
                    style={{ transition: 'all 0.18s ease-in-out' }}
                >
                    <FaTrashAlt size={11} />
                    <span>{trashLabel}</span>
                    {trashCount !== undefined && trashCount !== null && (
                        <Badge
                            bg={isTrash ? 'white' : 'light'}
                            className={`ms-1 ${isTrash ? 'text-danger' : 'text-muted'}`}
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                        >
                            {trashCount}
                        </Badge>
                    )}
                </Nav.Link>
            </Nav.Item>
        </Nav>
    );
};

export default React.memo(TrashTabFilter);
