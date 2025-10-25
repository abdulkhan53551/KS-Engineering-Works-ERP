import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Row, Col, Image, Table, Button, Form, Tab, Modal, Offcanvas, InputGroup, FormControl, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaUser, FaPen, FaTrash, FaSort, FaSortAlphaDownAlt, FaSortAlphaUpAlt } from 'react-icons/fa';
import PaginationControl from '../../../components/Pagination';
import { FaSearchengin } from 'react-icons/fa';
import useKsSearchParam from '../../../hooks/useSearchParam';
import PageLoader from '../../../components/PageLoader';
import { useDeleteFirm, useDeleteInvoiceChallan, useGetFirms, useGetFirmsPagination, useGetInvoiceChallan, useGetInvoiceChallanPagination } from '../hooks/useApi';
import PaginationBar from '../../../components/PaginationBar';

const pageSize = 10;

const InvoiceChallan = () => {
   const [page, setPage] = useState(1)
   const [tableData, setTableData] = useState([])
   const [filterData, setFilterData] = useState([])
   const [deleteModal, setDeleteModal] = useState({ id: 0, name: '', show: false });

   const { data: invoiceChallan = [] } = useGetInvoiceChallan({ page, pageSize });
   const { data: pagination = {} } = useGetInvoiceChallanPagination({ page, pageSize });
   const { mutate: deleteInvoiceChallan, isPending: deleteInvoiceChallanIsPending, isSuccess: isDeletedSuccessfully } = useDeleteInvoiceChallan();
   const { pageStart, pageEnd, total: totalItems } = pagination;

   useEffect(() => {
      if (isDeletedSuccessfully) {
         handleDeleteModalOnClose()
      }
   }, [isDeletedSuccessfully])

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

   const handleDeleteModalOnClose = useCallback(() => setDeleteModal(prev => ({ ...prev, id: 0, name: '', show: false })), [deleteModal]);
   const handleDeleteModalOnShow = (id, title) => setDeleteModal(prev => ({ ...prev, id: id, name: title, show: true }));
   const handleDeleteModalOnConfirm = useCallback((id = 0) => {
      if (id > 0. && !deleteInvoiceChallanIsPending) {
         // Do stuff delete confirmation received
         deleteInvoiceChallan(id);
         // handleDeleteModalOnClose()
         // setFilterData(prev => prev.filter(item => item.id != id))
      }

   }, [])

   return (
      <>
         <div>
            <Row>
               <Col sm="12">
                  <Card>
                     <Card.Header className="d-flex justify-content-between">
                        <div className="header-title d-flex">
                           <h4 className="card-title">Firm List</h4>
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

                           {/* <InputGroup className="search-input" style={{width:  '20rem', backgroundColor: 'red'}}>
                              <InputGroup.Text id="search-input">
                                 <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                                    <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                 </svg>
                              </InputGroup.Text>
                              <FormControl type="search" placeholder="Search..." aria-label="Search" aria-describedby="search-input" />
                           </InputGroup> */}
                        </Col>
                        <div className="table-responsive">
                           <Table className='table-sortable ms-1 me-1' striped bordered hover responsive>
                              <thead>
                                 <tr className="light">
                                    <th>#ID</th>
                                    <th>Customer Name</th>
                                    <th>Challan No.</th>
                                    <th>Challan Date</th>
                                    <th>Is Invoiced</th>
                                    <th>Added By</th>
                                    <th>Last Modified</th>
                                    <th min-width="100px">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {
                                    invoiceChallan.map((item, idx) => (
                                       <tr key={idx} id='example-collapse-text'>
                                          <td className="text-center">{item.challanId}</td>
                                          <td>{item.customerName}</td>
                                          <td>{item.challanNo}</td>
                                          <td>{new Date(item.challanDate).toLocaleDateString('en-GB')}</td>
                                          <td><span className={`badge ${item.color}`}>{item.invoiceStatus}</span></td>
                                          <td>{item.createdBy}</td>
                                          <td>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</td>
                                          <td>
                                             <div className="flex align-items-center list-user-action">
                                                <Link className="me-2" to={`/sales/challans/${item.challanId}/edit`}>
                                                   <Button variant="outline-success" size='sm'>
                                                      <FaPen />
                                                   </Button>
                                                </Link>
                                                <Button
                                                   variant="outline-danger"
                                                   size='sm'
                                                   onClick={() => handleDeleteModalOnShow(item.challanId, item.customerName)}
                                                   aria-controls="example-collapse-text"
                                                   aria-expanded={item.challanId}
                                                >
                                                   <FaTrash />
                                                </Button>
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                              </tbody>
                           </Table>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: '1rem', marginRight: '1rem' }}>
                           <div style={{}}>
                              Showing {pageStart} to {pageEnd} of {totalItems} entries
                           </div>
                           {/* <PaginationControl
                              page={page}
                              between={3}
                              total={pagination.total}
                              limit={pagination.pageSize}
                              changePage={handleOnPageChange}
                              ellipsis={1}
                              next={pagination.hasNextPage}
                              last={pagination.hasPrevPage}
                           /> */}
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
         <KSModal
            id={deleteModal.id}
            show={deleteModal.show}
            isConfirmLoading={deleteInvoiceChallanIsPending}
            onConfirm={handleDeleteModalOnConfirm}
            onClose={handleDeleteModalOnClose}
            headerTitle={'Are you sure want to delete ?'}
            bodyTitle={deleteModal.name}
         />
      </>
   )

}

export default InvoiceChallan;

const KSModal = memo((props) => {
   const {
      id = 0,
      show = false,
      isConfirmLoading = false,
      onConfirm = Function(),
      onClose = Function(),
      headerTitle = 'Are you sure want to delete ?',
      bodyTitle = 'Woohoo, you are reading this text in a modal!'
   } = props

   const handleConfirm = () => onConfirm(id);
   const handleClose = () => onClose(false);

   return (
      <>
         <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
               <Modal.Title>{headerTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{bodyTitle}</Modal.Body>
            <Modal.Footer>
               <Button variant="primary" onClick={handleClose}>
                  Cancel
               </Button>
               <Button variant="danger" onClick={handleConfirm} disabled={isConfirmLoading}>
                  {isConfirmLoading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                  {isConfirmLoading ? 'Deleting..' : 'Delete'}
               </Button>
            </Modal.Footer>
         </Modal>
      </>
   );
})

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
      console.log('======= handle submit => ',);
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