import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Table, Button, Form, InputGroup, OverlayTrigger, Tooltip, Badge, FormCheck } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../../components/Card';
import {
    FaPen,
    FaTrash,
    FaEye,
    FaPlus,
    FaSearch,
    FaTimes,
    FaSort,
    FaSortAlphaUpAlt,
    FaSortAlphaDownAlt,
    FaSyncAlt,
    FaUndo,
    FaExclamationTriangle
} from 'react-icons/fa';
import PageLoader from '../../../../components/PageLoader';
import PaginationBar from '../../../../components/PaginationBar';
import {
    useAddressTypesList,
    useDeleteAddressType,
    useRestoreAddressType,
    useBulkDeleteAddressTypes,
    useBulkRestoreAddressTypes
} from '../../hooks/useMastersApi';
import AddressTypeModal from '../components/AddressTypeModal';
import TrashTabFilter from '../../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../../components/trash/BulkActionBar';
import moment from 'moment';
import useListManager from '../../../../hooks/useListManager';
import useTrashActions from '../../../../hooks/useTrashActions';

/**
 * AddressTypeList Component
 * Master list for Address Types with Recycle Bin, Multi-Selection, and Debounced Search.
 */
const AddressTypeList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

    const [modalState, setModalState] = useState({
        show: false,
        mode: 'create',
        selectedItem: null
    });

    // 1. Trash Actions Hook
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    } = useTrashActions({ entityName: 'Address Type' });

    // 2. Mutations
    const { mutate: deleteType, isPending: isDeleting } = useDeleteAddressType();
    const { mutate: restoreType, isPending: isRestoring } = useRestoreAddressType();
    const { mutate: bulkDeleteTypes } = useBulkDeleteAddressTypes();
    const { mutate: bulkRestoreTypes } = useBulkRestoreAddressTypes();

    // 3. Temp items for selection sync
    const [tempItems, setTempItems] = useState([]);

    // 4. List Manager Hook
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        search: searchTerm,
        debouncedSearch,
        handleSearch,
        clearSearch: handleClearSearch,
        isTrash,
        handleTabChange,
        selectedIds,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount
    } = useListManager({
        items: tempItems,
        idKey: 'id',
        initialPageSize: 10
    });

    const { data: addressTypes = [], isLoading, isFetching, refetch } = useAddressTypesList({ trash: isTrash });

    // Auto-open modal if URL has ?action=create
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            setModalState({
                show: true,
                mode: 'create',
                selectedItem: null
            });
            searchParams.delete('action');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Sorting handler
    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? (
                <FaSortAlphaUpAlt className="text-primary ms-1" size={10} />
            ) : (
                <FaSortAlphaDownAlt className="text-primary ms-1" size={10} />
            );
        }
        return <FaSort className="text-muted ms-1 opacity-25" size={10} />;
    };

    // Filter and Sort Data (Client-side)
    const sortedAndFilteredList = useMemo(() => {
        let items = [...addressTypes];

        // Search Filter
        if (debouncedSearch.trim()) {
            const term = debouncedSearch.toLowerCase().trim();
            items = items.filter((item) => {
                const idStr = String(item.id || '');
                const code = (item.code || item.typeCode || '').toLowerCase();
                const name = (item.name || item.typeName || '').toLowerCase();
                const desc = (item.description || '').toLowerCase();
                const delBy = (item.deletedBy || '').toLowerCase();
                return idStr.includes(term) || code.includes(term) || name.includes(term) || desc.includes(term) || delBy.includes(term);
            });
        }

        // Sorting
        if (sortConfig.key) {
            items.sort((a, b) => {
                let aVal = '';
                let bVal = '';

                if (sortConfig.key === 'id') {
                    aVal = a.id ?? 0;
                    bVal = b.id ?? 0;
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                } else if (sortConfig.key === 'code') {
                    aVal = (a.code || a.typeCode || '').toLowerCase();
                    bVal = (b.code || b.typeCode || '').toLowerCase();
                } else if (sortConfig.key === 'name') {
                    aVal = (a.name || a.typeName || '').toLowerCase();
                    bVal = (b.name || b.typeName || '').toLowerCase();
                } else if (sortConfig.key === 'description') {
                    aVal = (a.description || '').toLowerCase();
                    bVal = (b.description || '').toLowerCase();
                } else if (sortConfig.key === 'updatedAt' || sortConfig.key === 'lastModified') {
                    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                    return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [addressTypes, debouncedSearch, sortConfig]);

    // Pagination calculations
    const total = sortedAndFilteredList.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = Math.min(page * pageSize, total);

    const pagedList = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedAndFilteredList.slice(start, start + pageSize);
    }, [sortedAndFilteredList, page, pageSize]);

    // Sync paged list with useListManager
    useEffect(() => {
        setTempItems(pagedList);
    }, [pagedList]);

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

    return (
        <>
            <Row>
                <Col sm="12">
                    <Card>
                        {/* 1. Header with Title, Tabs, Count, and Add Button */}
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="header-title d-flex align-items-center gap-2">
                                <h4 className="card-title mb-0">Address Types</h4>
                                {!isLoading && total > 0 && (
                                    <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-1">
                                        {total} Total
                                    </Badge>
                                )}
                            </div>

                            {/* Active vs Recycle Bin Tabs */}
                            <TrashTabFilter isTrash={isTrash} onTabChange={handleTabChange} />

                            <div className="d-flex align-items-center gap-2">
                                {!isTrash && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="d-flex align-items-center gap-1.5 shadow-sm"
                                        onClick={() => handleOpenModal('create')}
                                        style={{ fontSize: '0.82rem', fontWeight: 600 }}
                                    >
                                        <FaPlus size={11} />
                                        <span>Add Address Type</span>
                                    </Button>
                                )}
                            </div>
                        </Card.Header>

                        {/* Bulk Action Bar */}
                        <BulkActionBar
                            selectedCount={selectedCount}
                            isTrash={isTrash}
                            onBulkDelete={() => confirmBulkSoftDelete(selectedCount, () => {
                                bulkDeleteTypes({ ids: selectedIds, isPermanentDelete: false });
                                handleDeselectAll();
                            })}
                            onBulkRestore={() => confirmBulkRestore(selectedCount, () => {
                                bulkRestoreTypes({ ids: selectedIds });
                                handleDeselectAll();
                            })}
                            onBulkPermanentDelete={() => confirmBulkPermanentDelete(selectedCount, () => {
                                bulkDeleteTypes({ ids: selectedIds, isPermanentDelete: true });
                                handleDeselectAll();
                            })}
                            onDeselectAll={handleDeselectAll}
                        />

                        <Card.Body className="px-0">
                            {/* PageLoader for background refetching */}
                            <PageLoader loading={isFetching && !isLoading} />

                            {/* 2. Controls & Filter Bar with Integrated Search & Refresh */}
                            <Col className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                                {/* Show Entries Selector */}
                                <div className="d-flex align-items-center">
                                    <Form.Label className="mb-0 text-muted small">Show</Form.Label>
                                    <Form.Select
                                        className="form-select-sm"
                                        style={{ marginLeft: '0.5rem', marginRight: '0.5rem', width: '5.8rem', minWidth: '5.8rem' }}
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                            handleDeselectAll();
                                        }}
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </Form.Select>
                                    <Form.Label className="mb-0 text-muted small">entries</Form.Label>
                                </div>

                                {/* Integrated Search & Refresh Input Group */}
                                <div className="d-flex align-items-center flex-wrap gap-2">
                                    <InputGroup size="sm" style={{ width: '19rem' }}>
                                        <InputGroup.Text className="bg-white border-end-0">
                                            <FaSearch className="text-muted" size={12} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="search"
                                            placeholder="Search address types..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            className="border-start-0 border-end-0 ps-0"
                                            style={{ fontSize: '0.84rem' }}
                                        />
                                        {searchTerm && (
                                            <Button
                                                variant="outline-secondary"
                                                className="bg-white border-start-0 border-end-0 px-2"
                                                onClick={handleClearSearch}
                                                title="Clear search"
                                            >
                                                <FaTimes size={11} className="text-muted" />
                                            </Button>
                                        )}
                                        <OverlayTrigger placement="top" overlay={<Tooltip>Refresh list</Tooltip>}>
                                            <Button
                                                variant="outline-secondary"
                                                className="bg-white border-start-0 px-2.5 d-flex align-items-center"
                                                onClick={() => refetch()}
                                                disabled={isFetching}
                                            >
                                                <FaSyncAlt size={11} className={isFetching ? 'fa-spin text-primary' : 'text-muted'} />
                                            </Button>
                                        </OverlayTrigger>
                                    </InputGroup>
                                </div>
                            </Col>

                            {/* 3. Table Content */}
                            <div className="table-responsive">
                                <Table className="table-sortable ms-1 me-1 align-middle mb-0" striped bordered hover responsive>
                                    <thead className="light">
                                        <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            <th className="text-center" style={{ width: '40px', minWidth: '40px', padding: '0.45rem 0.3rem' }}>
                                                <FormCheck
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = isIndeterminate;
                                                    }}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th
                                                className="text-center cursor-pointer user-select-none py-2"
                                                style={{ width: '55px', minWidth: '55px', padding: '0.45rem 0.3rem' }}
                                                onClick={() => handleSort('id')}
                                            >
                                                #ID {renderSortIcon('id')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ width: '160px', minWidth: '160px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('code')}
                                            >
                                                Type Code {renderSortIcon('code')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '200px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('name')}
                                            >
                                                Type Name {renderSortIcon('name')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '220px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('description')}
                                            >
                                                Description {renderSortIcon('description')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '165px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('updatedAt')}
                                            >
                                                Last Modified {renderSortIcon('updatedAt')}
                                            </th>
                                            {isTrash && (
                                                <>
                                                    <th style={{ minWidth: '165px', padding: '0.45rem 0.5rem' }}>Deleted Date</th>
                                                    <th style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}>Deleted By</th>
                                                </>
                                            )}
                                            <th
                                                className="text-center py-2"
                                                style={{ width: '120px', minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                            >
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '0.86rem' }}>
                                        {isLoading ? (
                                            Array.from({ length: 4 }).map((_, idx) => (
                                                <tr key={`address-type-skel-${idx}`}>
                                                    <td className="text-center py-2"><span className="placeholder col-6 rounded" /></td>
                                                    <td className="text-center py-2"><span className="placeholder col-6 rounded" /></td>
                                                    <td className="py-2"><span className="placeholder col-8 rounded" /></td>
                                                    <td className="py-2"><span className="placeholder col-10 rounded" /></td>
                                                    <td className="py-2"><span className="placeholder col-12 rounded" /></td>
                                                    <td className="py-2"><span className="placeholder col-10 rounded" /></td>
                                                    {isTrash && (
                                                        <>
                                                            <td className="py-2"><span className="placeholder col-8 rounded" /></td>
                                                            <td className="py-2"><span className="placeholder col-8 rounded" /></td>
                                                        </>
                                                    )}
                                                    <td className="text-center py-2"><span className="placeholder col-8 rounded" /></td>
                                                </tr>
                                            ))
                                        ) : pagedList.length === 0 ? (
                                            <tr>
                                                <td colSpan={isTrash ? 9 : 7} className="text-center py-5 text-muted">
                                                    <div className="mb-2">
                                                        {isTrash
                                                            ? (searchTerm ? `No deleted address types matching "${searchTerm}"` : 'Recycle Bin is empty.')
                                                            : (searchTerm ? `No address types matching "${searchTerm}"` : 'No address types found.')
                                                        }
                                                    </div>
                                                    {!searchTerm && !isTrash && (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleOpenModal('create')}
                                                            style={{ fontSize: '0.80rem' }}
                                                        >
                                                            + Add First Address Type
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            pagedList.map((item) => (
                                                <tr key={item.id} className={selectedIds.includes(item.id) ? 'table-active' : ''}>
                                                    <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                        <FormCheck
                                                            type="checkbox"
                                                            checked={selectedIds.includes(item.id)}
                                                            onChange={() => handleSelectRow(item.id)}
                                                        />
                                                    </td>
                                                    <td className="text-center text-muted fw-medium" style={{ padding: '0.45rem 0.3rem' }}>
                                                        {item.id}
                                                    </td>
                                                    <td style={{ padding: '0.45rem 0.5rem' }}>
                                                        <Badge bg="soft-info" className="text-info fw-bold font-monospace px-2 py-1" style={{ fontSize: '0.78rem' }}>
                                                            {item.code || item.typeCode || '—'}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ padding: '0.45rem 0.5rem' }}>
                                                        <span className="fw-semibold text-dark">{item.name || item.typeName || '—'}</span>
                                                    </td>
                                                    <td style={{ padding: '0.45rem 0.5rem' }}>
                                                        <span className="text-muted small">{item.description || '—'}</span>
                                                    </td>
                                                    <td style={{ padding: '0.45rem 0.5rem' }}>
                                                        <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                            {item.updatedAt ? moment(item.updatedAt).format('DD/MM/YYYY, hh:mm A') : (item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY, hh:mm A') : '—')}
                                                        </span>
                                                    </td>
                                                    {isTrash && (
                                                        <>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                    {item.deletedAt ? moment(item.deletedAt).format('DD/MM/YYYY hh:mm A') : '—'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                <span className="text-dark small">
                                                                    {item.deletedBy || '—'}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                        <div className="d-inline-flex align-items-center gap-1">
                                                            {!isTrash ? (
                                                                <>
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

                                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Edit Type</Tooltip>}>
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                            onClick={() => handleOpenModal('edit', item)}
                                                                        >
                                                                            <FaPen size={10} />
                                                                        </Button>
                                                                    </OverlayTrigger>

                                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Move to Bin</Tooltip>}>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                            disabled={isDeleting}
                                                                            onClick={() => confirmSoftDelete(item.name || item.typeName || item.code, () => deleteType({ id: item.id, isPermanentDelete: false }))}
                                                                        >
                                                                            <FaTrash size={10} />
                                                                        </Button>
                                                                    </OverlayTrigger>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Restore Type</Tooltip>}>
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                            disabled={isRestoring}
                                                                            onClick={() => confirmRestore(item.name || item.typeName || item.code, () => restoreType(item.id))}
                                                                        >
                                                                            <FaUndo size={11} />
                                                                        </Button>
                                                                    </OverlayTrigger>

                                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Permanently Delete</Tooltip>}>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                            disabled={isDeleting}
                                                                            onClick={() => confirmPermanentDelete(item.name || item.typeName || item.code, () => deleteType({ id: item.id, isPermanentDelete: true }))}
                                                                        >
                                                                            <FaExclamationTriangle size={11} />
                                                                        </Button>
                                                                    </OverlayTrigger>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {/* 4. Pagination Bar Footer */}
                            {!isLoading && total > 0 && (
                                <Row className="align-items-center justify-content-between g-2 px-3 pt-3">
                                    <Col xs={12} md={6}>
                                        <div className="text-muted small">
                                            Showing {pageStart} to {pageEnd} of {total} entries
                                        </div>
                                    </Col>
                                    <Col xs={12} md={6} className="d-flex justify-content-md-end">
                                        <PaginationBar
                                            page={page}
                                            pageSize={pageSize}
                                            total={total}
                                            totalPages={totalPages}
                                            onPageChange={(newPage) => {
                                                setPage(newPage);
                                                handleDeselectAll();
                                            }}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {modalState.show && (
                <AddressTypeModal
                    show={modalState.show}
                    onHide={handleCloseModal}
                    mode={modalState.mode}
                    initialData={modalState.selectedItem}
                />
            )}
        </>
    );
};

export default AddressTypeList;
