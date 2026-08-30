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
    FaHistory
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import PaginationBar from '../../../components/PaginationBar';
import {
    useProductPagination,
    useDeleteProduct,
    useRestoreProduct,
    useBulkDeleteProducts,
    useBulkRestoreProducts
} from '../hooks/useApi';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import useListManager from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';
import defaultProductImage from '../../../assets/images/shapes/01.png';
import moment from 'moment';

const ITEM_TYPES = [
    { key: '', label: 'All Products' },
    { key: 'FINISHED_GOODS', label: 'Finished Goods', icon: FaBox, variant: 'primary' },
    { key: 'RAW_MATERIAL', label: 'Raw Materials', icon: FaLayerGroup, variant: 'warning' },
    { key: 'SERVICE', label: 'Machining Services', icon: FaCogs, variant: 'info' },
    { key: 'CONSUMABLE', label: 'Consumables', icon: FaDraftingCompass, variant: 'secondary' }
];

const getItemTypeBadge = (type) => {
    switch (type) {
        case 'FINISHED_GOODS':
            return <Badge bg="soft-primary" className="text-primary border border-primary-subtle">Finished Good</Badge>;
        case 'RAW_MATERIAL':
            return <Badge bg="soft-warning" className="text-warning border border-warning-subtle">Raw Material</Badge>;
        case 'SERVICE':
            return <Badge bg="soft-info" className="text-info border border-info-subtle">Service</Badge>;
        case 'CONSUMABLE':
            return <Badge bg="soft-secondary" className="text-secondary border border-secondary-subtle">Consumable</Badge>;
        default:
            return <Badge bg="light" className="text-dark border">{type || '—'}</Badge>;
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

    const { data: queryResult, isLoading, isFetching, refetch } = useProductPagination(queryParams);
    const { mutate: deleteProductMutate, isPending: isDeleting } = useDeleteProduct();
    const { mutate: restoreProductMutate, isPending: isRestoring } = useRestoreProduct();
    const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteProducts();
    const { mutate: bulkRestoreMutate, isPending: isBulkRestoring } = useBulkRestoreProducts();

    const isActionPending = isDeleting || isRestoring || isBulkDeleting || isBulkRestoring;

    const products = useMemo(() => queryResult?.data || [], [queryResult]);
    const pagination = useMemo(() => queryResult?.pagination || {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1
    }, [queryResult]);

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
            <Row>
                <Col sm="12">
                    <Card className="border-0 shadow-sm">
                        {/* Header */}
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2 py-3">
                            <div className="header-title">
                                <h4 className="card-title mb-0 d-flex align-items-center gap-2">
                                    <FaBox className="text-primary" />
                                    <span>Product Master</span>
                                </h4>
                                <p className="text-muted small mb-0">
                                    Manage manufactured precision components, raw materials, machining services, and consumables.
                                </p>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => refetch()}
                                    disabled={isFetching}
                                    title="Refresh Products"
                                >
                                    <FaSyncAlt className={isFetching ? 'fa-spin' : ''} />
                                </Button>

                                <Link to="/masters/products/create">
                                    <Button variant="primary" size="sm" className="d-flex align-items-center gap-2 px-3">
                                        <FaPlus size={11} />
                                        <span>Add Product</span>
                                    </Button>
                                </Link>
                            </div>
                        </Card.Header>

                        <Card.Body className="p-0">
                            {/* Tabs & Search Controls */}
                            <div className="p-3 border-bottom bg-light">
                                <Row className="g-2 align-items-center">
                                    {/* Active vs Trash Tab */}
                                    <Col lg={4} md={6}>
                                        <TrashTabFilter
                                            isTrash={isTrash}
                                            onTabChange={handleTabChange}
                                            activeLabel="Product Catalog"
                                            trashLabel="Recycle Bin"
                                        />
                                    </Col>

                                    {/* Search Input */}
                                    <Col lg={5} md={6}>
                                        <InputGroup size="sm">
                                            <InputGroup.Text className="bg-white border-end-0">
                                                <FaSearch className="text-muted" size={12} />
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Search by name, part code, DWG, material, HSN..."
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                className="border-start-0 border-end-0 ps-0"
                                            />
                                            {searchTerm && (
                                                <InputGroup.Text
                                                    className="bg-white border-start-0 cursor-pointer"
                                                    onClick={handleClearSearch}
                                                >
                                                    <FaTimes className="text-muted" size={12} />
                                                </InputGroup.Text>
                                            )}
                                        </InputGroup>
                                    </Col>

                                    {/* Status Filter */}
                                    <Col lg={3} md={6}>
                                        <Form.Select
                                            size="sm"
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value);
                                                setPage(1);
                                            }}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="ACTIVE">Active Only</option>
                                            <option value="INACTIVE">Inactive Only</option>
                                        </Form.Select>
                                    </Col>
                                </Row>

                                {/* Category Pills */}
                                <div className="mt-2 pt-2 border-top d-flex align-items-center gap-1 flex-wrap">
                                    <span className="small text-muted me-2 fw-semibold">Category:</span>
                                    {ITEM_TYPES.map((t) => {
                                        const isActive = itemTypeFilter === t.key;
                                        return (
                                            <Button
                                                key={t.key}
                                                variant={isActive ? 'primary' : 'outline-secondary'}
                                                size="sm"
                                                className="py-0 px-2 rounded-pill small"
                                                style={{ fontSize: '0.76rem' }}
                                                onClick={() => {
                                                    setItemTypeFilter(t.key);
                                                    setPage(1);
                                                }}
                                            >
                                                {t.label}
                                            </Button>
                                        );
                                    })}
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
                                    <h6 className="text-secondary">No products found</h6>
                                    <p className="text-muted small mb-3">
                                        {searchTerm || itemTypeFilter
                                            ? 'Try adjusting your search or category filters.'
                                            : isTrash
                                                ? 'Recycle bin is empty.'
                                                : 'Start by adding your first manufactured part or raw material.'}
                                    </p>
                                    {!isTrash && (
                                        <Link to="/masters/products/create">
                                            <Button variant="primary" size="sm">
                                                <FaPlus className="me-1" size={11} />
                                                <span>Add First Product</span>
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="table-hover table-striped align-middle mb-0" style={{ fontSize: '0.86rem' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th style={{ width: '40px' }} className="text-center">
                                                    <FormCheck
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        ref={(input) => {
                                                            if (input) input.indeterminate = isIndeterminate;
                                                        }}
                                                        onChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th style={{ width: '70px' }} onClick={() => handleSort('id')} className="cursor-pointer text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                        <span>ID</span>
                                                        <FaSort size={10} className="text-muted" />
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('name')} className="cursor-pointer">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <span>Product & Part Name</span>
                                                        <FaSort size={10} className="text-muted" />
                                                    </div>
                                                </th>
                                                <th style={{ width: '130px' }}>Category</th>
                                                <th style={{ width: '200px' }}>Engineering Specs</th>
                                                <th style={{ width: '120px' }} className="text-end" onClick={() => handleSort('sellingPrice')}>
                                                    <div className="d-flex align-items-center justify-content-end gap-1 cursor-pointer">
                                                        <span>Selling Rate</span>
                                                        <FaSort size={10} className="text-muted" />
                                                    </div>
                                                </th>
                                                <th style={{ width: '110px' }} className="text-center">GST / Unit</th>
                                                <th style={{ width: '140px' }}>Log / Audit</th>
                                                <th style={{ width: '85px' }} className="text-center">Status</th>
                                                <th style={{ width: '120px' }} className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedProducts.map((p) => {
                                                const isSelected = selectedIds.includes(p.id);
                                                const specs = [
                                                    p.drawingNumber ? `DWG: ${p.drawingNumber}` : null,
                                                    p.materialGrade ? p.materialGrade : null
                                                ].filter(Boolean);

                                                const createdAt = p.createdAt || p.created_at;
                                                const updatedAt = p.updatedAt || p.updated_at;
                                                const createdFormatted = createdAt ? moment(createdAt).format('DD/MM/YY, hh:mm A') : '—';
                                                const updatedFormatted = updatedAt ? moment(updatedAt).format('DD/MM/YY, hh:mm A') : '—';

                                                return (
                                                    <tr key={p.id} className={isSelected ? 'table-primary' : ''}>
                                                        {/* Checkbox */}
                                                        <td className="text-center">
                                                            <FormCheck
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleSelectRow(p.id)}
                                                            />
                                                        </td>

                                                        {/* Product ID */}
                                                        <td className="text-center">
                                                            <span className="badge bg-light text-dark font-monospace border px-1.5 py-1">
                                                                #{p.id}
                                                            </span>
                                                        </td>

                                                        {/* Product Name with Thumbnail & SKU */}
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div
                                                                    className="rounded border overflow-hidden bg-light flex-shrink-0 d-flex align-items-center justify-content-center"
                                                                    style={{ width: '36px', height: '36px' }}
                                                                >
                                                                    <Image
                                                                        src={p.imageUrl || defaultProductImage}
                                                                        alt={p.name}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <div className="fw-semibold text-dark text-truncate">
                                                                        <Link to={`/masters/products/${p.id}`} className="text-dark text-decoration-none hover-primary">
                                                                            {p.name}
                                                                        </Link>
                                                                    </div>
                                                                    <div className="d-flex align-items-center gap-1 flex-wrap">
                                                                        {p.itemCode && (
                                                                            <span className="badge bg-soft-secondary text-secondary px-1.5 py-0.5 font-monospace" style={{ fontSize: '0.70rem' }}>
                                                                                {p.itemCode}
                                                                            </span>
                                                                        )}
                                                                        {p.hsnSacCode && (
                                                                            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                                                                HSN: {p.hsnSacCode}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Category */}
                                                        <td>
                                                            {getItemTypeBadge(p.itemType)}
                                                        </td>

                                                        {/* Engineering Specs */}
                                                        <td>
                                                            {specs.length > 0 ? (
                                                                <div className="text-muted small">
                                                                    {specs.map((s, idx) => (
                                                                        <span key={idx} className="badge bg-light text-secondary border me-1 mb-1">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted small">—</span>
                                                            )}
                                                        </td>

                                                        {/* Selling Rate */}
                                                        <td className="text-end">
                                                            <div className="fw-bold text-dark">
                                                                ₹{Number(p.sellingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </div>
                                                            {p.purchasePrice > 0 && (
                                                                <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                                                    Cost: ₹{Number(p.purchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* GST / Unit */}
                                                        <td className="text-center">
                                                            <div className="badge bg-soft-info text-info mb-0.5">
                                                                {p.gstRate !== undefined && p.gstRate !== null ? `GST ${p.gstRate}%` : 'GST —'}
                                                            </div>
                                                            <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                                                                {p.unitName || p.itemUnitName || 'NOS'}
                                                            </div>
                                                        </td>

                                                        {/* Audit / Log Details */}
                                                        <td>
                                                            <OverlayTrigger
                                                                overlay={
                                                                    <Tooltip id={`tooltip-audit-${p.id}`}>
                                                                        <div>Created: {createdFormatted}</div>
                                                                        <div>Modified: {updatedFormatted}</div>
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <div className="text-muted small cursor-pointer" style={{ fontSize: '0.74rem', lineHeight: '1.2' }}>
                                                                    <div><FaClock size={9} className="me-1" />{createdFormatted}</div>
                                                                    {updatedAt && updatedAt !== createdAt && (
                                                                        <div className="text-secondary opacity-75"><FaHistory size={8} className="me-1" />{updatedFormatted}</div>
                                                                    )}
                                                                </div>
                                                            </OverlayTrigger>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="text-center">
                                                            <span className={`badge ${p.status === 'ACTIVE' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                                                                {p.status || 'ACTIVE'}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="text-center">
                                                            <div className="d-flex align-items-center justify-content-center gap-1">
                                                                {!isTrash ? (
                                                                    <>
                                                                        <OverlayTrigger overlay={<Tooltip>View Product</Tooltip>}>
                                                                            <Link to={`/masters/products/${p.id}`}>
                                                                                <Button variant="soft-info" size="sm" className="btn-icon btn-sm rounded-circle p-1">
                                                                                    <FaEye size={11} />
                                                                                </Button>
                                                                            </Link>
                                                                        </OverlayTrigger>

                                                                        <OverlayTrigger overlay={<Tooltip>Edit Product</Tooltip>}>
                                                                            <Link to={`/masters/products/${p.id}/edit`}>
                                                                                <Button variant="soft-primary" size="sm" className="btn-icon btn-sm rounded-circle p-1">
                                                                                    <FaPen size={11} />
                                                                                </Button>
                                                                            </Link>
                                                                        </OverlayTrigger>

                                                                        <OverlayTrigger overlay={<Tooltip>Move to Recycle Bin</Tooltip>}>
                                                                            <Button
                                                                                variant="soft-danger"
                                                                                size="sm"
                                                                                className="btn-icon btn-sm rounded-circle p-1"
                                                                                onClick={() => handleDelete(p.id, p.name)}
                                                                            >
                                                                                <FaTrash size={11} />
                                                                            </Button>
                                                                        </OverlayTrigger>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <OverlayTrigger overlay={<Tooltip>Restore Product</Tooltip>}>
                                                                            <Button
                                                                                variant="soft-success"
                                                                                size="sm"
                                                                                className="btn-icon btn-sm rounded-circle p-1"
                                                                                onClick={() => handleRestore(p.id, p.name)}
                                                                            >
                                                                                <FaUndo size={11} />
                                                                            </Button>
                                                                        </OverlayTrigger>

                                                                        <OverlayTrigger overlay={<Tooltip>Permanently Delete</Tooltip>}>
                                                                            <Button
                                                                                variant="soft-danger"
                                                                                size="sm"
                                                                                className="btn-icon btn-sm rounded-circle p-1"
                                                                                onClick={() => handleDelete(p.id, p.name)}
                                                                            >
                                                                                <FaTrash size={11} />
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

                        {/* Pagination Footer */}
                        {pagination.total > 0 && (
                            <Card.Footer className="border-0 bg-transparent py-3">
                                <PaginationBar
                                    page={page}
                                    pageSize={pageSize}
                                    total={pagination.total}
                                    totalPages={pagination.totalPages}
                                    onPageChange={setPage}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setPage(1);
                                    }}
                                />
                            </Card.Footer>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ProductList;
