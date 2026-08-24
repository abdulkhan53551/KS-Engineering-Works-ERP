import React, { memo, useState, useMemo, useEffect } from 'react';
import { Row, Col, Table, Button, Form, FormCheck, InputGroup, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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
   FaSortAlphaDownAlt
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import {
   useBulkDeletePurchaseOrders,
   useBulkRestorePurchaseOrders,
   useDeletePurchaseOrder,
   usePurchaseOrder,
   usePurchaseOrderPagination,
   useRestorePurchaseOrder
} from '../hooks/useApi';
import PaginationBar from '../../../components/PaginationBar';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import useListManager from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';

const PurchaseOrderList = () => {
   // Trash Action Helpers
   const {
      confirmSoftDelete,
      confirmRestore,
      confirmPermanentDelete,
      confirmBulkSoftDelete,
      confirmBulkRestore,
      confirmBulkPermanentDelete
   } = useTrashActions({ entityName: 'Purchase Order' });

   // API Mutations
   const { mutate: deletePurchaseOrder } = useDeletePurchaseOrder();
   const { mutate: restorePurchaseOrder } = useRestorePurchaseOrder();
   const { mutate: bulkDeletePurchaseOrders } = useBulkDeletePurchaseOrders();
   const { mutate: bulkRestorePurchaseOrders } = useBulkRestorePurchaseOrders();

   // Sorting state
   const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

   // Data fetching
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
      idKey: 'poId',
      initialPageSize: 10
   });

   // Fetch data using debouncedSearch and isTrash
   const {
      data: purchaseOrder = [],
      isLoading: isListLoading,
      isFetching: isListFetching,
      refetch: refetchList
   } = usePurchaseOrder({ page, pageSize, search: debouncedSearch, trash: isTrash });

   const {
      data: pagination = {},
      isLoading: isPaginationLoading,
      isFetching: isPaginationFetching,
      refetch: refetchPagination
   } = usePurchaseOrderPagination({ page, pageSize, search: debouncedSearch, trash: isTrash });

   const isFetching = isListFetching || isPaginationFetching;
   const isLoading = isListLoading || isPaginationLoading;

   const handleRefresh = () => {
      refetchList();
      refetchPagination();
   };

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

   // Sorted data
   const sortedList = useMemo(() => {
      let items = [...purchaseOrder];
      if (sortConfig.key) {
         items.sort((a, b) => {
            let aVal = a[sortConfig.key] ?? '';
            let bVal = b[sortConfig.key] ?? '';

            if (sortConfig.key === 'poId') {
               const numA = Number(aVal) || 0;
               const numB = Number(bVal) || 0;
               return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }

            if (sortConfig.key === 'poDate' || sortConfig.key === 'updatedAt' || sortConfig.key === 'deletedAt' || sortConfig.key === 'createdAt') {
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
   }, [purchaseOrder, sortConfig]);

   // Sync items with list manager
   useEffect(() => {
      setTempItems(sortedList);
   }, [sortedList]);

   const { pageStart, pageEnd, total: totalItems } = pagination;

   return (
      <>
         <PageLoader loading={isFetching && !isLoading} />
         <Row>
            <Col sm="12">
               <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                     <div className="header-title d-flex align-items-center gap-2">
                        <h4 className="card-title mb-0">Purchase Order</h4>
                        {!isLoading && totalItems > 0 && (
                           <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-1">
                              {totalItems} Total
                           </Badge>
                        )}
                     </div>
                     <TrashTabFilter isTrash={isTrash} onTabChange={handleTabChange} />
                     <div>
                        {!isTrash && (
                           <Link to="/purchase/purchase-order/create">
                              <Button type="button" variant="primary">
                                 Add Purchase Order
                              </Button>
                           </Link>
                        )}
                     </div>
                  </Card.Header>

                  <BulkActionBar
                     selectedCount={selectedCount}
                     isTrash={isTrash}
                     onBulkDelete={() => confirmBulkSoftDelete(selectedCount, () => {
                        bulkDeletePurchaseOrders({ ids: selectedIds, isPermanentDelete: false });
                        handleDeselectAll();
                     })}
                     onBulkRestore={() => confirmBulkRestore(selectedCount, () => {
                        bulkRestorePurchaseOrders({ ids: selectedIds });
                        handleDeselectAll();
                     })}
                     onBulkPermanentDelete={() => confirmBulkPermanentDelete(selectedCount, () => {
                        bulkDeletePurchaseOrders({ ids: selectedIds, isPermanentDelete: true });
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
                                 placeholder="Search purchase orders..."
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
                        <Table id="po-list-table" className="table-sortable table-striped mb-0 align-middle" striped bordered hover responsive role="grid">
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
                                    onClick={() => handleSort('poId')}
                                 >
                                    #ID {renderSortIcon('poId')}
                                 </th>
                                 <th
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                    onClick={() => handleSort('poDate')}
                                 >
                                    PO Date {renderSortIcon('poDate')}
                                 </th>
                                 <th
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '200px', padding: '0.45rem 0.5rem' }}
                                    onClick={() => handleSort('customerName')}
                                 >
                                    Customer Name {renderSortIcon('customerName')}
                                 </th>
                                 <th
                                    className="cursor-pointer user-select-none py-2"
                                    style={{ minWidth: '140px', padding: '0.45rem 0.5rem' }}
                                    onClick={() => handleSort('poNo')}
                                 >
                                    PO No {renderSortIcon('poNo')}
                                 </th>
                                 {!isTrash && (
                                    <th
                                       className="cursor-pointer user-select-none py-2"
                                       style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                       onClick={() => handleSort('invoiceStatus')}
                                    >
                                       Invoice Status {renderSortIcon('invoiceStatus')}
                                    </th>
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
                                       style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                       onClick={() => handleSort('updatedAt')}
                                    >
                                       Updated At {renderSortIcon('updatedAt')}
                                    </th>
                                 )}
                                 <th className="text-center py-2" style={{ width: '100px', minWidth: '100px', padding: '0.45rem 0.5rem' }}>
                                    Action
                                 </th>
                              </tr>
                           </thead>
                           <tbody style={{ fontSize: '0.86rem' }}>
                              {sortedList.length > 0 ? (
                                 sortedList.map((item, idx) => (
                                    <tr key={item.poId || idx} className={selectedIds.includes(item.poId) ? 'table-active' : ''}>
                                       <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                          <FormCheck
                                             type="checkbox"
                                             checked={selectedIds.includes(item.poId)}
                                             onChange={() => handleSelectRow(item.poId)}
                                          />
                                       </td>
                                       <td className="text-center text-muted fw-medium" style={{ padding: '0.45rem 0.3rem' }}>{item.poId}</td>
                                       <td style={{ padding: '0.45rem 0.5rem' }}>{item.poDate ? moment(item.poDate).format('DD/MM/YYYY') : '-'}</td>
                                       <td style={{ padding: '0.45rem 0.5rem' }}><span className="fw-semibold text-dark">{item.customerName}</span></td>
                                       <td style={{ padding: '0.45rem 0.5rem' }}><span className="text-primary font-monospace fw-bold">{item.poNo}</span></td>
                                       {!isTrash && (
                                          <td style={{ padding: '0.45rem 0.5rem' }}><span className={`badge ${item.color}`}>{item.invoiceStatus}</span></td>
                                       )}
                                       <td style={{ padding: '0.45rem 0.5rem' }}>{item.createdBy}</td>
                                       {isTrash ? (
                                          <>
                                             <td style={{ padding: '0.45rem 0.5rem' }}>{item.deletedAt ? moment(item.deletedAt).format('DD/MM/YYYY hh:mm A') : '-'}</td>
                                             <td style={{ padding: '0.45rem 0.5rem' }}>{item.deletedBy || '-'}</td>
                                          </>
                                       ) : (
                                          <td style={{ padding: '0.45rem 0.5rem' }}>{item.updatedAt ? moment(item.updatedAt).format('DD/MM/YYYY') : '-'}</td>
                                       )}
                                       <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                          <div className="flex align-items-center list-user-action">
                                             {!isTrash ? (
                                                <>
                                                   <Link className="me-2" to={`/purchase/purchase-order/${item.poId}/edit`}>
                                                      <Button variant="outline-success" size='sm' title="Edit">
                                                         <FaPen />
                                                      </Button>
                                                   </Link>
                                                   <Button
                                                      variant="outline-danger"
                                                      size='sm'
                                                      title="Move to Bin"
                                                      onClick={() => confirmSoftDelete(`PO "${item.poNo}"`, () => deletePurchaseOrder({ id: item.poId, isPermanentDelete: false }))}
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
                                                      onClick={() => confirmRestore(`PO "${item.poNo}"`, () => restorePurchaseOrder(item.poId))}
                                                   >
                                                      <FaUndo />
                                                   </Button>
                                                   <Button
                                                      variant="outline-danger"
                                                      size='sm'
                                                      title="Delete Permanently"
                                                      onClick={() => confirmPermanentDelete(`PO "${item.poNo}"`, () => deletePurchaseOrder({ id: item.poId, isPermanentDelete: true }))}
                                                   >
                                                      <FaExclamationTriangle />
                                                   </Button>
                                                </>
                                             )}
                                          </div>
                                       </td>
                                    </tr>
                                 ))
                              ) : (
                                 <tr>
                                    <td colSpan={isTrash ? 9 : 8} className="text-center py-4 text-muted">
                                       {isTrash
                                          ? (debouncedSearch ? `No deleted purchase orders matching "${debouncedSearch}"` : 'Recycle Bin is empty.')
                                          : (debouncedSearch ? `No purchase orders matching "${debouncedSearch}"` : 'No purchase orders found.')
                                       }
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </Table>
                     </div>

                     {purchaseOrder.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-3" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                           <div className="text-muted small">
                              Showing {pageStart} to {pageEnd} of {totalItems} entries
                           </div>
                           <PaginationBar
                              page={page}
                              pageSize={pageSize}
                              total={totalItems}
                              totalPages={pagination.totalPage}
                              onPageChange={handlePageChange}
                           />
                        </div>
                     )}
                  </Card.Body>
               </Card>
            </Col>
         </Row>
      </>
   );
};

export default memo(PurchaseOrderList);