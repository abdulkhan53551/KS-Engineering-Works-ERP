import React, { useCallback, useState } from 'react'
import { Row, Col, Table, Button, Form, Spinner, FormCheck } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaDownload, FaPen, FaTrash, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import {
   useBulkDeleteInvoices,
   useBulkRestoreInvoices,
   useDeleteInvoice,
   useDownloadInvoice,
   useInvoice,
   useInvoicePagination,
   useRestoreInvoice
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

const InvoiceList = () => {
   const dispatch = useDispatch();
   const [page, setPage] = useState(1);
   const [search, setSearch] = useState('');
   const [isTrash, setIsTrash] = useState(false);
   const [selectedIds, setSelectedIds] = useState([]);

   const debouncedSearch = useDebounce(search, 400);

   const { data: invoice = [], isLoading } = useInvoice({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { data: pagination = {} } = useInvoicePagination({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { mutate: deleteInvoice } = useDeleteInvoice();
   const { mutate: restoreInvoice } = useRestoreInvoice();
   const { mutate: bulkDeleteInvoices } = useBulkDeleteInvoices();
   const { mutate: bulkRestoreInvoices } = useBulkRestoreInvoices();
   const { mutate: downloadInvoice, downloadingInvoiceId } = useDownloadInvoice();

   const { showModal } = useUIManager();
   const { pageStart, pageEnd, total: totalItems } = pagination;

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
         const allIds = invoice.map(item => item.invoiceId);
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

   const isAllSelected = invoice.length > 0 && selectedIds.length === invoice.length;
   const isIndeterminate = selectedIds.length > 0 && selectedIds.length < invoice.length;

   // Action: Move to Trash (Soft Delete)
   const handleDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Move to Recycle Bin",
         message: `Are you sure you want to move Invoice "${name}" to the Recycle Bin? Attached Challans and E-Way bills will be unlinked.`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteInvoice({ id, isPermanentDelete: false });
         },
      });
   };

   // Action: Restore Single Item
   const handleRestore = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Restore Invoice",
         message: `Are you sure you want to restore Invoice "${name}" back to active invoices?`,
         confirmText: "Restore",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            restoreInvoice(id);
         },
      });
   };

   // Action: Permanent Delete Single Item
   const handlePermanentDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete Invoice",
         message: `Are you sure you want to PERMANENTLY delete Invoice "${name}"? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteInvoice({ id, isPermanentDelete: true });
         },
      });
   };

   // Action: Bulk Move to Trash
   const handleBulkDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Move Selected to Recycle Bin",
         message: `Are you sure you want to move ${selectedIds.length} selected invoices to the Recycle Bin?`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeleteInvoices({ ids: selectedIds, isPermanentDelete: false });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Restore
   const handleBulkRestore = () => {
      showModal("confirm", {
         show: true,
         title: "Restore Selected Invoices",
         message: `Are you sure you want to restore ${selectedIds.length} selected invoices back to active records?`,
         confirmText: "Restore All",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkRestoreInvoices({ ids: selectedIds });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Permanent Delete
   const handleBulkPermanentDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete Selected Invoices",
         message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected invoices? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeleteInvoices({ ids: selectedIds, isPermanentDelete: true });
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
                           <h4 className="card-title mb-0">Invoice List</h4>
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
                                 {isTrash ? 'Showing deleted invoices' : 'Showing active invoices'}
                              </span>
                           </div>
                           <Form.Floating className="custom-form-floating form-floating-sm mb-0">
                              <Form.Control
                                 type="text"
                                 id="floatingSearchInvoice"
                                 placeholder="Search..."
                                 value={search}
                                 onChange={onSearch}
                              />
                              <Form.Label htmlFor="floatingSearchInvoice">Search Invoices</Form.Label>
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
                                    <th>Invoice No.</th>
                                    <th>Invoice Date</th>
                                    <th>Invoice Due Date</th>
                                    <th>Customer Name</th>
                                    <th>GST No.</th>
                                    <th>Total</th>
                                    {!isTrash && (
                                       <>
                                          <th>Payment Status</th>
                                          <th>Payment Mode</th>
                                       </>
                                    )}
                                    <th>Added By</th>
                                    {isTrash ? (
                                       <>
                                          <th>Deleted Date</th>
                                          <th>Deleted By</th>
                                       </>
                                    ) : (
                                       <th>Last Modified</th>
                                    )}
                                    <th min-width="120px">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {invoice.length ? (
                                    invoice.map((item, idx) => (
                                       <tr key={idx} className={selectedIds.includes(item.invoiceId) ? 'table-active' : ''}>
                                          <td className="text-center">
                                             <FormCheck
                                                type="checkbox"
                                                checked={selectedIds.includes(item.invoiceId)}
                                                onChange={() => handleSelectRow(item.invoiceId)}
                                             />
                                          </td>
                                          <td className="text-center">{item.invoiceId}</td>
                                          <td><span className="fw-semibold text-primary">{item.invoiceNo}</span></td>
                                          <td>{item.invoiceDate ? moment(item.invoiceDate).format('DD/MM/YYYY') : '-'}</td>
                                          <td>{item.dueDate ? moment(item.dueDate).format('DD/MM/YYYY') : '-'}</td>
                                          <td>{item.customerName}</td>
                                          <td>{item.gstNumber || '-'}</td>
                                          <td>₹{item.total ? Number(item.total).toLocaleString('en-IN') : '0'}</td>
                                          {!isTrash && (
                                             <>
                                                <td><span className={`badge ${item.color}`}>{item.paymentStatusCode}</span></td>
                                                <td>{item.paymentModeCode || '-'}</td>
                                             </>
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
                                                      <Button
                                                         className="me-2"
                                                         variant="outline-primary"
                                                         size="sm"
                                                         title="Download PDF"
                                                         disabled={downloadingInvoiceId === item.invoiceId}
                                                         onClick={() => downloadInvoice(item.invoiceId)}
                                                      >
                                                         {downloadingInvoiceId === item.invoiceId ? (
                                                            <Spinner
                                                               as="span"
                                                               animation="border"
                                                               size="sm"
                                                               role="status"
                                                               aria-hidden="true"
                                                            />
                                                         ) : (
                                                            <FaDownload />
                                                         )}
                                                      </Button>
                                                      <Link className="me-2" to={`/sales/invoice/${item.invoiceId}/edit`}>
                                                         <Button variant="outline-success" size='sm' title="Edit">
                                                            <FaPen />
                                                         </Button>
                                                      </Link>
                                                      <Button
                                                         variant="outline-danger"
                                                         size='sm'
                                                         title="Move to Bin"
                                                         onClick={() => handleDelete(item.invoiceId, item.invoiceNo || item.customerName)}
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
                                                         onClick={() => handleRestore(item.invoiceId, item.invoiceNo || item.customerName)}
                                                      >
                                                         <FaUndo />
                                                      </Button>
                                                      <Button
                                                         variant="outline-danger"
                                                         size='sm'
                                                         title="Delete Permanently"
                                                         onClick={() => handlePermanentDelete(item.invoiceId, item.invoiceNo || item.customerName)}
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
                                       <td colSpan={isTrash ? 11 : 12} className="text-center text-muted py-4">
                                          {isTrash ? 'Recycle bin is empty.' : 'No invoices found.'}
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

export default InvoiceList;