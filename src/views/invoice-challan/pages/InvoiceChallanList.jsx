import React from 'react';
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
   FaSyncAlt
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import {
   useBulkDeleteInvoiceChallans,
   useBulkRestoreInvoiceChallans,
   useDeleteInvoiceChallan,
   useGetInvoiceChallan,
   useGetInvoiceChallanPagination,
   useRestoreInvoiceChallan
} from '../hooks/useApi';
import PaginationBar from '../../../components/PaginationBar';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import useListManager from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';

const InvoiceChallan = () => {
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

   // Data fetching state
   const [tempItems, setTempItems] = React.useState([]);

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
      idKey: 'challanId',
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

   React.useEffect(() => {
      setTempItems(invoiceChallan);
   }, [invoiceChallan]);

   const { pageStart, pageEnd, total: totalItems } = pagination;

   return (
      <>
         <PageLoader loading={isFetching && !isLoading} />
         <Row>
            <Col sm="12">
               <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                     <div className="header-title d-flex align-items-center gap-2">
                        <h4 className="card-title mb-0">Invoice Challan</h4>
                        {!isLoading && totalItems > 0 && (
                           <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-1">
                              {totalItems} Total
                           </Badge>
                        )}
                     </div>
                     <TrashTabFilter isTrash={isTrash} onTabChange={handleTabChange} />
                     <div>
                        {!isTrash && (
                           <Link to="/sales/challans/create">
                              <Button type="button" variant="primary">
                                 Add Challan
                              </Button>
                           </Link>
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
                                 placeholder="Search challans..."
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
                        <Table id="challan-list-table" className="table-striped mb-0" role="grid">
                           <thead>
                              <tr className="light">
                                 <th className="text-center" style={{ width: '40px' }}>
                                    <FormCheck
                                       type="checkbox"
                                       checked={isAllSelected}
                                       ref={(el) => {
                                          if (el) el.indeterminate = isIndeterminate;
                                       }}
                                       onChange={handleSelectAll}
                                    />
                                 </th>
                                 <th className="text-center">Sr.No</th>
                                 <th>Customer Name</th>
                                 <th>Challan No</th>
                                 <th>Challan Date</th>
                                 {!isTrash && <th>Invoice Status</th>}
                                 <th>Created By</th>
                                 {isTrash ? (
                                    <>
                                       <th>Deleted Date</th>
                                       <th>Deleted By</th>
                                    </>
                                 ) : (
                                    <th>Updated At</th>
                                 )}
                                 <th style={{ minWidth: '100px' }}>Action</th>
                              </tr>
                           </thead>
                           <tbody>
                              {invoiceChallan.length > 0 ? (
                                 invoiceChallan.map((item, idx) => (
                                    <tr key={item.challanId || idx} className={selectedIds.includes(item.challanId) ? 'table-active' : ''}>
                                       <td className="text-center">
                                          <FormCheck
                                             type="checkbox"
                                             checked={selectedIds.includes(item.challanId)}
                                             onChange={() => handleSelectRow(item.challanId)}
                                          />
                                       </td>
                                       <td className="text-center">{item.challanId}</td>
                                       <td>{item.customerName}</td>
                                       <td><span className="fw-semibold text-primary">{item.challanNo}</span></td>
                                       <td>{item.challanDate ? moment(item.challanDate).format('DD/MM/YYYY') : '-'}</td>
                                       {!isTrash && (
                                          <td><span className={`badge ${item.color}`}>{item.invoiceStatus}</span></td>
                                       )}
                                       <td>{item.createdBy}</td>
                                       {isTrash ? (
                                          <>
                                             <td>{item.deletedAt ? moment(item.deletedAt).format('DD/MM/YYYY hh:mm A') : '-'}</td>
                                             <td>{item.deletedBy || '-'}</td>
                                          </>
                                       ) : (
                                          <td>{item.updatedAt ? moment(item.updatedAt).format('DD/MM/YYYY') : '-'}</td>
                                       )}
                                       <td>
                                          <div className="flex align-items-center list-user-action">
                                             {!isTrash ? (
                                                <>
                                                   <Link className="me-2" to={`/sales/challans/${item.challanId}/edit`}>
                                                      <Button variant="outline-success" size='sm' title="Edit">
                                                         <FaPen />
                                                      </Button>
                                                   </Link>
                                                   <Button
                                                      variant="outline-danger"
                                                      size='sm'
                                                      title="Move to Bin"
                                                      onClick={() => confirmSoftDelete(`Challan "${item.challanNo}"`, () => deleteInvoiceChallan({ id: item.challanId, isPermanentDelete: false }))}
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
                                                      onClick={() => confirmRestore(`Challan "${item.challanNo}"`, () => restoreInvoiceChallan(item.challanId))}
                                                   >
                                                      <FaUndo />
                                                   </Button>
                                                   <Button
                                                      variant="outline-danger"
                                                      size='sm'
                                                      title="Delete Permanently"
                                                      onClick={() => confirmPermanentDelete(`Challan "${item.challanNo}"`, () => deleteInvoiceChallan({ id: item.challanId, isPermanentDelete: true }))}
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
                                    <td colSpan={isTrash ? 8 : 8} className="text-center py-4 text-muted">
                                       {isTrash
                                          ? (debouncedSearch ? `No deleted challans matching "${debouncedSearch}"` : 'Recycle Bin is empty.')
                                          : (debouncedSearch ? `No challans matching "${debouncedSearch}"` : 'No challans found.')
                                       }
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </Table>
                     </div>

                     {invoiceChallan.length > 0 && (
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

export default InvoiceChallan;