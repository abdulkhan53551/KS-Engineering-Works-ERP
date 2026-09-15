import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Form, Spinner, FormCheck, InputGroup, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import {
    FaDownload,
    FaPen,
    FaTrash,
    FaUndo,
    FaExclamationTriangle,
    FaSearch,
    FaTimes,
    FaSyncAlt,
    FaCopy,
    FaMoneyCheckAlt,
    FaHistory
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import QuickPaymentModal from '../../payments/components/modals/QuickPaymentModal';
import InvoicePaymentHistoryModal from '../../payments/components/modals/InvoicePaymentHistoryModal';
import {
    useBulkDeleteInvoices,
    useBulkRestoreInvoices,
    useDeleteInvoice,
    useDownloadInvoice,
    useInvoice,
    useInvoicePagination,
    useRestoreInvoice
} from '../hooks/useApi';
import useInvoiceSort from '../hooks/useInvoiceSort';
import useInvoiceFinancials from '../hooks/useInvoiceFinancials';
import PaginationBar from '../../../components/PaginationBar';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import useListManager from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';

const InvoiceList = () => {
    // Trash Action Helpers
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    } = useTrashActions({ entityName: 'Invoice' });

    // API Mutations
    const { mutate: deleteInvoice } = useDeleteInvoice();
    const { mutate: restoreInvoice } = useRestoreInvoice();
    const { mutate: bulkDeleteInvoices } = useBulkDeleteInvoices();
    const { mutate: bulkRestoreInvoices } = useBulkRestoreInvoices();
    const { mutate: downloadInvoice, downloadingInvoiceId } = useDownloadInvoice();

    // Payment Modals State
    const [quickPaymentInvoice, setQuickPaymentInvoice] = useState(null);
    const [historyModalState, setHistoryModalState] = useState({ show: false, invoiceId: null, invoiceNo: '' });

    // Financial calculations hook
    const { getFinancials } = useInvoiceFinancials();

    // Data fetching state
    const [tempItems, setTempItems] = useState([]);

    // List Manager Hook
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        debouncedSearch,
        isTrash,
        selectedIds,
        handleSearch,
        clearSearch,
        handlePageChange,
        handleTabChange,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount
    } = useListManager({
        items: tempItems,
        idKey: 'invoiceId',
        initialPageSize: 10
    });

    // Fetch data
    const {
        data: invoice = [],
        isLoading: isListLoading,
        isFetching: isListFetching,
        refetch: refetchList
    } = useInvoice({ page, pageSize, search: debouncedSearch, trash: isTrash });

    const {
        data: pagination = {},
        isLoading: isPaginationLoading,
        isFetching: isPaginationFetching,
        refetch: refetchPagination
    } = useInvoicePagination({ page, pageSize, search: debouncedSearch, trash: isTrash });

    const isFetching = isListFetching || isPaginationFetching;
    const isLoading = isListLoading || isPaginationLoading;

    const handleRefresh = () => {
        refetchList();
        refetchPagination();
    };

    // Column Sorting Custom Hook
    const {
        sortConfig,
        setSortConfig,
        handleSort,
        renderSortIcon,
        sortedList
    } = useInvoiceSort({ items: invoice });

    // Sync items with ListManager for select all (matches standard pattern across modules)
    useEffect(() => {
        setTempItems(invoice);
    }, [invoice]);

    const { pageStart, pageEnd, total: totalItems } = pagination;

    return (
        <>
            <PageLoader loading={isFetching && !isLoading} />
            <Row>
                <Col sm="12">
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="header-title d-flex align-items-center gap-2">
                                <h4 className="card-title mb-0">Invoice</h4>
                                {!isLoading && totalItems > 0 && (
                                    <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-1">
                                        {totalItems} Total
                                    </Badge>
                                )}
                            </div>
                            <TrashTabFilter isTrash={isTrash} onTabChange={handleTabChange} />
                            <div>
                                {!isTrash && (
                                    <Link to="/sales/invoice/create">
                                        <Button type="button" variant="primary">
                                            Add Invoice
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </Card.Header>

                        <BulkActionBar
                            selectedCount={selectedCount}
                            isTrash={isTrash}
                            onBulkDelete={() => confirmBulkSoftDelete(selectedCount, () => {
                                bulkDeleteInvoices({ ids: selectedIds, isPermanentDelete: false });
                                handleDeselectAll();
                            })}
                            onBulkRestore={() => confirmBulkRestore(selectedCount, () => {
                                bulkRestoreInvoices({ ids: selectedIds });
                                handleDeselectAll();
                            })}
                            onBulkPermanentDelete={() => confirmBulkPermanentDelete(selectedCount, () => {
                                bulkDeleteInvoices({ ids: selectedIds, isPermanentDelete: true });
                                handleDeselectAll();
                            })}
                            onDeselectAll={handleDeselectAll}
                        />

                        <Card.Body className="px-0">
                            {/* Controls & Filter Bar with Integrated Search & Refresh */}
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
                                            placeholder="Search invoices..."
                                            value={search}
                                            onChange={handleSearch}
                                            className="border-start-0 border-end-0 ps-0"
                                            style={{ fontSize: '0.84rem' }}
                                        />
                                        {search && (
                                            <Button
                                                variant="outline-secondary"
                                                className="bg-white border-start-0 border-end-0 px-2"
                                                onClick={clearSearch}
                                                title="Clear search"
                                            >
                                                <FaTimes size={11} className="text-muted" />
                                            </Button>
                                        )}
                                        <OverlayTrigger placement="top" overlay={<Tooltip>Refresh list</Tooltip>}>
                                            <Button
                                                variant="outline-secondary"
                                                className="bg-white border-start-0 px-2.5 d-flex align-items-center"
                                                onClick={handleRefresh}
                                                disabled={isFetching}
                                            >
                                                <FaSyncAlt size={11} className={isFetching ? 'fa-spin text-primary' : 'text-muted'} />
                                            </Button>
                                        </OverlayTrigger>
                                    </InputGroup>
                                </div>
                            </Col>

                            <div className="table-responsive">
                                <Table id="invoice-list-table" className="table-sortable ms-1 me-1 align-middle mb-0" striped bordered hover responsive role="grid">
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
                                                onClick={() => handleSort('invoiceId')}
                                            >
                                                #ID {renderSortIcon('invoiceId')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('invoiceNo')}
                                            >
                                                Invoice No {renderSortIcon('invoiceNo')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('invoiceDate')}
                                            >
                                                Invoice Date {renderSortIcon('invoiceDate')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '200px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('customerName')}
                                            >
                                                Customer Name {renderSortIcon('customerName')}
                                            </th>
                                            {!isTrash && (
                                                <>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('taxableAmount')}
                                                    >
                                                        Total Taxable {renderSortIcon('taxableAmount')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('total')}
                                                    >
                                                        Total Amount {renderSortIcon('total')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('balanceAmount')}
                                                    >
                                                        Balance Due {renderSortIcon('balanceAmount')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('paymentStatusCode')}
                                                    >
                                                        Payment Status {renderSortIcon('paymentStatusCode')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('paymentModeCode')}
                                                    >
                                                        Payment Mode {renderSortIcon('paymentModeCode')}
                                                    </th>
                                                </>
                                            )}
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('createdBy')}
                                            >
                                                Created By {renderSortIcon('createdBy')}
                                            </th>
                                            {isTrash ? (
                                                <>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '150px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('deletedAt')}
                                                    >
                                                        Deleted Date {renderSortIcon('deletedAt')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('deletedBy')}
                                                    >
                                                        Deleted By {renderSortIcon('deletedBy')}
                                                    </th>
                                                </>
                                            ) : (
                                                <th
                                                    className="cursor-pointer user-select-none py-2"
                                                    style={{ minWidth: '165px', padding: '0.45rem 0.5rem' }}
                                                    onClick={() => handleSort('updatedAt')}
                                                >
                                                    Last Modified {renderSortIcon('updatedAt')}
                                                </th>
                                            )}
                                            <th className="text-center py-2" style={{ width: '120px', minWidth: '120px', padding: '0.45rem 0.5rem' }}>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '0.86rem' }}>
                                        {sortedList.length > 0 ? (
                                            sortedList.map((item, idx) => {
                                                const { total, paid, balance, isFullyPaid, hasBalance } = getFinancials(item);
                                                return (
                                                <tr key={item.invoiceId || idx} className={selectedIds.includes(item.invoiceId) ? 'table-active' : ''}>
                                                    <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                        <FormCheck
                                                            type="checkbox"
                                                            checked={selectedIds.includes(item.invoiceId)}
                                                            onChange={() => handleSelectRow(item.invoiceId)}
                                                        />
                                                    </td>
                                                    <td className="text-center text-muted fw-medium" style={{ padding: '0.45rem 0.3rem' }}>{item.invoiceId}</td>
                                                    <td style={{ padding: '0.45rem 0.5rem' }}><span className="text-primary font-monospace fw-bold">{item.invoiceNo}</span></td>
                                                    <td style={{ padding: '0.45rem 0.5rem' }}>{item.invoiceDate ? moment(item.invoiceDate).format('DD/MM/YYYY') : '-'}</td>
                                                    <td style={{ padding: '0.45rem 0.5rem' }}><span className="fw-semibold text-dark">{item.customerName}</span></td>
                                                    {!isTrash && (
                                                        <>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>₹{Number(item.taxableAmount ?? item.totalTaxableAmount ?? item.subTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                            <td style={{ padding: '0.45rem 0.5rem' }} className="fw-semibold">₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                {isFullyPaid ? (
                                                                    <Badge bg="soft-success" className="text-success font-monospace px-2 py-1">
                                                                        ₹0.00
                                                                    </Badge>
                                                                ) : (
                                                                    <div>
                                                                        <span className="font-monospace fw-bold text-danger">
                                                                            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                        </span>
                                                                        {paid > 0 && (
                                                                            <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>
                                                                                Paid: ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                <span
                                                                    className={`badge ${item.color || 'bg-secondary'}`}
                                                                    style={{ cursor: 'pointer' }}
                                                                    title="Click to view payment history"
                                                                    onClick={() => setHistoryModalState({
                                                                        show: true,
                                                                        invoiceId: item.invoiceId,
                                                                        invoiceNo: item.invoiceNo
                                                                    })}
                                                                >
                                                                    {item.paymentStatusCode || '-'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>{item.paymentModeCode || '-'}</td>
                                                        </>
                                                    )}
                                                    <td style={{ padding: '0.45rem 0.5rem' }}>{item.createdBy}</td>
                                                    {isTrash ? (
                                                        <>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                    {item.deletedAt ? moment(item.deletedAt).format('DD/MM/YYYY, hh:mm A') : '—'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>{item.deletedBy || '—'}</td>
                                                        </>
                                                    ) : (
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                {item.updatedAt ? moment(item.updatedAt).format('DD/MM/YYYY, hh:mm A') : (item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY, hh:mm A') : '—')}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                        <div className="flex align-items-center list-user-action">
                                                            {!isTrash ? (
                                                                <>
                                                                    {hasBalance ? (
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="me-2"
                                                                            title="Record Payment"
                                                                            onClick={() => setQuickPaymentInvoice({
                                                                                ...item,
                                                                                partyId: item.partyId || item.party_id,
                                                                                balanceAmount: balance,
                                                                                paidAmount: paid
                                                                            })}
                                                                        >
                                                                            <FaMoneyCheckAlt />
                                                                        </Button>
                                                                    ) : null}
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        className="me-2"
                                                                        title="Payment History"
                                                                        onClick={() => setHistoryModalState({
                                                                            show: true,
                                                                            invoiceId: item.invoiceId,
                                                                            invoiceNo: item.invoiceNo
                                                                        })}
                                                                    >
                                                                        <FaHistory />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        className="me-2"
                                                                        title="Download PDF"
                                                                        disabled={downloadingInvoiceId === item.invoiceId}
                                                                        onClick={() => downloadInvoice({ invoiceId: item.invoiceId, invoiceNo: item.invoiceNo })}
                                                                    >
                                                                        {downloadingInvoiceId === item.invoiceId ? (
                                                                            <Spinner animation="border" size="sm" />
                                                                        ) : (
                                                                            <FaDownload />
                                                                        )}
                                                                    </Button>
                                                                    <Link className="me-2" to={`/sales/invoice/${item.invoiceId}/edit`}>
                                                                        <Button variant="outline-success" size='sm' title="Edit">
                                                                            <FaPen />
                                                                        </Button>
                                                                    </Link>
                                                                    <Link className="me-2" to={`/sales/invoice/${item.invoiceId}/duplicate`}>
                                                                        <Button variant="outline-info" size='sm' title="Duplicate / Clone Invoice">
                                                                            <FaCopy />
                                                                        </Button>
                                                                    </Link>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size='sm'
                                                                        title="Move to Bin"
                                                                        onClick={() => confirmSoftDelete(`Invoice "${item.invoiceNo}"`, () => deleteInvoice({ id: item.invoiceId, isPermanentDelete: false }))}
                                                                    >
                                                                        <FaTrash />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size='sm'
                                                                        className="me-2"
                                                                        title="Restore"
                                                                        onClick={() => confirmRestore(`Invoice "${item.invoiceNo}"`, () => restoreInvoice(item.invoiceId))}
                                                                    >
                                                                        <FaUndo />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size='sm'
                                                                        title="Delete Permanently"
                                                                        onClick={() => confirmPermanentDelete(`Invoice "${item.invoiceNo}"`, () => deleteInvoice({ id: item.invoiceId, isPermanentDelete: true }))}
                                                                    >
                                                                        <FaExclamationTriangle />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={isTrash ? 8 : 12} className="text-center py-4 text-muted">
                                                    {isTrash
                                                        ? (debouncedSearch ? `No deleted invoices matching "${debouncedSearch}"` : 'Recycle Bin is empty.')
                                                        : (debouncedSearch ? `No invoices matching "${debouncedSearch}"` : 'No invoices found.')
                                                    }
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {invoice.length > 0 && (
                                <div className="d-flex justify-content-between align-items-center mt-3" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                                    <div className="text-muted small">
                                        Showing {pageStart} to {pageEnd} of {totalItems} entries
                                    </div>
                                    <PaginationBar
                                        page={page}
                                        pageSize={pageSize}
                                        total={totalItems}
                                        totalPages={pagination.totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Quick Payment Settlement Modal */}
            {quickPaymentInvoice && (
                <QuickPaymentModal
                    show={!!quickPaymentInvoice}
                    invoice={quickPaymentInvoice}
                    onHide={() => {
                        setQuickPaymentInvoice(null);
                        refetchList();
                        refetchPagination();
                    }}
                />
            )}

            {/* Payment History Audit Modal */}
            <InvoicePaymentHistoryModal
                show={historyModalState.show}
                invoiceId={historyModalState.invoiceId}
                invoiceNo={historyModalState.invoiceNo}
                onHide={() => setHistoryModalState({ show: false, invoiceId: null, invoiceNo: '' })}
            />
        </>
    );
};

export default InvoiceList;