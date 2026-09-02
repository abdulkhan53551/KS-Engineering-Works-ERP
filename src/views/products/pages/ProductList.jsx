import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Table, Button, Form, InputGroup, OverlayTrigger, Tooltip, Badge, FormCheck, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
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
    FaUndo,
    FaSyncAlt,
    FaCogs,
    FaBox,
    FaDraftingCompass,
    FaLayerGroup,
    FaClock,
    FaHistory,
    FaCopy,
    FaCheck,
    FaExclamationTriangle
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import PaginationBar from '../../../components/PaginationBar';
import {
    useProducts,
    useProductPagination,
    useDeleteProduct,
    useRestoreProduct,
    useBulkDeleteProducts,
    useBulkRestoreProducts
} from '../hooks/useApi';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import ProductDetailsDrawer from '../components/ProductDetailsDrawer';
import useListManager from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';
import defaultProductImage from '../../../assets/images/shapes/01.png';
import { toast } from 'react-toastify';
import moment from 'moment';

/**
 * Format date string safely to DD/MM/YYYY, hh:mm A
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const m = moment(dateStr);
        if (!m.isValid()) return '—';
        return m.format('DD/MM/YYYY, hh:mm A');
    } catch {
        return '—';
    }
};

const ITEM_TYPES = [
    { key: '', label: 'All Categories', icon: FaBox },
    { key: 'FINISHED_GOODS', label: 'Finished Goods', icon: FaBox, variant: 'primary' },
    { key: 'RAW_MATERIAL', label: 'Raw Materials', icon: FaLayerGroup, variant: 'warning' },
    { key: 'SERVICE', label: 'Machining Services', icon: FaCogs, variant: 'info' },
    { key: 'CONSUMABLE', label: 'Consumables', icon: FaDraftingCompass, variant: 'secondary' }
];

const getItemTypeBadge = (type) => {
    switch (type) {
        case 'FINISHED_GOODS':
            return (
                <span className="badge bg-soft-primary text-primary border border-primary-subtle px-2 py-1 d-inline-flex align-items-center gap-1.5">
                    <FaBox size={10} />
                    <span>Finished Good</span>
                </span>
            );
        case 'RAW_MATERIAL':
            return (
                <span className="badge bg-soft-warning text-warning border border-warning-subtle px-2 py-1 d-inline-flex align-items-center gap-1.5">
                    <FaLayerGroup size={10} />
                    <span>Raw Material</span>
                </span>
            );
        case 'SERVICE':
            return (
                <span className="badge bg-soft-info text-info border border-info-subtle px-2 py-1 d-inline-flex align-items-center gap-1.5">
                    <FaCogs size={10} />
                    <span>Machining Service</span>
                </span>
            );
        case 'CONSUMABLE':
            return (
                <span className="badge bg-soft-secondary text-secondary border border-secondary-subtle px-2 py-1 d-inline-flex align-items-center gap-1.5">
                    <FaDraftingCompass size={10} />
                    <span>Consumable</span>
                </span>
            );
        default:
            return <span className="badge bg-light text-dark border px-2 py-1">{type || '—'}</span>;
    }
};

const ProductList = () => {
    const navigate = useNavigate();

    // 1. Trash Actions Hook
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    } = useTrashActions({ entityName: 'Product', pluralEntityName: 'Products' });

    // 2. Extra Filters & Sort State
    const [itemTypeFilter, setItemTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

    // Quick View Drawer state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Copy indicator state
    const [copiedKey, setCopiedKey] = useState(null);

    // Temp items state to sync data with useListManager
    const [tempItems, setTempItems] = useState([]);

    // 3. List Manager Hook
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

    // 4. Queries & Mutations
    const queryParams = {
        page,
        pageSize,
        search: debouncedSearch,
        itemType: itemTypeFilter,
        status: statusFilter,
        trash: isTrash
    };

    const {
        data: products = [],
        isLoading: isProductsLoading,
        isFetching: isProductsFetching,
        isError,
        refetch: refetchProducts
    } = useProducts(queryParams);

    const {
        data: pagination = { page: 1, pageSize: 10, total: 0, totalPages: 1, offset: 0 },
        isLoading: isPaginationLoading,
        isFetching: isPaginationFetching,
        refetch: refetchPagination
    } = useProductPagination(queryParams);

    const isFetching = isProductsFetching || isPaginationFetching;
    const isLoading = isProductsLoading || isPaginationLoading;

    const handleRefresh = () => {
        refetchProducts();
        refetchPagination();
    };

    const { mutate: deleteProductMutate, isPending: isDeleting } = useDeleteProduct();
    const { mutate: restoreProductMutate, isPending: isRestoring } = useRestoreProduct();
    const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteProducts();
    const { mutate: bulkRestoreMutate, isPending: isBulkRestoring } = useBulkRestoreProducts();

    const isActionPending = isDeleting || isRestoring || isBulkDeleting || isBulkRestoring;

    const {
        total = 0,
        totalPages = 1,
        offset = (page - 1) * pageSize
    } = pagination;

    const pageStart = total === 0 ? 0 : offset + 1;
    const pageEnd = Math.min(offset + pageSize, total);

    // Sync items with ListManager for select all
    useEffect(() => {
        setTempItems(products);
    }, [products]);

    // 5. Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
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

    const sortedProducts = useMemo(() => {
        if (!sortConfig.key) return products;
        return [...products].sort((a, b) => {
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';
            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [products, sortConfig]);

    // Copy to clipboard helper
    const handleCopy = (text, keyName, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(keyName);
        toast.info(`${label} copied!`, { autoClose: 1500 });
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Quick View Drawer trigger
    const handleQuickView = (product) => {
        setSelectedProduct(product);
        setDrawerOpen(true);
    };

    // Clear all filters
    const handleClearAllFilters = () => {
        handleClearSearch();
        setItemTypeFilter('');
        setStatusFilter('');
        setPage(1);
    };

    const hasActiveFilters = Boolean(searchTerm || itemTypeFilter || statusFilter);

    // 6. Action Handlers
    const handleDelete = (id, name) => {
        if (isTrash) {
            confirmPermanentDelete(name, () => deleteProductMutate({ id, isPermanentDelete: true }));
        } else {
            confirmSoftDelete(name, () => deleteProductMutate({ id, isPermanentDelete: false }));
        }
    };

    const handleRestore = (id, name) => {
        confirmRestore(name, () => restoreProductMutate(id));
    };

    const handleBulkDelete = () => {
        if (isTrash) {
            confirmBulkPermanentDelete(selectedCount, () => {
                bulkDeleteMutate({ ids: selectedIds, isPermanentDelete: true }, {
                    onSuccess: () => handleDeselectAll()
                });
            });
        } else {
            confirmBulkSoftDelete(selectedCount, () => {
                bulkDeleteMutate({ ids: selectedIds, isPermanentDelete: false }, {
                    onSuccess: () => handleDeselectAll()
                });
            });
        }
    };

    const handleBulkRestore = () => {
        confirmBulkRestore(selectedCount, () => {
            bulkRestoreMutate({ ids: selectedIds }, {
                onSuccess: () => handleDeselectAll()
            });
        });
    };

    return (
        <div className="product-list-page">
            {/* MAIN CATALOG CARD */}
            <Card className="border-0 shadow-sm bg-white">
                {/* Header */}
                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-3 px-4 border-bottom bg-white">
                    <div className="header-title">
                        <div className="d-flex align-items-center gap-2">
                            <FaBox className="text-primary" size={18} />
                            <h5 className="card-title mb-0 fw-bold text-dark">
                                {isTrash ? 'Products Recycle Bin' : 'Product & Engineering Master'}
                            </h5>
                            {!isTrash && total > 0 && (
                                <Badge bg="soft-primary" className="text-primary rounded-pill font-monospace px-2 py-0.5" style={{ fontSize: '0.74rem' }}>
                                    {total} Records
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                            {isTrash
                                ? 'Restore or permanently delete archived items and engineering components.'
                                : 'Catalog of manufactured parts, blueprints, metallurgy grades, and pricing.'}
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="btn-icon p-2 d-flex align-items-center justify-content-center rounded-2"
                            onClick={handleRefresh}
                            disabled={isFetching}
                            title="Refresh Catalog"
                        >
                            <FaSyncAlt className={isFetching ? 'fa-spin' : ''} size={12} />
                        </Button>

                        {!isTrash && (
                            <Link to="/masters/products/create">
                                <Button variant="primary" size="sm" className="d-flex align-items-center gap-2 px-3 fw-medium">
                                    <FaPlus size={11} />
                                    <span>Add Product</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    {/* Tabs & Search Controls */}
                    <div className="p-3 border-bottom bg-light bg-opacity-50">
                        <Row className="g-2 align-items-center">
                            {/* Active vs Trash Tab */}
                            <Col lg={4} md={5}>
                                <TrashTabFilter
                                    isTrash={isTrash}
                                    onTabChange={handleTabChange}
                                    activeLabel="Active Catalog"
                                    trashLabel="Recycle Bin"
                                />
                            </Col>

                            {/* Search Input */}
                            <Col lg={5} md={4}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                                        <FaSearch size={11} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by part name, SKU, DWG no, material grade, HSN..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="border-start-0 border-end-0 ps-0 shadow-none"
                                        style={{ fontSize: '0.84rem' }}
                                    />
                                    {searchTerm && (
                                        <InputGroup.Text
                                            className="bg-white border-start-0 cursor-pointer text-muted hover-danger"
                                            onClick={handleClearSearch}
                                            title="Clear search"
                                        >
                                            <FaTimes size={11} />
                                        </InputGroup.Text>
                                    )}
                                </InputGroup>
                            </Col>

                            {/* Status Filter */}
                            <Col lg={3} md={3}>
                                <Form.Select
                                    size="sm"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="shadow-none"
                                    style={{ fontSize: '0.84rem' }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="ACTIVE">Active Only</option>
                                    <option value="INACTIVE">Inactive Only</option>
                                </Form.Select>
                            </Col>
                        </Row>

                        {/* Category Pills & Reset Filters */}
                        <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="small text-muted me-1 fw-semibold" style={{ fontSize: '0.76rem' }}>Category:</span>
                                {ITEM_TYPES.map((t) => {
                                    const isActive = itemTypeFilter === t.key;
                                    const IconComp = t.icon;
                                    return (
                                        <Button
                                            key={t.key}
                                            variant={isActive ? 'primary' : 'outline-secondary'}
                                            size="sm"
                                            className="py-1 px-3 rounded-pill small d-flex align-items-center shadow-none border"
                                            style={{ fontSize: '0.78rem' }}
                                            onClick={() => {
                                                setItemTypeFilter(t.key);
                                                setPage(1);
                                            }}
                                        >
                                            <IconComp size={11} className="me-2" />
                                            <span>{t.label}</span>
                                        </Button>
                                    );
                                })}
                            </div>

                            {hasActiveFilters && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-decoration-none text-danger small d-flex align-items-center gap-1"
                                    onClick={handleClearAllFilters}
                                    style={{ fontSize: '0.76rem' }}
                                >
                                    <FaTimes size={10} />
                                    <span>Reset All Filters</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bulk Action Bar */}
                    <BulkActionBar
                        selectedCount={selectedCount}
                        isTrash={isTrash}
                        onBulkRestore={handleBulkRestore}
                        onBulkDelete={handleBulkDelete}
                        onDeselectAll={handleDeselectAll}
                        isActionPending={isActionPending}
                    />

                    {/* Table */}
                    {isLoading ? (
                        <PageLoader />
                    ) : sortedProducts.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="avatar avatar-60 rounded-circle bg-soft-primary mx-auto mb-3 d-flex align-items-center justify-content-center">
                                <FaBox size={24} className="text-primary" />
                            </div>
                            <h6 className="text-dark fw-bold mb-1">No products found</h6>
                            <p className="text-muted small mb-3">
                                {searchTerm || itemTypeFilter || statusFilter
                                    ? 'No products matched your active filter criteria.'
                                    : isTrash
                                        ? 'The product recycle bin is currently empty.'
                                        : 'Start by cataloging your first manufactured component or raw material.'}
                            </p>
                            {hasActiveFilters ? (
                                <Button variant="outline-primary" size="sm" onClick={handleClearAllFilters}>
                                    Clear Filters
                                </Button>
                            ) : !isTrash ? (
                                <Link to="/masters/products/create">
                                    <Button variant="primary" size="sm">
                                        <FaPlus className="me-1" size={11} />
                                        <span>Add First Product</span>
                                    </Button>
                                </Link>
                            ) : null}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table className="table-sortable align-middle mb-0" striped bordered hover responsive style={{ fontSize: '0.86rem' }}>
                                <thead className="bg-light border-bottom text-secondary" style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                    <tr>
                                        <th style={{ width: '40px' }} className="text-center py-2.5">
                                            <FormCheck
                                                type="checkbox"
                                                checked={isAllSelected}
                                                ref={(input) => {
                                                    if (input) input.indeterminate = isIndeterminate;
                                                }}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={{ width: '55px', minWidth: '55px' }} onClick={() => handleSort('id')} className="cursor-pointer text-center py-2.5 user-select-none">
                                            <div className="d-flex align-items-center justify-content-center">
                                                <span>#ID</span>
                                                {renderSortIcon('id')}
                                            </div>
                                        </th>
                                        <th style={{ width: '55px', minWidth: '55px' }} className="text-center py-2.5 user-select-none">
                                            Logo
                                        </th>
                                        <th style={{ width: '130px', minWidth: '130px' }} onClick={() => handleSort('itemCode')} className="cursor-pointer py-2.5 user-select-none">
                                            <div className="d-flex align-items-center">
                                                <span>Part Code / SKU</span>
                                                {renderSortIcon('itemCode')}
                                            </div>
                                        </th>
                                        <th onClick={() => handleSort('name')} className="cursor-pointer py-2.5 user-select-none" style={{ minWidth: '220px' }}>
                                            <div className="d-flex align-items-center">
                                                <span>Product / Part Name</span>
                                                {renderSortIcon('name')}
                                            </div>
                                        </th>
                                        <th style={{ minWidth: '150px' }} onClick={() => handleSort('itemType')} className="cursor-pointer py-2.5 user-select-none">
                                            <div className="d-flex align-items-center">
                                                <span>Category</span>
                                                {renderSortIcon('itemType')}
                                            </div>
                                        </th>
                                        <th style={{ minWidth: '160px' }} className="py-2.5">Engineering Specs</th>
                                        <th style={{ minWidth: '120px' }} className="text-end py-2.5 cursor-pointer user-select-none" onClick={() => handleSort('sellingPrice')}>
                                            <div className="d-flex align-items-center justify-content-end">
                                                <span>Selling Rate (₹)</span>
                                                {renderSortIcon('sellingPrice')}
                                            </div>
                                        </th>
                                        <th style={{ width: '110px', minWidth: '110px' }} className="text-center py-2.5">GST & Unit</th>
                                        <th style={{ width: '85px', minWidth: '85px' }} className="text-center py-2.5 cursor-pointer user-select-none" onClick={() => handleSort('status')}>
                                            <div className="d-flex align-items-center justify-content-center">
                                                <span>Status</span>
                                                {renderSortIcon('status')}
                                            </div>
                                        </th>
                                        {isTrash ? (
                                            <>
                                                <th style={{ minWidth: '130px' }} className="py-2.5">Deleted Date</th>
                                                <th style={{ minWidth: '120px' }} className="py-2.5">Deleted By</th>
                                            </>
                                        ) : (
                                            <th style={{ minWidth: '150px' }} onClick={() => handleSort('updatedAt')} className="cursor-pointer py-2.5 user-select-none">
                                                <div className="d-flex align-items-center">
                                                    <span>Last Modified</span>
                                                    {renderSortIcon('updatedAt')}
                                                </div>
                                            </th>
                                        )}
                                        <th style={{ width: '115px', minWidth: '115px' }} className="text-center py-2.5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedProducts.map((p) => {
                                        const isSelected = selectedIds.includes(p.id);
                                        const createdAt = p.createdAt || p.created_at;
                                        const updatedAt = p.updatedAt || p.updated_at;
                                        const createdFormatted = formatDate(createdAt);
                                        const updatedFormatted = formatDate(updatedAt);

                                        const sellingRate = Number(p.sellingPrice || 0);
                                        const purchaseRate = Number(p.purchasePrice || 0);

                                        return (
                                            <tr key={p.id} className={isSelected ? 'table-active' : ''}>
                                                {/* Checkbox */}
                                                <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                    <FormCheck
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(p.id)}
                                                    />
                                                </td>

                                                {/* 1. #ID Column */}
                                                <td className="text-center fw-medium text-muted" style={{ padding: '0.45rem 0.3rem' }}>
                                                    {p.id}
                                                </td>

                                                {/* 2. Separate Dedicated Product Logo / Thumbnail Column */}
                                                <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                    <div
                                                        className="rounded border overflow-hidden bg-light d-inline-flex align-items-center justify-content-center cursor-pointer shadow-xs"
                                                        style={{ width: '36px', height: '36px' }}
                                                        onClick={() => handleQuickView(p)}
                                                        title="Click to preview"
                                                    >
                                                        <Image
                                                            className="img-fluid"
                                                            src={p.imageUrl || defaultProductImage}
                                                            alt={p.name}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = defaultProductImage;
                                                            }}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                </td>

                                                {/* 3. Separate Dedicated Part Code / SKU Column */}
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    {p.itemCode ? (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <span className="font-monospace fw-semibold text-dark" style={{ fontSize: '0.84rem' }}>
                                                                {p.itemCode}
                                                            </span>
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>{copiedKey === `sku-${p.id}` ? 'Copied!' : 'Copy SKU'}</Tooltip>}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(p.itemCode, `sku-${p.id}`, 'Part Code / SKU')}
                                                                    className="btn btn-sm btn-link p-0 text-muted hover-primary ms-1"
                                                                    style={{ border: 'none', background: 'transparent' }}
                                                                >
                                                                    {copiedKey === `sku-${p.id}` ? (
                                                                        <FaCheck size={11} className="text-success" />
                                                                    ) : (
                                                                        <FaCopy size={11} />
                                                                    )}
                                                                </button>
                                                            </OverlayTrigger>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>

                                                {/* 4. Product / Part Name Column */}
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <div className="fw-semibold text-dark">
                                                        <span
                                                            className="cursor-pointer text-primary hover-underline"
                                                            onClick={() => handleQuickView(p)}
                                                            title="Click to view details"
                                                        >
                                                            {p.name}
                                                        </span>
                                                    </div>
                                                    {p.hsnSacCode && (
                                                        <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                                                            HSN: {p.hsnSacCode}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 5. Category Column with spaced Icon + Name */}
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    {getItemTypeBadge(p.itemType)}
                                                </td>

                                                {/* 6. Engineering Specs Column */}
                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                    <div className="d-flex flex-column gap-1">
                                                        {p.drawingNumber ? (
                                                            <div className="d-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                <span className="text-info fw-semibold">DWG: {p.drawingNumber}</span>
                                                                <OverlayTrigger
                                                                    placement="top"
                                                                    overlay={<Tooltip>{copiedKey === `dwg-${p.id}` ? 'Copied!' : 'Copy DWG'}</Tooltip>}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopy(p.drawingNumber, `dwg-${p.id}`, 'Drawing Number')}
                                                                        className="btn btn-sm btn-link p-0 text-muted hover-primary"
                                                                        style={{ border: 'none', background: 'transparent' }}
                                                                    >
                                                                        {copiedKey === `dwg-${p.id}` ? (
                                                                            <FaCheck size={10} className="text-success" />
                                                                        ) : (
                                                                            <FaCopy size={10} />
                                                                        )}
                                                                    </button>
                                                                </OverlayTrigger>
                                                            </div>
                                                        ) : null}
                                                        {p.materialGrade && (
                                                            <div className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                                                                Grade: <span className="fw-medium text-dark">{p.materialGrade}</span>
                                                            </div>
                                                        )}
                                                        {!p.drawingNumber && !p.materialGrade && (
                                                            <span className="text-muted small">—</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 7. Selling Rate Column */}
                                                <td className="text-end fw-bold text-dark" style={{ padding: '0.45rem 0.5rem' }}>
                                                    ₹{sellingRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    {purchaseRate > 0 && (
                                                        <div className="text-muted small fw-normal" style={{ fontSize: '0.72rem' }}>
                                                            Cost: ₹{purchaseRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 8. GST / Unit Column */}
                                                <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                    <div className="badge bg-soft-info text-info font-monospace mb-0.5">
                                                        {p.gstRate !== undefined && p.gstRate !== null ? `GST ${p.gstRate}%` : 'GST —'}
                                                    </div>
                                                    <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                                                        {p.unitName || p.itemUnitName || 'NOS'}
                                                    </div>
                                                </td>

                                                {/* 9. Status Column */}
                                                <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                    <span className={`badge ${p.status === 'ACTIVE' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                                                        {p.status || 'ACTIVE'}
                                                    </span>
                                                </td>

                                                {/* 10. Audit Details / Last Modified */}
                                                {isTrash ? (
                                                    <>
                                                        <td className="text-muted small" style={{ padding: '0.45rem 0.5rem', fontSize: '0.78rem' }}>
                                                            {formatDate(p.deletedAt || p.deleted_at)}
                                                        </td>
                                                        <td className="text-muted small" style={{ padding: '0.45rem 0.5rem', fontSize: '0.78rem' }}>
                                                            {p.deletedBy || p.deleted_by || 'System'}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td style={{ padding: '0.45rem 0.5rem' }}>
                                                        <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                                            {updatedFormatted}
                                                        </div>
                                                        {p.createdBy && (
                                                            <div className="text-secondary opacity-75 small" style={{ fontSize: '0.70rem' }}>
                                                                by {p.createdBy}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}

                                                {/* 11. Actions */}
                                                <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                    <div className="d-inline-flex align-items-center gap-1">
                                                        {!isTrash ? (
                                                            <>
                                                                <OverlayTrigger placement="top" overlay={<Tooltip>Quick View</Tooltip>}>
                                                                    <Button
                                                                        variant="outline-info"
                                                                        size="sm"
                                                                        className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                        onClick={() => handleQuickView(p)}
                                                                    >
                                                                        <FaEye size={11} />
                                                                    </Button>
                                                                </OverlayTrigger>

                                                                <OverlayTrigger placement="top" overlay={<Tooltip>Edit Product</Tooltip>}>
                                                                    <Link to={`/masters/products/${p.id}/edit`}>
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                        >
                                                                            <FaPen size={10} />
                                                                        </Button>
                                                                    </Link>
                                                                </OverlayTrigger>

                                                                <OverlayTrigger placement="top" overlay={<Tooltip>Move to Bin</Tooltip>}>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                        disabled={isDeleting}
                                                                        onClick={() => confirmSoftDelete(p.name || p.itemCode || `Product #${p.id}`, () => deleteProductMutate({ id: p.id, isPermanentDelete: false }))}
                                                                    >
                                                                        <FaTrash size={10} />
                                                                    </Button>
                                                                </OverlayTrigger>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <OverlayTrigger placement="top" overlay={<Tooltip>Restore Product</Tooltip>}>
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                        onClick={() => confirmRestore(p.name || p.itemCode || `Product #${p.id}`, () => restoreProductMutate(p.id))}
                                                                    >
                                                                        <FaUndo size={10} />
                                                                    </Button>
                                                                </OverlayTrigger>

                                                                <OverlayTrigger placement="top" overlay={<Tooltip>Delete Permanently</Tooltip>}>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                        onClick={() => confirmPermanentDelete(p.name || p.itemCode || `Product #${p.id}`, () => deleteProductMutate({ id: p.id, isPermanentDelete: true }))}
                                                                    >
                                                                        <FaExclamationTriangle size={10} />
                                                                    </Button>
                                                                </OverlayTrigger>
                                                            </>
                                                        )}
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

                {/* 4. Complete Professional Pagination Footer */}
                {!isLoading && (total > 0 || products.length > 0) && (
                    <div className="d-flex justify-content-between align-items-center flex-wrap px-4 py-3 border-top gap-3 bg-white">
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <div className="text-muted small">
                                Showing <strong className="text-dark">{pageStart || (total > 0 ? 1 : 0)}</strong> to <strong className="text-dark">{pageEnd || products.length}</strong> of <strong className="text-dark">{total || products.length}</strong> entries
                            </div>
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="text-muted small">Show:</span>
                                <Form.Select
                                    size="sm"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="py-0 px-2 shadow-none"
                                    style={{ width: '70px', height: '28px', fontSize: '0.80rem' }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </Form.Select>
                            </div>
                        </div>

                        <PaginationBar
                            page={page}
                            pageSize={pageSize}
                            total={total || products.length}
                            totalPages={totalPages || (Math.ceil((total || products.length) / pageSize) || 1)}
                            onPageChange={(newPage) => setPage(newPage)}
                        />
                    </div>
                )}
            </Card>

            {/* Quick Details Slide-out Drawer */}
            <ProductDetailsDrawer
                show={drawerOpen}
                onHide={() => {
                    setDrawerOpen(false);
                    setSelectedProduct(null);
                }}
                product={selectedProduct}
            />
        </div>
    );
};

export default ProductList;
