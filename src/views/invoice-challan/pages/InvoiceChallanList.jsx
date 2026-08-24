import React, { useCallback, useState } from 'react'
import { Row, Col, Table, Button, Form, FormCheck } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaPen, FaTrash, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
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
import { useUIManager } from '../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../store/uiModal.slice';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import useDebounce from '../../../hooks/useDebounce';

const pageSize = 10;

const InvoiceChallan = () => {
   const dispatch = useDispatch();
   const [page, setPage] = useState(1);
   const [search, setSearch] = useState('');
   const [isTrash, setIsTrash] = useState(false);
   const [selectedIds, setSelectedIds] = useState([]);

   const debouncedSearch = useDebounce(search, 400);

   const { data: invoiceChallan = [], isLoading } = useGetInvoiceChallan({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { data: pagination = {} } = useGetInvoiceChallanPagination({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { mutate: deleteInvoiceChallan } = useDeleteInvoiceChallan();
   const { mutate: restoreInvoiceChallan } = useRestoreInvoiceChallan();
   const { mutate: bulkDeleteInvoiceChallans } = useBulkDeleteInvoiceChallans();
   const { mutate: bulkRestoreInvoiceChallans } = useBulkRestoreInvoiceChallans();

   const { pageStart, pageEnd, total: totalItems } = pagination;
   const { showModal } = useUIManager();

   const handleTabChange = (trashState) => {
      setIsTrash(trashState);
      setPage(1);
      setSelectedIds([]);
   };

   const onSearch = (e) => {
      setSearch(e.target.value);
      setPage(1);
      setSelectedIds([]);
   };

   const handleOnPageChange = useCallback((newPage) => {
      setPage(newPage);
      setSelectedIds([]);
   }, []);

   // Multi-selection handlers
   const handleSelectAll = (e) => {
      if (e.target.checked) {
         const allIds = invoiceChallan.map(item => item.challanId);
         setSelectedIds(allIds);
      } else {
         setSelectedIds([]);
      }
   };

   const handleSelectRow = (id) => {
      setSelectedIds(prev =>
         prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
   };

   const isAllSelected = invoiceChallan.length > 0 && selectedIds.length === invoiceChallan.length;
   const isIndeterminate = selectedIds.length > 0 && selectedIds.length < invoiceChallan.length;

   // Action: Move to Trash (Soft Delete)
   const handleDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Move to Recycle Bin",
         message: `Are you sure you want to move Challan "${name}" to the Recycle Bin?`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteInvoiceChallan({ id, isPermanentDelete: false });
         },
      });
   };

   // Action: Restore Single Item
   const handleRestore = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Restore Challan",
         message: `Are you sure you want to restore Challan "${name}" back to active challans?`,
         confirmText: "Restore",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            restoreInvoiceChallan(id);
         },
      });
   };

   // Action: Permanent Delete Single Item
   const handlePermanentDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete Challan",
         message: `Are you sure you want to PERMANENTLY delete Challan "${name}"? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteInvoiceChallan({ id, isPermanentDelete: true });
         },
      });
   };

   // Action: Bulk Move to Trash
   const handleBulkDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Move Selected to Recycle Bin",
         message: `Are you sure you want to move ${selectedIds.length} selected challans to the Recycle Bin?`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeleteInvoiceChallans({ ids: selectedIds, isPermanentDelete: false });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Restore
   const handleBulkRestore = () => {
      showModal("confirm", {
         show: true,
         title: "Restore Selected Challans",
         message: `Are you sure you want to restore ${selectedIds.length} selected challans back to active records?`,
         confirmText: "Restore All",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkRestoreInvoiceChallans({ ids: selectedIds });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Permanent Delete
   const handleBulkPermanentDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete Selected Challans",
         message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected challans? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeleteInvoiceChallans({ ids: selectedIds, isPermanentDelete: true });
            setSelectedIds([]);
         },
      });
   };

   return (
      <>
         <div>
            <Row>
               <Col sm="12">
                  <Card>
                     <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="header-title d-flex align-items-center gap-3">
                           <h4 className="card-title mb-0">Invoice Challan List</h4>
                           <TrashTabFilter
                              isTrash={isTrash}
                              onTabChange={handleTabChange}
                              trashLabel="Recycle Bin"
                           />
                        </div>
                     </Card.Header>
                     <Card.Body className="px-0">
                        <PageLoader loading={isLoading} />
                        <div className="d-flex justify-content-between align-items-center px-4 mb-3">
                           <div className="d-flex align-items-center">
                              <span className="text-muted small">
                                 {isTrash ? 'Showing deleted invoice challans' : 'Showing active invoice challans'}
                              </span>
                           </div>
                           <Form.Floating className="custom-form-floating form-floating-sm mb-0">
                              <Form.Control
                                 type="text"
                                 id="floatingSearchChallan"
                                 placeholder="Search..."
                                 value={search}
                                 onChange={onSearch}
                              />
                              <Form.Label htmlFor="floatingSearchChallan">Search Challans</Form.Label>
                           </Form.Floating>
                        </div>

                        <div className="px-4">
                           <BulkActionBar
                              selectedCount={selectedIds.length}
                              isTrash={isTrash}
                              onBulkDelete={handleBulkDelete}
                              onBulkRestore={handleBulkRestore}
                              onBulkPermanentDelete={handleBulkPermanentDelete}
                              onClearSelection={() => setSelectedIds([])}
                           />
                        </div>

                        <div className="table-responsive">
                           <Table className='table-sortable ms-1 me-1' striped bordered hover responsive>
                              <thead>
                                 <tr className="light">
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
                                    <th>#ID</th>
                                    <th>Customer Name</th>
                                    <th>Challan No.</th>
                                    <th>Challan Date</th>
                                    {!isTrash && <th>Is Invoiced</th>}
                                    <th>Added By</th>
                                    {isTrash ? (
                                       <>
                                          <th>Deleted Date</th>
                                          <th>Deleted By</th>
                                       </>
                                    ) : (
                                       <th>Last Modified</th>
                                    )}
                                    <th min-width="100px">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {invoiceChallan.length ? (
                                    invoiceChallan.map((item, idx) => (
                                       <tr key={idx} className={selectedIds.includes(item.challanId) ? 'table-active' : ''}>
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
                                                         onClick={() => handleDelete(item.challanId, item.challanNo || item.customerName)}
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
                                                         onClick={() => handleRestore(item.challanId, item.challanNo || item.customerName)}
                                                      >
                                                         <FaUndo />
                                                      </Button>
                                                      <Button
                                                         variant="outline-danger"
                                                         size='sm'
                                                         title="Delete Permanently"
                                                         onClick={() => handlePermanentDelete(item.challanId, item.challanNo || item.customerName)}
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
                                       <td colSpan={isTrash ? 8 : 8} className="text-center text-muted py-4">
                                          {isTrash ? 'Recycle bin is empty.' : 'No invoice challans found.'}
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </Table>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: '1rem', marginRight: '1rem' }}>
                           <div>
                              Showing {pageStart} to {pageEnd} of {totalItems} entries
                           </div>
                           <PaginationBar
                              page={page}
                              pageSize={pagination.pageSize || pageSize}
                              total={pagination.total || 0}
                              totalPages={pagination.totalPages || 1}
                              onPageChange={handleOnPageChange}
                           />
                        </div>
                     </Card.Body>
                  </Card>
               </Col>
            </Row>
         </div>
      </>
   );
};

export default InvoiceChallan;