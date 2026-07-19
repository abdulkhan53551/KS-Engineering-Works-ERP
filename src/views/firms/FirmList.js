import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Row, Col, Image, Table, Button, Form, Tab, Modal, Offcanvas, InputGroup, FormControl, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../components/Card'
import { FaUser, FaPen, FaTrash, FaSort, FaSortAlphaDownAlt, FaSortAlphaUpAlt } from 'react-icons/fa';
import PaginationControl from '../../components/Pagination';
import { FaSearchengin } from 'react-icons/fa';

// img
// import shap1 from '../../../assets/images/shapes/01.png'
import shap1 from '../../assets/images/shapes/01.png'
import shap2 from '../../assets/images/shapes/02.png'
import shap3 from '../../assets/images/shapes/03.png'
import shap4 from '../../assets/images/shapes/04.png'
import shap5 from '../../assets/images/shapes/05.png'
import shap6 from '../../assets/images/shapes/06.png'
import { ROUTES } from '../../utilities/constant/route-constant';
import useKsSearchParam from '../../hooks/useSearchParam';
import PageLoader from '../../components/PageLoader';
import { useDeleteFirm, useGetFirms, useGetFirmsPagination } from './hooks/api.hooks';
import PaginationBar from '../../components/PaginationBar';

// const customerList = [
//    {
//       id: 1,
//       img: `${shap1}`,
//       name: 'Anna Sthesia',
//       phone: '(760) 756 7568',
//       email: 'annasthesia@gmail.com',
//       country: 'USA',
//       status: 'Active',
//       company: 'Acme Corporation',
//       joindate: '2019/12/01',
//       color: 'bg-primary'
//    },
//    {
//       id: 2,
//       img: `${shap2}`,
//       name: 'Brock Lee',
//       phone: '+62 5689 458 658',
//       email: 'brocklee@gmail.com',
//       country: 'Indonesia',
//       status: 'Active',
//       company: 'Soylent Corp',
//       joindate: '2019/12/01',
//       color: 'bg-primary'
//    },
//    {
//       id: 3,
//       img: `${shap3}`,
//       name: 'Dan Druff',
//       phone: '+55 6523 456 856',
//       email: 'dandruff@gmail.com',
//       country: 'Brazil',
//       status: 'Pending',
//       company: 'Acme Corporation',
//       joindate: '2019/12/01',
//       color: 'bg-warning'
//    },
//    {
//       id: 4,
//       img: `${shap4}`,
//       name: 'Hans Olo',
//       phone: '+91 2586 253 125',
//       email: 'hansolo@gmail.com',
//       country: 'India',
//       status: 'Inactive',
//       company: 'Vehement Capital',
//       joindate: '2019/12/01',
//       color: 'bg-danger'
//    },
//    {
//       id: 5,
//       img: `${shap5}`,
//       name: 'Lynn Guini',
//       phone: '+27 2563 456 589',
//       email: 'lynnguini@gmail.com',
//       country: 'Africa',
//       status: 'Active',
//       company: 'Massive Dynamic',
//       joindate: '2019/12/01',
//       color: 'bg-primary'
//    },
//    {
//       id: 6,
//       img: `${shap6}`,
//       name: 'Eric Shun',
//       phone: '+55 25685 256 589',
//       email: 'ericshun@gmail.com',
//       country: 'Brazil',
//       status: 'Pending',
//       company: 'Globex Corporation',
//       joindate: '2019/12/01',
//       color: 'bg-warning'
//    },
//    {
//       id: 6,
//       img: `${shap3}`,
//       name: 'aaronottix',
//       phone: '(760) 756 7568',
//       email: 'budwiser@ymail.com',
//       country: 'USA',
//       status: 'Hold',
//       company: 'Acme Corporation',
//       joindate: '2019/12/01',
//       color: 'bg-info'
//    },
//    {
//       id: 7,
//       img: `${shap5}`,
//       name: 'Marge Arita',
//       phone: '+27 5625 456 589',
//       email: 'margearita@gmail.com',
//       country: 'Africa',
//       status: 'Complite',
//       company: 'Vehement Capital',
//       joindate: '2019/12/01',
//       color: 'bg-success'
//    },
//    {
//       id: 8,
//       img: `${shap2}`,
//       name: 'Bill Dabear',
//       phone: '+55 2563 456 589',
//       email: 'billdabear@gmail.com',
//       country: 'Brazil',
//       status: 'Active',
//       company: 'Massive Dynamic',
//       joindate: '2019/12/01',
//       color: 'bg-primary'
//    }
// ]

const pageSize = 10;

