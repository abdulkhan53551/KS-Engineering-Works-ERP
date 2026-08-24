import React, { useCallback, useState } from 'react'
import { Row, Col, Table, Button, Form, FormCheck } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaPen, FaTrash, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import {
   useBulkDeleteEwayBills,
   useBulkRestoreEwayBills,
   useDeleteEwayBill,
   useEwayBill,
   useEwayBillPagination,
   useRestoreEwayBill
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

const EwayBillList = () => {
   const dispatch = useDispatch();
   const [page, setPage] = useState(1);
   const [search, setSearch] = useState('');
   const [isTrash, setIsTrash] = useState(false);
   const [selectedIds, setSelectedIds] = useState([]);

   const debouncedSearch = useDebounce(search, 400);

   const { data: ewayBill = [], isLoading } = useEwayBill({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { data: pagination = {} } = useEwayBillPagination({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { mutate: deleteEwayBill } = useDeleteEwayBill();
   const { mutate: restoreEwayBill } = useRestoreEwayBill();
   const { mutate: bulkDeleteEwayBills } = useBulkDeleteEwayBills();
   const { mutate: bulkRestoreEwayBills } = useBulkRestoreEwayBills();

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
         const allIds = ewayBill.map(item => item.ewayBillId);
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

   const isAllSelected = ewayBill.length > 0 && selectedIds.length === ewayBill.length;
   const isIndeterminate = selectedIds.length > 0 && selectedIds.length < ewayBill.length;

   // Action: Move to Trash (Soft Delete)
   const handleDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Move to Recycle Bin",
         message: `Are you sure you want to move E-way Bill "${name}" to the Recycle Bin?`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteEwayBill({ id, isPermanentDelete: false });
         },
      });
   };

   // Action: Restore Single Item
   const handleRestore = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Restore E-way Bill",
         message: `Are you sure you want to restore E-way Bill "${name}" back to active records?`,
         confirmText: "Restore",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            restoreEwayBill(id);
         },
      });
   };

   // Action: Permanent Delete Single Item
   const handlePermanentDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete E-way Bill",
         message: `Are you sure you want to PERMANENTLY delete E-way Bill "${name}"? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteEwayBill({ id, isPermanentDelete: true });
         },
      });
   };

   // Action: Bulk Move to Trash
   const handleBulkDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Move Selected to Recycle Bin",
         message: `Are you sure you want to move ${selectedIds.length} selected E-way bills to the Recycle Bin?`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeleteEwayBills({ ids: selectedIds, isPermanentDelete: false });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Restore
   const handleBulkRestore = () => {
      showModal("confirm", {
         show: true,
         title: "Restore Selected E-way Bills",
         message: `Are you sure you want to restore ${selectedIds.length} selected E-way bills back to active records?`,
         confirmText: "Restore All",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkRestoreEwayBills({ ids: selectedIds });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Permanent Delete
   const handleBulkPermanentDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete Selected E-way Bills",
         message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected E-way bills? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeleteEwayBills({ ids: selectedIds, isPermanentDelete: true });
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
                           <h4 className="card-title mb-0">E-way Bill List</h4>
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
                                 {isTrash ? 'Showing deleted E-way bills' : 'Showing active E-way bills'}
                              </span>
                           </div>
                           <Form.Floating className="custom-form-floating form-floating-sm mb-0">
                              <Form.Control
                                 type="text"
                                 id="floatingSearchEway"
                                 placeholder="Search..."
                                 value={search}
                                 onChange={onSearch}
                              />
                              <Form.Label htmlFor="floatingSearchEway">Search E-way Bills</Form.Label>
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
                                    <th>E-way Bill Date</th>
                                    <th>E-way Bill Validity</th>
                                    <th>Customer Name</th>
                                    <th>E-way Bill No.</th>
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
                                 {ewayBill.length ? (
                                    ewayBill.map((item, idx) => (
                                       <tr key={idx} className={selectedIds.includes(item.ewayBillId) ? 'table-active' : ''}>
                                          <td className="text-center">
                                             <FormCheck
                                                type="checkbox"
                                                checked={selectedIds.includes(item.ewayBillId)}
                                                onChange={() => handleSelectRow(item.ewayBillId)}
                                             />
                                          </td>
                                          <td className="text-center">{item.ewayBillId}</td>
                                          <td>{item.ewayBillDate ? moment(item.ewayBillDate).format('DD/MM/YYYY') : '-'}</td>
                                          <td>{item.validUpto ? moment(item.validUpto).format('DD/MM/YYYY') : '-'}</td>
                                          <td>{item.customerName}</td>
                                          <td><span className="fw-semibold text-primary">{item.ewayBillNo}</span></td>
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
                                                      <Link className="me-2" to={`/sales/eway-bill/${item.ewayBillId}/edit`}>
                                                         <Button variant="outline-success" size='sm' title="Edit">
                                                            <FaPen />
                                                         </Button>
                                                      </Link>
                                                      <Button
                                                         variant="outline-danger"
                                                         size='sm'
                                                         title="Move to Bin"
                                                         onClick={() => handleDelete(item.ewayBillId, item.ewayBillNo || item.customerName)}
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
                                                         onClick={() => handleRestore(item.ewayBillId, item.ewayBillNo || item.customerName)}
                                                      >
                                                         <FaUndo />
                                                      </Button>
                                                      <Button
                                                         variant="outline-danger"
                                                         size='sm'
                                                         title="Delete Permanently"
                                                         onClick={() => handlePermanentDelete(item.ewayBillId, item.ewayBillNo || item.customerName)}
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
                                       <td colSpan={isTrash ? 8 : 9} className="text-center text-muted py-4">
                                          {isTrash ? 'Recycle bin is empty.' : 'No E-way bills found.'}
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

export default EwayBillList;