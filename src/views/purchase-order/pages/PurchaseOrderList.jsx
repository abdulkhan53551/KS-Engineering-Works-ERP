import React, { memo, useCallback, useState } from 'react'
import { Row, Col, Table, Button, Form, FormCheck } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaPen, FaTrash, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
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
import { useUIManager } from '../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../store/uiModal.slice';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import useDebounce from '../../../hooks/useDebounce';

const pageSize = 10;

const PurchaseOrderList = () => {
   const dispatch = useDispatch();
   const [page, setPage] = useState(1);
   const [search, setSearch] = useState('');
   const [isTrash, setIsTrash] = useState(false);
   const [selectedIds, setSelectedIds] = useState([]);

   const debouncedSearch = useDebounce(search, 400);

   const { data: purchaseOrder = [], isLoading } = usePurchaseOrder({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { data: pagination = {} } = usePurchaseOrderPagination({ page, pageSize, search: debouncedSearch, trash: isTrash });
   const { mutate: deletePurchaseOrder } = useDeletePurchaseOrder();
   const { mutate: restorePurchaseOrder } = useRestorePurchaseOrder();
   const { mutate: bulkDeletePurchaseOrders } = useBulkDeletePurchaseOrders();
   const { mutate: bulkRestorePurchaseOrders } = useBulkRestorePurchaseOrders();

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
         const allIds = purchaseOrder.map(item => item.poId);
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

   const isAllSelected = purchaseOrder.length > 0 && selectedIds.length === purchaseOrder.length;
   const isIndeterminate = selectedIds.length > 0 && selectedIds.length < purchaseOrder.length;

   // Action: Move to Trash (Soft Delete)
   const handleDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Move to Recycle Bin",
         message: `Are you sure you want to move Purchase Order "${name}" to the Recycle Bin?`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deletePurchaseOrder({ id, isPermanentDelete: false });
         },
      });
   };

   // Action: Restore Single Item
   const handleRestore = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Restore Purchase Order",
         message: `Are you sure you want to restore Purchase Order "${name}" back to active records?`,
         confirmText: "Restore",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            restorePurchaseOrder(id);
         },
      });
   };

   // Action: Permanent Delete Single Item
   const handlePermanentDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete Purchase Order",
         message: `Are you sure you want to PERMANENTLY delete Purchase Order "${name}"? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deletePurchaseOrder({ id, isPermanentDelete: true });
         },
      });
   };

   // Action: Bulk Move to Trash
   const handleBulkDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Move Selected to Recycle Bin",
         message: `Are you sure you want to move ${selectedIds.length} selected purchase orders to the Recycle Bin?`,
         confirmText: "Move to Bin",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeletePurchaseOrders({ ids: selectedIds, isPermanentDelete: false });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Restore
   const handleBulkRestore = () => {
      showModal("confirm", {
         show: true,
         title: "Restore Selected Purchase Orders",
         message: `Are you sure you want to restore ${selectedIds.length} selected purchase orders back to active records?`,
         confirmText: "Restore All",
         confirmVariant: "success",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkRestorePurchaseOrders({ ids: selectedIds });
            setSelectedIds([]);
         },
      });
   };

   // Action: Bulk Permanent Delete
   const handleBulkPermanentDelete = () => {
      showModal("confirm", {
         show: true,
         title: "Permanently Delete Selected Purchase Orders",
         message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected purchase orders? This action cannot be undone.`,
         confirmText: "Delete Permanently",
         confirmVariant: "danger",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            bulkDeletePurchaseOrders({ ids: selectedIds, isPermanentDelete: true });
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
                           <h4 className="card-title mb-0">Purchase Order List</h4>
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
                                 {isTrash ? 'Showing deleted purchase orders' : 'Showing active purchase orders'}
                              </span>
                           </div>
                           <Form.Floating className="custom-form-floating form-floating-sm mb-0">
                              <Form.Control
                                 type="text"
                                 id="floatingSearchPO"
                                 placeholder="Search..."
                                 value={search}
                                 onChange={onSearch}
                              />
                              <Form.Label htmlFor="floatingSearchPO">Search PO</Form.Label>
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
                                    <th>PO Date</th>
                                    <th>Customer Name</th>
                                    <th>PO No.</th>
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
                                 {purchaseOrder.length ? (
                                    purchaseOrder.map((item, idx) => (
                                       <tr key={idx} className={selectedIds.includes(item.poId) ? 'table-active' : ''}>
                                          <td className="text-center">
                                             <FormCheck
                                                type="checkbox"
                                                checked={selectedIds.includes(item.poId)}
                                                onChange={() => handleSelectRow(item.poId)}
                                             />
                                          </td>
                                          <td className="text-center">{item.poId}</td>
                                          <td>{item.poDate ? moment(item.poDate).format('DD/MM/YYYY') : '-'}</td>
                                          <td>{item.customerName}</td>
                                          <td>{item.poNo}</td>
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
                                                      <Link className="me-2" to={`/purchase/purchase-order/${item.poId}/edit`}>
                                                         <Button variant="outline-success" size='sm' title="Edit">
                                                            <FaPen />
                                                         </Button>
                                                      </Link>
                                                      <Button
                                                         variant="outline-danger"
                                                         size='sm'
                                                         title="Move to Bin"
                                                         onClick={() => handleDelete(item.poId, item.poNo || item.customerName)}
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
                                                         onClick={() => handleRestore(item.poId, item.poNo || item.customerName)}
                                                      >
                                                         <FaUndo />
                                                      </Button>
                                                      <Button
                                                         variant="outline-danger"
                                                         size='sm'
                                                         title="Delete Permanently"
                                                         onClick={() => handlePermanentDelete(item.poId, item.poNo || item.customerName)}
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
                                       <td colSpan={isTrash ? 9 : 9} className="text-center text-muted py-4">
                                          {isTrash ? 'Recycle bin is empty.' : 'No purchase orders found.'}
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

export default PurchaseOrderList;

const AdvanceSearch = memo(({ name, ...props }) => {
   const initForm = {
      searchTerm: '',
      category: '',
      location: ''
   }

   const navigate = useNavigate();
   const { urlSearchParams } = useKsSearchParam()
   const [searchParam, setSearchParam] = useSearchParams()
   const [show, setShow] = useState(false);
   const [formData, setFormData] = useState({ ...initForm, ...urlSearchParams });

   const handleClose = () => setShow(false);
   const toggleShow = () => setShow((s) => !s);
   const onReset = () => setFormData(initForm)
   const onClear = () => {
      setFormData(initForm)
      setSearchParam({})
      setShow(false)
   }

   const handleOnSearch = (event) => {
      event.preventDefault();
      const form = event.currentTarget;

      // File type input does not contain any error
      if (form.checkValidity()) {
         const searchData = Object.fromEntries(
            Object.entries(formData).filter(([_, value]) => value != null && value !== '')
         )

         setSearchParam(searchData)

         // setFormData(prev => emptyObject(prev))

         // setTimeout(() => {
         //    navigate(`/${ROUTES.CUSTOMER.CUSTOMER_EDIT}/4`)
         // }, 1000);
      } else {
         event.stopPropagation();
      }
   };

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value.trim() ? value : '' });
   };

   return (
      <>
         <Button variant="soft-gray" className=" ms-2 pointer-cursor" onClick={toggleShow}>
            <FaSearchengin size={30} color='black' />
         </Button>
         <Offcanvas show={show} onHide={handleClose} placement="end" className="search-offcanvas" {...props}>
            <Offcanvas.Header closeButton>
               <Offcanvas.Title>Search Panel</Offcanvas.Title>
               <Button onClick={onClear} variant='danger' size='sm'>Clear</Button>
               <Button onClick={onReset} variant='secondary' size='sm'>Reset</Button>
            </Offcanvas.Header>
            <Offcanvas.Body>
               <Form noValidate onSubmit={handleOnSearch}>
                  <Row className="mb-3">
                     <Col md={12}>
                        <Form.Group>
                           <Form.Label>Search</Form.Label>
                           <Form.Control type="text" placeholder="Enter search term" name='searchTerm' value={formData.searchTerm} onChange={handleChange} />
                        </Form.Group>
                     </Col>
                  </Row>
                  <Row className="mb-3">
                     <Col md={6}>
                        <Form.Group>
                           <Form.Label>Category</Form.Label>
                           <Form.Control as="select" name='category' value={formData.category} onChange={handleChange}>
                              <option>All Categories</option>
                              <option>Books</option>
                              <option>Electronics</option>
                              <option>Fashion</option>
                              <option>Home & Kitchen</option>
                           </Form.Control>
                        </Form.Group>
                     </Col>
                     <Col md={6}>
                        <Form.Group>
                           <Form.Label>Location</Form.Label>
                           <Form.Control type="text" placeholder="Enter location" name='location' value={formData.location} onChange={handleChange} />
                        </Form.Group>
                     </Col>
                  </Row>
                  <Button variant="primary" type="submit" className="w-100">
                     Search
                  </Button>
               </Form>
            </Offcanvas.Body>
         </Offcanvas>
      </>
   );
})

function emptyObject(obj) {
   let newObj = {};
   for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
         if (Array.isArray(obj[prop])) {
            newObj[prop] = []; // Empty array
         } else if (typeof obj[prop] === 'object') {
            newObj[prop] = emptyObject(obj[prop]); // Recursively empty nested objects
         } else {
            newObj[prop] = ''; // Empty string (you can replace it with any other empty value)
         }
      }
   }
   return newObj;
}