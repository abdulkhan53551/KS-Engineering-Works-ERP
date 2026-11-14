import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Table, Button, Form, FormCheck, InputGroup, OverlayTrigger, Tooltip, Badge, Spinner, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import {
   FaPen,
   FaTrash,
   FaUndo,
   FaExclamationTriangle,
   FaSearch,
   FaTimes,
   FaSyncAlt,
   FaSort,
   FaSortAlphaUpAlt,
   FaSortAlphaDownAlt,
   FaDownload,
   FaFileInvoice,
   FaTruck,
   FaBoxes,
   FaPlus,
   FaEllipsisV
} from 'react-icons/fa';
import {
   useBulkDeleteInvoiceChallans,
   useBulkRestoreInvoiceChallans,
   useDeleteInvoiceChallan,
   useGetInvoiceChallan,
   useGetInvoiceChallanPagination,
   useRestoreInvoiceChallan,
   useDownloadDeliveryChallanPdf
} from '../hooks/useApi';
import PaginationBar from '../../../components/PaginationBar';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import { useListPagination, useRowSelection } from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';
import useBranchAction from '../../../hooks/useBranchAction';

// Import modern invoice styling system for unified enterprise UI
import '../../invoice/pages/invoice-list-modern.scss';
import '../../invoice/pages/invoice.scss';

