import React, { memo, useCallback, useState } from 'react'
import { Row, Col, Table, Button, Form, Offcanvas } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaPen, FaTrash } from 'react-icons/fa';
import { FaSearchengin } from 'react-icons/fa';
import useKsSearchParam from '../../../hooks/useSearchParam';
import PageLoader from '../../../components/PageLoader';
import { useDeletePurchaseOrder, usePurchaseOrder, usePurchaseOrderPagination } from '../hooks/useApi';
import PaginationBar from '../../../components/PaginationBar';
import { useUIManager } from '../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../store/uiModal.slice';

const pageSize = 10;

const PurchaseOrderList = () => {
   const dispatch = useDispatch();
   const [page, setPage] = useState(1)
   const [tableData, setTableData] = useState([])
   const [filterData, setFilterData] = useState([])

   const { data: purchaseOrder = [] } = usePurchaseOrder({ page, pageSize });
   const { data: pagination = {} } = usePurchaseOrderPagination({ page, pageSize });
   const { mutate: deleteInvoiceChallan } = useDeletePurchaseOrder();
   const { pageStart, pageEnd, total: totalItems } = pagination;

   const onSearch = (e) => {
      const { name, value: searchTerm } = e.target;
      const keysToRemove = ['id', 'color'];

      // Function to filter data based on search term across all fields
      const filteredData = tableData?.filter((item) =>
         Object.values(
            // Remove keys/property from object
            Object.fromEntries(
               Object.entries(item).filter(([key]) => !keysToRemove.includes(key))
            )
            // Search OR Match data
         ).some((value) =>
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
         )
      ) ?? [];

      setFilterData(filteredData)
   }

   // Handle on page change
   const handleOnPageChange = useCallback(setPage, [page])

   const { showModal, showToast } = useUIManager();

   // Handle item delete
   const handleDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Confirm Delete",
         message: `Are you sure you want to delete "${name}"?`,
         confirmText: "Delete",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteInvoiceChallan({id});
         },
      });
   };

   return (
      <>
         <div>
            <Row>
               <Col sm="12">
                  <Card>
                     <Card.Header className="d-flex justify-content-between">
                        <div className="header-title d-flex">
                           <h4 className="card-title">Purchase Order List</h4>
                           <AdvanceSearch
                              name={'Enable body scrolling'}
                              scroll={true}
                              backdrop={false}
                              restoreFocus={false}
                           />
                        </div>
                     </Card.Header>
                     <Card.Body className="px-0">
                        <PageLoader loading={false} />
                        <Col className='d-flex justify-content-between align-items-center' style={{ height: '3rem', marginLeft: '1rem', marginRight: '1rem' }}>
                           <div className="col-md-4 d-flex align-items-center">
                              <Form.Label>Show</Form.Label>
                              <Form.Select className="form-select-sm" style={{ marginLeft: '0.5rem', marginRight: '0.5rem', width: '5.8rem' }} aria-label=".form-select-sm example">
                                 <option defaultValue="10">10</option>
                                 <option defaultValue="25">25</option>
                                 <option defaultValue="50">50</option>
                                 <option defaultValue="100">100</option>
                              </Form.Select>
                              <Form.Label>entries</Form.Label>
                           </div>
                           <Form.Floating className="custom-form-floating form-floating-sm mb-3">
                              <Form.Control type="text" className="" id="floatingInput1" autoComplete="username email" placeholder="name@example.com" onChange={onSearch} />
                              <Form.Label htmlFor="floatingInput">Search</Form.Label>
                           </Form.Floating>

                        </Col>
                        <div className="table-responsive">
                           <Table className='table-sortable ms-1 me-1' striped bordered hover responsive>
                              <thead>
                                 <tr className="light">
                                    <th>#ID</th>
                                    <th>PO Date</th>
                                    <th>Customer Name</th>
                                    <th>PO No.</th>
                                    <th>Is Invoiced</th>
                                    <th>Added By</th>
                                    <th>Last Modified</th>
                                    <th min-width="100px">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {purchaseOrder.length ? (
                                    purchaseOrder.map((item, idx) => (
                                       <tr key={idx} id='example-collapse-text'>
                                          <td className="text-center">{item.poId}</td>
                                          <td>{new Date(item.poDate).toLocaleDateString('en-GB')}</td>
                                          <td>{item.customerName}</td>
                                          <td>{item.poNo}</td>
                                          <td><span className={`badge ${item.color}`}>{item.invoiceStatus}</span></td>
                                          <td>{item.createdBy}</td>
                                          <td>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</td>
                                          <td>
                                             <div className="flex align-items-center list-user-action">
                                                <Link className="me-2" to={`/purchase/purchase-order/${item.poId}/edit`}>
                                                   <Button variant="outline-success" size='sm'>
                                                      <FaPen />
                                                   </Button>
                                                </Link>
                                                <Button
                                                   variant="outline-danger"
                                                   size='sm'
                                                   onClick={() => handleDelete(item.poId, item.customerName)}
                                                   aria-controls="example-collapse-text"
                                                   aria-expanded={item.poId}
                                                >
                                                   <FaTrash />
                                                </Button>
                                             </div>
                                          </td>
                                       </tr>
                                    ))
                                 ) : (
                                    <tr>
                                       <td colSpan={8} className="text-center text-muted">
                                          No records found
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
                              pageSize={pagination.pageSize}
                              total={pagination.total}
                              totalPages={pagination.totalPages}
                              onPageChange={handleOnPageChange}
                           />
                        </div>
                     </Card.Body>
                  </Card>
               </Col>
            </Row>
         </div>
      </>
   )

}

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