const FirmList = () => {
   const [page, setPage] = useState(1)
   const [tableData, setTableData] = useState([])
   const [filterData, setFilterData] = useState([])
   const [deleteModal, setDeleteModal] = useState({ id: 0, name: '', show: false });
   const [searchParam, setSearchParam] = useSearchParams()
   //    const start = (meta.page - 1) * meta.pageSize + 1;
   // const end = Math.min(meta.page * meta.pageSize, meta.total);

   const { data: firms = [], isFetching: isFetchingFirms } = useGetFirms({ page, pageSize });
   const { data: pagination = {}, isFetching: isFetchingPagination } = useGetFirmsPagination({ page, pageSize });
   const { mutate: deleteFirm, isPending: deleteFirmIsPending, isSuccess: isDeletedSuccessfully } = useDeleteFirm();
   const { pageStart, pageEnd, total: totalItems } = pagination;

   // useEffect(() => {
   //    setTableData(customerList)
   //    setFilterData(customerList)
   // }, [])

   useEffect(() => {
      if (isDeletedSuccessfully) {
         handleDeleteModalOnClose()
      }
   }, [isDeletedSuccessfully])

   const [sortOrder, setSortOrder] = useState({
      column: '',
      order: 'asc',
   });

   const handleSort = (column) => {
      const order = sortOrder.column === column && sortOrder.order === 'asc' ? 'desc' : 'asc';
      setSortOrder({ column, order });
      // You can implement sorting logic here based on column and order
   };

   const renderSortIcon = (column) => {
      if (sortOrder.column === column) {
         return sortOrder.order === 'asc' ? <FaSortAlphaUpAlt /> : <FaSortAlphaDownAlt />;
      }
      return <FaSort style={{ opacity: 0.2 }} />;
   };

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
      if (id > 0. && !deleteFirmIsPending) {
         // Do stuff delete confirmation received
         deleteFirm(id);
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
                                    <th onClick={() => handleSort('Logo')}>
                                       Logo {renderSortIcon('Logo')}
                                    </th>
                                    <th onClick={() => handleSort('Firm')}>
                                       Firm {renderSortIcon('Firm')}
                                    </th>
                                    <th onClick={() => handleSort('Trade')}>
                                       Trade {renderSortIcon('Trade')}
                                    </th>
                                    <th onClick={() => handleSort('Type')}>
                                       Type {renderSortIcon('Type')}
                                    </th>
                                    <th onClick={() => handleSort('GSTIN')}>
                                       GSTIN {renderSortIcon('GSTIN')}
                                    </th>
                                    <th onClick={() => handleSort('Phone')}>
                                       Phone {renderSortIcon('Phone')}
                                    </th>
                                    <th onClick={() => handleSort('City')}>
                                       City {renderSortIcon('City')}
                                    </th>
                                    <th onClick={() => handleSort('State')}>
                                       State {renderSortIcon('State')}
                                    </th>
                                    <th onClick={() => handleSort('Added By')}>
                                       Added By {renderSortIcon('Added By')}
                                    </th>
                                    <th onClick={() => handleSort('Last Modified')}>
                                       Last Modified {renderSortIcon('Last Modified')}
                                    </th>
                                    <th min-width="100px">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {
                                    firms.map((item, idx) => (
                                       <tr key={idx} id='example-collapse-text'>
                                          <td className="text-center">{item.firmId}</td>
                                          <td className="text-center">
                                             {/* <Image className="bg-soft-primary rounded img-fluid avatar-40" src={item.img} alt="profile" /> */}
                                             <Image className="bg-soft-primary rounded img-fluid avatar-40" src={item.logoUrl} alt="profile" />
                                          </td>
                                          <td>{item.firmName}</td>
                                          <td>{item.tradeName}</td>
                                          <td>{item.firmType}</td>
                                          <td>{item.gstin}</td>
                                          <td>{item.phoneNumber}</td>
                                          {/* <td><span className={`badge ${item.color}`}>{item.status}</span></td> */}
                                          <td>{item.city}</td>
                                          <td>{item.state}</td>
                                          <td>{item.createdBy}</td>
                                          <td>{item.updatedAt}</td>
                                          <td>
                                             <div className="flex align-items-center list-user-action">
                                                <Link className="me-2" to={`/firms/${item.firmId}/edit`}>
                                                   <Button variant="outline-success" size='sm'>
                                                      <FaPen />
                                                   </Button>
                                                </Link>
                                                <Button
                                                   variant="outline-danger"
                                                   size='sm'
                                                   onClick={() => handleDeleteModalOnShow(item.firmId, item.firmName)}
                                                   aria-controls="example-collapse-text"
                                                   aria-expanded={item.firmId}
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
            isConfirmLoading={deleteFirmIsPending}
            onConfirm={handleDeleteModalOnConfirm}
            onClose={handleDeleteModalOnClose}
            headerTitle={'Are you sure want to delete ?'}
            bodyTitle={deleteModal.name}
         />
      </>
   )

}

export default FirmList;

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