const InvoiceChallan = () => {
   const navigate = useNavigate();
   // Branch check for multi-branch awareness
   const { navigateWithBranch, BranchModal } = useBranchAction();

   // Trash Action Helpers
   const {
      confirmSoftDelete,
      confirmRestore,
      confirmPermanentDelete,
      confirmBulkSoftDelete,
      confirmBulkRestore,
      confirmBulkPermanentDelete
   } = useTrashActions({ entityName: 'Challan' });

   // API Mutations
   const { mutate: deleteInvoiceChallan } = useDeleteInvoiceChallan();
   const { mutate: restoreInvoiceChallan } = useRestoreInvoiceChallan();
   const { mutate: bulkDeleteInvoiceChallans } = useBulkDeleteInvoiceChallans();
   const { mutate: bulkRestoreInvoiceChallans } = useBulkRestoreInvoiceChallans();
   const { mutate: downloadDeliveryChallanPdf, downloadingChallanId } = useDownloadDeliveryChallanPdf();

   // Sorting state
   const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

   // Filter state: 'ALL', 'UNBILLED', 'BILLED'
   const [statusFilter, setStatusFilter] = useState('ALL');

   // Pagination & Search Manager Hook
   const {
      page,
      setPage,
      pageSize,
      setPageSize,
      search,
      debouncedSearch,
      isTrash,
      handleSearch,
      clearSearch,
      handlePageChange,
      handlePageSizeChange,
      handleTabChange: handlePaginationTabChange
   } = useListPagination({
      initialPageSize: 10
   });

   // Fetch data
   const {
      data: invoiceChallan = [],
      isLoading: isListLoading,
      isFetching: isListFetching,
      refetch: refetchList
   } = useGetInvoiceChallan({ page, pageSize, search: debouncedSearch, trash: isTrash });

   const {
      data: pagination = {},
      isLoading: isPaginationLoading,
      isFetching: isPaginationFetching,
      refetch: refetchPagination
   } = useGetInvoiceChallanPagination({ page, pageSize, search: debouncedSearch, trash: isTrash });

   const isFetching = isListFetching || isPaginationFetching;
   const isLoading = isListLoading || isPaginationLoading;

   const handleRefresh = () => {
      refetchList();
      refetchPagination();
   };

   // Calculate Executive KPI Metrics from Challans List
   const kpiMetrics = useMemo(() => {
      const totalCount = invoiceChallan.length;
      let unbilledCount = 0;
      let billedCount = 0;
      let totalQty = 0;

      invoiceChallan.forEach(c => {
         const isBilled = Boolean(c.invoiceId || c.isInvoiced || c.status === 'BILLED');
         if (isBilled) {
            billedCount += 1;
         } else {
            unbilledCount += 1;
         }
         totalQty += Number(c.totalQuantity || 1);
      });

      return { totalCount, unbilledCount, billedCount, totalQty };
   }, [invoiceChallan]);

   // Handle column sorting
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

   // Filter items by statusFilter tab if selected
   const filteredChallans = useMemo(() => {
      if (statusFilter === 'UNBILLED') {
         return invoiceChallan.filter(c => !c.invoiceId && !c.isInvoiced && c.status !== 'BILLED');
      }
      if (statusFilter === 'BILLED') {
         return invoiceChallan.filter(c => c.invoiceId || c.isInvoiced || c.status === 'BILLED');
      }
      return invoiceChallan;
   }, [invoiceChallan, statusFilter]);

   // Sorted list
   const sortedList = useMemo(() => {
      let items = [...filteredChallans];
      if (sortConfig.key) {
         items.sort((a, b) => {
            let aVal = a[sortConfig.key] ?? '';
            let bVal = b[sortConfig.key] ?? '';

            if (sortConfig.key === 'challanId' || sortConfig.key === 'totalQuantity') {
               const numA = Number(aVal) || 0;
               const numB = Number(bVal) || 0;
               return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }

            if (sortConfig.key === 'challanDate' || sortConfig.key === 'updatedAt' || sortConfig.key === 'deletedAt' || sortConfig.key === 'createdAt') {
               const dateA = new Date(aVal).getTime() || 0;
               const dateB = new Date(bVal).getTime() || 0;
               return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
         });
      }
      return items;
   }, [filteredChallans, sortConfig]);

   // Row Selection Hook directly operates on sortedList
   const {
      selectedIds,
      handleSelectAll,
      handleSelectRow,
      handleDeselectAll,
      isAllSelected,
      isIndeterminate,
      selectedCount
   } = useRowSelection({
      items: sortedList,
      idKey: 'challanId'
   });

   const handleTabChange = useCallback((trashState) => {
      handlePaginationTabChange(trashState);
      handleDeselectAll();
   }, [handlePaginationTabChange, handleDeselectAll]);

   const { pageStart, pageEnd, total: totalItems } = pagination;

   return (
      <div className="invoice-list-container pb-5">
         {/* Main Table Card */}
         <Row>
            <Col sm="12">
               <Card className="shadow-sm border-0">
                  <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-3 px-4 bg-white border-bottom">
                     <div className="header-title d-flex align-items-center gap-3">
                        <div className="invoice-title-icon-pill">
                           <FaBoxes size={18} />
                        </div>
                        <div>
                           <div className="d-flex align-items-center gap-2">
                              <h4 className="card-title mb-0 fw-bold text-dark">Delivery Challans</h4>
                              {!isLoading && totalItems > 0 && (
                                 <Badge bg="soft-primary" className="text-primary fw-semibold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
                                    {totalItems} Total
                                 </Badge>
                              )}
                           </div>
                           <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                              Goods dispatch notes, gate passes, vehicle transport tracking & Rule 55 records
                           </p>
                        </div>
                     </div>

                     <div className="d-flex align-items-center gap-2.5 flex-wrap">
                        <TrashTabFilter
                           isTrash={isTrash}
                           onTabChange={handleTabChange}
                        />
                        {!isTrash && (
                           <Button
                              type="button"
                              variant="primary"
                              className="d-flex align-items-center gap-1.5 px-3 py-2 shadow-sm fw-semibold"
                              style={{ borderRadius: '7px', fontSize: '0.82rem' }}
                              onClick={() => navigateWithBranch('/sales/challans/create', 'Select Branch for Delivery Challan')}
                           >
                              <FaPlus size={11} />
                              <span>Add Challan</span>
                           </Button>
                        )}
                     </div>
                  </Card.Header>

                  <BulkActionBar
                     selectedCount={selectedCount}
                     isTrash={isTrash}
                     onBulkDelete={() => confirmBulkSoftDelete(selectedCount, () => {
                        bulkDeleteInvoiceChallans({ ids: selectedIds, isPermanentDelete: false });
                        handleDeselectAll();
                     })}
                     onBulkRestore={() => confirmBulkRestore(selectedCount, () => {
                        bulkRestoreInvoiceChallans({ ids: selectedIds });
                        handleDeselectAll();
                     })}
                     onBulkPermanentDelete={() => confirmBulkPermanentDelete(selectedCount, () => {
                        bulkDeleteInvoiceChallans({ ids: selectedIds, isPermanentDelete: true });
                        handleDeselectAll();
                     })}
                     onDeselectAll={handleDeselectAll}
                  />

                  <Card.Body className="px-0">
                     {/* Modern Controls & Filter Toolbar */}
                     <div className="px-4 py-3 bg-white border-bottom">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2.5">
                           {/* Left Side: Modern Segmented Status Tabs */}
                           {!isTrash ? (
                              <div className="segmented-status-tabs">
                                 <button
                                    type="button"
                                    className={`status-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('ALL')}
                                 >
                                    <span>All Challans</span>
                                    <span className="tab-badge">{kpiMetrics.totalCount}</span>
                                 </button>
                                 <button
                                    type="button"
                                    className={`status-tab-btn ${statusFilter === 'UNBILLED' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('UNBILLED')}
                                 >
                                    <span>Dispatched (Unbilled)</span>
                                    <span className="tab-badge tab-badge-warning">{kpiMetrics.unbilledCount}</span>
                                 </button>
                                 <button
                                    type="button"
                                    className={`status-tab-btn ${statusFilter === 'BILLED' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('BILLED')}
                                 >
                                    <span>Invoiced / Billed</span>
                                    <span className="tab-badge tab-badge-success">{kpiMetrics.billedCount}</span>
                                 </button>
                              </div>
                           ) : <div />}

                           {/* Right Side: Search & Entries Controls */}
                           <div className="d-flex align-items-center flex-wrap gap-2 ms-auto">
                              <div className="d-flex align-items-center">
                                 <Form.Label className="mb-0 text-muted small me-2" style={{ fontSize: '0.78rem' }}>Show</Form.Label>
                                 <Form.Select
                                    size="sm"
                                    className="form-select-sm"
                                    style={{ width: '5.2rem', fontSize: '0.80rem' }}
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
                              </div>

                              <InputGroup size="sm" style={{ width: '18rem' }}>
                                 <InputGroup.Text className="bg-white border-end-0">
                                    <FaSearch className="text-muted" size={11} />
                                 </InputGroup.Text>
                                 <Form.Control
                                    type="search"
                                    placeholder="Search challan, customer, vehicle..."
                                    value={search}
                                    onChange={handleSearch}
                                    className="border-start-0 border-end-0 ps-0"
                                    style={{ fontSize: '0.82rem' }}
                                 />
                                 {search && (
                                    <Button
                                       variant="outline-secondary"
                                       className="bg-white border-start-0 border-end-0 px-2"
                                       onClick={clearSearch}
                                       title="Clear search"
                                    >
                                       <FaTimes size={10} className="text-muted" />
                                    </Button>
                                 )}
                                 <OverlayTrigger placement="top" overlay={<Tooltip>Refresh list</Tooltip>}>
                                    <Button
                                       variant="outline-secondary"
                                       className="bg-white border-start-0 px-2.5 d-flex align-items-center"
                                       onClick={handleRefresh}
                                       disabled={isFetching}
                                    >
                                       <FaSyncAlt size={10} className={isFetching ? 'fa-spin text-primary' : 'text-muted'} />
                                    </Button>
                                 </OverlayTrigger>
                              </InputGroup>
                           </div>
                        </div>
                     </div>

                     {/* Table Content */}
                     <div className={`table-responsive invoice-table-wrapper position-relative ${isFetching && !isLoading ? 'is-fetching-data' : ''}`}>
                        {isFetching && !isLoading && (
                           <div className="table-progress-bar">
                              <div className="table-progress-line" />
                           </div>
                        )}
                        <Table id="challan-list-table" className="invoice-modern-table table-sortable align-middle mb-0" hover responsive role="grid">
                           <thead className="table-light">
                              <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                 <th className="text-center" style={{ width: '40px', minWidth: '40px', padding: '0.65rem 0.4rem' }}>
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
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '140px', padding: '0.65rem 0.6rem' }}
                                    onClick={() => handleSort('challanNo')}
                                 >
                                    Challan No {renderSortIcon('challanNo')}
                                 </th>
                                 <th
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '110px', padding: '0.65rem 0.6rem' }}
                                    onClick={() => handleSort('challanDate')}
                                 >
                                    Date {renderSortIcon('challanDate')}
                                 </th>
                                 <th
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '200px', padding: '0.65rem 0.6rem' }}
                                    onClick={() => handleSort('customerName')}
                                 >
                                    Customer / Consignee {renderSortIcon('customerName')}
                                 </th>
                                 <th
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '150px', padding: '0.65rem 0.6rem' }}
                                    onClick={() => handleSort('vehicleNo')}
                                 >
                                    Transport & Logistics {renderSortIcon('vehicleNo')}
                                 </th>
                                 <th
                                    className="cursor-pointer user-select-none py-2 text-center"
                                    style={{ minWidth: '95px', padding: '0.65rem 0.6rem' }}
                                    onClick={() => handleSort('totalQuantity')}
                                 >
                                    Dispatched Qty {renderSortIcon('totalQuantity')}
                                 </th>
                                 {!isTrash && (
                                    <th
                                       className="cursor-pointer user-select-none py-2"
                                       style={{ minWidth: '140px', padding: '0.65rem 0.6rem' }}
                                       onClick={() => handleSort('invoiceStatus')}
                                    >
                                       Billing Status {renderSortIcon('invoiceStatus')}
                                    </th>
                                 )}
                                 <th
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '110px', padding: '0.65rem 0.6rem' }}
                                    onClick={() => handleSort('createdBy')}
                                 >
                                    Created By {renderSortIcon('createdBy')}
                                 </th>
                                 {isTrash ? (
                                    <>
                                       <th
                                          className="cursor-pointer user-select-none py-2"
                                          style={{ minWidth: '130px', padding: '0.65rem 0.6rem' }}
                                          onClick={() => handleSort('deletedAt')}
                                       >
                                          Deleted Date {renderSortIcon('deletedAt')}
                                       </th>
                                       <th
                                          className="cursor-pointer user-select-none py-2"
                                          style={{ minWidth: '110px', padding: '0.65rem 0.6rem' }}
                                          onClick={() => handleSort('deletedBy')}
                                       >
                                          Deleted By {renderSortIcon('deletedBy')}
                                       </th>
                                    </>
                                 ) : (
                                    <th
                                       className="cursor-pointer user-select-none py-2"
                                       style={{ minWidth: '130px', padding: '0.65rem 0.6rem' }}
                                       onClick={() => handleSort('updatedAt')}
                                    >
                                       Modified {renderSortIcon('updatedAt')}
                                    </th>
                                 )}
                                 <th className="text-center py-2" style={{ width: '110px', minWidth: '110px', padding: '0.65rem 0.6rem' }}>
                                    Actions
                                 </th>
                              </tr>
                           </thead>
                           <tbody style={{ fontSize: '0.85rem' }}>
                              {isLoading || (isFetching && invoiceChallan.length === 0) ? (
                                 Array.from({ length: pageSize > 10 ? 8 : 6 }).map((_, sIdx) => (
                                    <tr key={`sk-challan-row-${sIdx}`}>
                                       <td className="text-center" style={{ padding: '0.65rem 0.4rem' }}>
                                          <div className="sk-checkbox" />
                                       </td>
                                       <td style={{ padding: '0.65rem 0.6rem' }}>
                                          <div className="sk-inv-no" style={{ width: '100px' }} />
                                       </td>
                                       <td style={{ padding: '0.65rem 0.6rem' }}>
                                          <div className="sk-date" />
                                       </td>
                                       <td style={{ padding: '0.65rem 0.6rem' }}>
                                          <div>
                                             <div className="sk-customer" style={{ width: '150px' }} />
                                             <div className="sk-customer mt-1" style={{ width: '100px', height: '10px' }} />
                                          </div>
                                       </td>
                                       <td style={{ padding: '0.65rem 0.6rem' }}>
                                          <div>
                                             <div className="sk-date" style={{ width: '85px' }} />
                                             <div className="sk-user mt-1" style={{ width: '65px', height: '10px' }} />
                                          </div>
                                       </td>
                                       <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                          <div className="sk-amount" style={{ width: '45px' }} />
                                       </td>
                                       {!isTrash && (
                                          <td style={{ padding: '0.65rem 0.6rem' }}>
                                             <div className="sk-pill" style={{ width: '105px' }} />
                                          </td>
                                       )}
                                       <td style={{ padding: '0.65rem 0.6rem' }}>
                                          <div className="sk-user" />
                                       </td>
                                       {isTrash ? (
                                          <>
                                             <td style={{ padding: '0.65rem 0.6rem' }}>
                                                <div className="sk-date" style={{ width: '85px' }} />
                                             </td>
                                             <td style={{ padding: '0.65rem 0.6rem' }}>
                                                <div className="sk-user" />
                                             </td>
                                          </>
                                       ) : (
                                          <td style={{ padding: '0.65rem 0.6rem' }}>
                                             <div className="sk-date" style={{ width: '95px' }} />
                                          </td>
                                       )}
                                       <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                          <div className="action-btn-group">
                                             <div className="sk-btn-more" />
                                             <div className="sk-btn-more" />
                                          </div>
                                       </td>
                                    </tr>
                                 ))
                              ) : sortedList.length > 0 ? (
                                 sortedList.map((item, idx) => {
                                    const isBilled = Boolean(item.invoiceId || item.isInvoiced || item.status === 'BILLED');
                                    return (
                                       <tr key={item.challanId || idx} className={selectedIds.includes(item.challanId) ? 'table-active' : ''}>
                                          <td className="text-center" style={{ padding: '0.6rem 0.4rem' }}>
                                             <FormCheck
                                                type="checkbox"
                                                checked={selectedIds.includes(item.challanId)}
                                                onChange={() => handleSelectRow(item.challanId)}
                                             />
                                          </td>
                                          <td style={{ padding: '0.6rem 0.6rem' }}>
                                             <span className="text-primary font-monospace fw-bold">{item.challanNo}</span>
                                          </td>
                                          <td style={{ padding: '0.6rem 0.6rem' }}>
                                             <span className="text-dark font-monospace" style={{ fontSize: '0.82rem' }}>
                                                {item.challanDate ? moment(item.challanDate).format('DD/MM/YYYY') : '-'}
                                             </span>
                                          </td>
                                          <td style={{ padding: '0.6rem 0.6rem' }}>
                                             <div className="fw-semibold text-dark" style={{ fontSize: '0.86rem' }}>
                                                {item.customerName || item.partyLegalName || '—'}
                                             </div>
                                             {item.deliveryAddress && (
                                                <div className="text-muted small text-truncate" style={{ maxWidth: '220px', fontSize: '0.74rem' }} title={item.deliveryAddress}>
                                                   {item.deliveryAddress}
                                                </div>
                                             )}
                                          </td>
                                          <td style={{ padding: '0.6rem 0.6rem' }}>
                                             {item.vehicleNo ? (
                                                <div className="font-monospace fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: '0.80rem' }}>
                                                   <FaTruck size={11} className="text-primary flex-shrink-0" />
                                                   <span>{item.vehicleNo}</span>
                                                </div>
                                             ) : (
                                                <span className="text-muted small">—</span>
                                             )}
                                             <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                {item.transportMode || 'Road'} {item.transporterName ? `• ${item.transporterName}` : ''}
                                             </div>
                                          </td>
                                          <td className="text-center font-monospace fw-bold text-secondary" style={{ padding: '0.6rem 0.6rem' }}>
                                             {item.totalQuantity ? Number(item.totalQuantity).toFixed(2) : '1.00'}
                                          </td>
                                          {!isTrash && (
                                             <td style={{ padding: '0.6rem 0.6rem' }}>
                                                {isBilled ? (
                                                   <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.72rem', padding: '3px 8px' }}>
                                                      {item.invoiceNo ? (
                                                         <Link to={`/sales/invoice/${item.invoiceId}/edit`} className="text-success fw-bold text-decoration-none">
                                                            ✓ Invoiced (#{item.invoiceNo})
                                                         </Link>
                                                      ) : (
                                                         '✓ Invoiced'
                                                      )}
                                                   </span>
                                                ) : (
                                                   <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.72rem', padding: '3px 8px' }}>
                                                      Dispatched (Unbilled)
                                                   </span>
                                                )}
                                             </td>
                                          )}
                                          <td className="small text-muted" style={{ padding: '0.6rem 0.6rem', fontSize: '0.78rem' }}>
                                             {item.createdBy || '—'}
                                          </td>
                                          {isTrash ? (
                                             <>
                                                <td className="small text-muted font-monospace" style={{ padding: '0.6rem 0.6rem', fontSize: '0.76rem' }}>
                                                   {item.deletedAt ? moment(item.deletedAt).format('DD/MM/YYYY, hh:mm A') : '—'}
                                                </td>
                                                <td className="small text-muted" style={{ padding: '0.6rem 0.6rem', fontSize: '0.78rem' }}>
                                                   {item.deletedBy || '—'}
                                                </td>
                                             </>
                                          ) : (
                                             <td className="small text-muted font-monospace" style={{ padding: '0.6rem 0.6rem', fontSize: '0.76rem' }}>
                                                {item.updatedAt ? moment(item.updatedAt).format('DD/MM/YYYY, hh:mm A') : (item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY, hh:mm A') : '—')}
                                             </td>
                                          )}
                                          <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                             {!isTrash ? (
                                                <div className="action-btn-group">
                                                   {/* Primary Action: Download PDF */}
                                                   <Button
                                                      variant="light"
                                                      size="sm"
                                                      className="btn-action-primary-pdf"
                                                      title="Download Delivery Challan PDF"
                                                      disabled={downloadingChallanId === item.challanId}
                                                      onClick={() => downloadDeliveryChallanPdf({ challanId: item.challanId, challanNo: item.challanNo })}
                                                   >
                                                      {downloadingChallanId === item.challanId ? (
                                                         <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
                                                      ) : (
                                                         <FaDownload size={11} className="text-secondary" />
                                                      )}
                                                   </Button>

                                                   {/* Secondary Actions 3-Dots Dropdown */}
                                                   <Dropdown align="end">
                                                      <Dropdown.Toggle
                                                         as="button"
                                                         className="btn-action-more-dots"
                                                         title="More actions"
                                                         id={`challan-actions-${item.challanId}`}
                                                      >
                                                         <FaEllipsisV size={13} />
                                                      </Dropdown.Toggle>

                                                      <Dropdown.Menu className="action-dropdown-menu shadow">
                                                         {/* Convert to Invoice (if unbilled) */}
                                                         {!isBilled && (
                                                            <Dropdown.Item
                                                               className="d-flex align-items-center gap-2 text-primary fw-semibold"
                                                               onClick={() => navigateWithBranch(`/sales/invoice/create?fromChallanId=${item.challanId}`, 'Select Branch for Invoice')}
                                                            >
                                                               <FaFileInvoice size={12} className="text-primary" />
                                                               <span>Convert to Sales Invoice</span>
                                                            </Dropdown.Item>
                                                         )}

                                                         <Dropdown.Item
                                                            as={Link}
                                                            to={`/sales/challans/${item.challanId}/edit`}
                                                            className="d-flex align-items-center gap-2"
                                                         >
                                                            <FaPen size={12} className="text-muted" />
                                                            <span>Edit Challan</span>
                                                         </Dropdown.Item>

                                                         <Dropdown.Item
                                                            className="d-flex align-items-center gap-2"
                                                            disabled={downloadingChallanId === item.challanId}
                                                            onClick={() => downloadDeliveryChallanPdf({ challanId: item.challanId, challanNo: item.challanNo })}
                                                         >
                                                            <FaDownload size={12} className="text-muted" />
                                                            <span>Download PDF</span>
                                                         </Dropdown.Item>

                                                         <Dropdown.Divider className="my-1" />

                                                         <Dropdown.Item
                                                            className="d-flex align-items-center gap-2 text-danger"
                                                            onClick={() => confirmSoftDelete(`Challan "${item.challanNo}"`, () => deleteInvoiceChallan({ id: item.challanId, isPermanentDelete: false }))}
                                                         >
                                                            <FaTrash size={12} />
                                                            <span>Move to Trash</span>
                                                         </Dropdown.Item>
                                                      </Dropdown.Menu>
                                                   </Dropdown>
                                                </div>
                                             ) : (
                                                <div className="action-btn-group">
                                                   <Button
                                                      variant="outline-success"
                                                      size="sm"
                                                      className="btn-action-trash text-success"
                                                      title="Restore"
                                                      onClick={() => confirmRestore(`Challan "${item.challanNo}"`, () => restoreInvoiceChallan(item.challanId))}
                                                   >
                                                      <FaUndo size={11} />
                                                   </Button>
                                                   <Button
                                                      variant="outline-danger"
                                                      size="sm"
                                                      className="btn-action-trash text-danger"
                                                      title="Delete Permanently"
                                                      onClick={() => confirmPermanentDelete(`Challan "${item.challanNo}"`, () => deleteInvoiceChallan({ id: item.challanId, isPermanentDelete: true }))}
                                                   >
                                                      <FaExclamationTriangle size={11} />
                                                   </Button>
                                                </div>
                                             )}
                                          </td>
                                       </tr>
                                    );
                                 })
                              ) : (
                                 <tr>
                                    <td colSpan={10} className="text-center py-4 text-muted">
                                       {isTrash
                                          ? (debouncedSearch ? `No deleted challans matching "${debouncedSearch}"` : 'Recycle Bin is empty.')
                                          : (debouncedSearch ? `No delivery challans matching "${debouncedSearch}"` : 'No delivery challans found.')
                                       }
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </Table>
                     </div>

                     {invoiceChallan.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-3 px-4">
                           <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
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

         {/* Branch Selection Modal for Consolidated Mode */}
         <BranchModal />
      </div>
   );
};

export default InvoiceChallan;
