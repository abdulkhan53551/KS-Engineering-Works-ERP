import React, { memo, useCallback, useEffect, useState } from 'react'
import { Row, Col, Image, Table, Button, Form, Tab, Modal, Offcanvas, InputGroup, FormControl } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaUser, FaPen, FaTrash, FaSort, FaSortAlphaDownAlt, FaSortAlphaUpAlt } from 'react-icons/fa';
import PaginationControl from '../../../components/Pagination';
import { FaSearchengin } from 'react-icons/fa';

// img
import shap1 from '../../../assets/images/shapes/01.png'
import shap2 from '../../../assets/images/shapes/02.png'
import shap3 from '../../../assets/images/shapes/03.png'
import shap4 from '../../../assets/images/shapes/04.png'
import shap5 from '../../../assets/images/shapes/05.png'
import shap6 from '../../../assets/images/shapes/06.png'
import { ROUTES } from '../../../utilities/constant/route-constant';
import useKsSearchParam from '../../../hooks/useSearchParam';
import PageLoader from '../../../components/PageLoader';

const customerList = [
   {
      id: 1,
      img: `${shap1}`,
      name: 'Anna Sthesia',
      phone: '(760) 756 7568',
      email: 'annasthesia@gmail.com',
      country: 'USA',
      status: 'Active',
      company: 'Acme Corporation',
      joindate: '2019/12/01',
      color: 'bg-primary'
   },
   {
      id: 2,
      img: `${shap2}`,
      name: 'Brock Lee',
      phone: '+62 5689 458 658',
      email: 'brocklee@gmail.com',
      country: 'Indonesia',
      status: 'Active',
      company: 'Soylent Corp',
      joindate: '2019/12/01',
      color: 'bg-primary'
   },
   {
      id: 3,
      img: `${shap3}`,
      name: 'Dan Druff',
      phone: '+55 6523 456 856',
      email: 'dandruff@gmail.com',
      country: 'Brazil',
      status: 'Pending',
      company: 'Acme Corporation',
      joindate: '2019/12/01',
      color: 'bg-warning'
   },
   {
      id: 4,
      img: `${shap4}`,
      name: 'Hans Olo',
      phone: '+91 2586 253 125',
      email: 'hansolo@gmail.com',
      country: 'India',
      status: 'Inactive',
      company: 'Vehement Capital',
      joindate: '2019/12/01',
      color: 'bg-danger'
   },
   {
      id: 5,
      img: `${shap5}`,
      name: 'Lynn Guini',
      phone: '+27 2563 456 589',
      email: 'lynnguini@gmail.com',
      country: 'Africa',
      status: 'Active',
      company: 'Massive Dynamic',
      joindate: '2019/12/01',
      color: 'bg-primary'
   },
   {
      id: 6,
      img: `${shap6}`,
      name: 'Eric Shun',
      phone: '+55 25685 256 589',
      email: 'ericshun@gmail.com',
      country: 'Brazil',
      status: 'Pending',
      company: 'Globex Corporation',
      joindate: '2019/12/01',
      color: 'bg-warning'
   },
   {
      id: 6,
      img: `${shap3}`,
      name: 'aaronottix',
      phone: '(760) 756 7568',
      email: 'budwiser@ymail.com',
      country: 'USA',
      status: 'Hold',
      company: 'Acme Corporation',
      joindate: '2019/12/01',
      color: 'bg-info'
   },
   {
      id: 7,
      img: `${shap5}`,
      name: 'Marge Arita',
      phone: '+27 5625 456 589',
      email: 'margearita@gmail.com',
      country: 'Africa',
      status: 'Complite',
      company: 'Vehement Capital',
      joindate: '2019/12/01',
      color: 'bg-success'
   },
   {
      id: 8,
      img: `${shap2}`,
      name: 'Bill Dabear',
      phone: '+55 2563 456 589',
      email: 'billdabear@gmail.com',
      country: 'Brazil',
      status: 'Active',
      company: 'Massive Dynamic',
      joindate: '2019/12/01',
      color: 'bg-primary'
   }
]

const CustomerList = () => {
   const [active, setActive] = useState(1)
   const [tableData, setTableData] = useState([])
   const [filterData, setFilterData] = useState([])
   const [deleteModal, setDeleteModal] = useState({id: 0, name: '', show: false});
   const [searchParam, setSearchParam] = useSearchParams()

   useEffect(() => {
      setTableData(customerList)
      setFilterData(customerList)
   }, [])

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
   const handleOnPageChange = useCallback(setActive, [active])

   const handleDeleteModalOnClose = useCallback(() => setDeleteModal(prev => ({...prev, id: 0, name: '', show: false})), [deleteModal]);
   const handleDeleteModalOnShow = (id, title) => setDeleteModal(prev => ({...prev, id: id, name: title, show: true}));
   const handleDeleteModalOnConfirm = useCallback((id = 0) => {
      if (id > 0) {
         // Do stuff delete confirmation received
         handleDeleteModalOnClose()
         setFilterData(prev => prev.filter(item => item.id != id))
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
                           <h4 className="card-title">User List</h4>
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
                           <Form.Floating className="form-floating-sm mb-3">
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
                                    <th onClick={() => handleSort('Profiles')}>
                                       Profiles {renderSortIcon('Profiles')}
                                    </th>
                                    <th onClick={() => handleSort('Name')}>
                                       Name {renderSortIcon('Name')}
                                    </th>
                                    <th onClick={() => handleSort('Contact')}>
                                       Contact {renderSortIcon('Contact')}
                                    </th>
                                    <th onClick={() => handleSort('Email')}>
                                       Email {renderSortIcon('Email')}
                                    </th>
                                    <th onClick={() => handleSort('Country')}>
                                       Country {renderSortIcon('Country')}
                                    </th>
                                    <th onClick={() => handleSort('Status')}>
                                       Status {renderSortIcon('Status')}
                                    </th>
                                    <th onClick={() => handleSort('Company')}>
                                       Company {renderSortIcon('Company')}
                                    </th>
                                    <th onClick={() => handleSort('Join Date')}>
                                       Join Date {renderSortIcon('Join Date')}
                                    </th>
                                    <th min-width="100px">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {
                                    filterData.map((item, idx) => (
                                       <tr key={idx} id='example-collapse-text'>
                                          <td className="text-center">{item.id}</td>
                                          <td className="text-center">
                                             {/* <Image className="bg-soft-primary rounded img-fluid avatar-40" src={item.img} alt="profile" /> */}
                                             <Image className="bg-soft-primary rounded img-fluid avatar-40" src={`https://i.pravatar.cc/50?img=${idx + 1}`} alt="profile" />
                                          </td>
                                          <td>{item.name}</td>
                                          <td>{item.phone}</td>
                                          <td>{item.email}</td>
                                          <td>{item.country}</td>
                                          <td><span className={`badge ${item.color}`}>{item.status}</span></td>
                                          <td>{item.company}</td>
                                          <td>{item.joindate}</td>
                                          <td>
                                             <div className="flex align-items-center list-user-action">
                                                {/* <Link className="btn btn-sm btn-icon btn-success" data-toggle="tooltip" data-placement="top" title="Add" data-original-title="Add" to="#">
                                                   <span className="btn-inner">
                                                      <svg width="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
                                                         <path fillRule="evenodd" clipRule="evenodd" d="M9.87651 15.2063C6.03251 15.2063 2.74951 15.7873 2.74951 18.1153C2.74951 20.4433 6.01251 21.0453 9.87651 21.0453C13.7215 21.0453 17.0035 20.4633 17.0035 18.1363C17.0035 15.8093 13.7415 15.2063 9.87651 15.2063Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                         <path fillRule="evenodd" clipRule="evenodd" d="M9.8766 11.886C12.3996 11.886 14.4446 9.841 14.4446 7.318C14.4446 4.795 12.3996 2.75 9.8766 2.75C7.3546 2.75 5.3096 4.795 5.3096 7.318C5.3006 9.832 7.3306 11.877 9.8456 11.886H9.8766Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                         <path d="M19.2036 8.66919V12.6792" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                         <path d="M21.2497 10.6741H17.1597" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                      </svg>
                                                   </span>
                                                </Link>{' '} */}
                                                {/* <Link className="btn btn-sm btn-icon btn-warning" data-toggle="tooltip" data-placement="top" title="Edit" data-original-title="Edit" to="#">
                                                   <span className="btn-inner">
                                                      <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <path d="M11.4925 2.78906H7.75349C4.67849 2.78906 2.75049 4.96606 2.75049 8.04806V16.3621C2.75049 19.4441 4.66949 21.6211 7.75349 21.6211H16.5775C19.6625 21.6211 21.5815 19.4441 21.5815 16.3621V12.3341" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                         <path fillRule="evenodd" clipRule="evenodd" d="M8.82812 10.921L16.3011 3.44799C17.2321 2.51799 18.7411 2.51799 19.6721 3.44799L20.8891 4.66499C21.8201 5.59599 21.8201 7.10599 20.8891 8.03599L13.3801 15.545C12.9731 15.952 12.4211 16.181 11.8451 16.181H8.09912L8.19312 12.401C8.20712 11.845 8.43412 11.315 8.82812 10.921Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                         <path d="M15.1655 4.60254L19.7315 9.16854" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                      </svg>
                                                   </span>
                                                </Link>{' '}
                                                <Link className="btn btn-sm btn-icon btn-danger" data-toggle="tooltip" data-placement="top" title="Delete" data-original-title="Delete" to="#">
                                                   <span className="btn-inner">
                                                      <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                                                         <path d="M19.3248 9.46826C19.3248 9.46826 18.7818 16.2033 18.4668 19.0403C18.3168 20.3953 17.4798 21.1893 16.1088 21.2143C13.4998 21.2613 10.8878 21.2643 8.27979 21.2093C6.96079 21.1823 6.13779 20.3783 5.99079 19.0473C5.67379 16.1853 5.13379 9.46826 5.13379 9.46826" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                         <path d="M20.708 6.23975H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                         <path d="M17.4406 6.23973C16.6556 6.23973 15.9796 5.68473 15.8256 4.91573L15.5826 3.69973C15.4326 3.13873 14.9246 2.75073 14.3456 2.75073H10.1126C9.53358 2.75073 9.02558 3.13873 8.87558 3.69973L8.63258 4.91573C8.47858 5.68473 7.80258 6.23973 7.01758 6.23973" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                      </svg>
                                                   </span>
                                                </Link>{' '} */}

                                                <Link className="me-2" to={`/${ROUTES.CUSTOMER.CUSTOMER_EDIT}/${item.id}`}>
                                                   <Button variant="outline-warning" size='sm'>
                                                      <FaPen />
                                                   </Button>
                                                </Link>
                                                <Button 
                                                   variant="outline-danger" 
                                                   size='sm' 
                                                   onClick={() => handleDeleteModalOnShow(item.id, item.name)}
                                                   aria-controls="example-collapse-text"
                                                   aria-expanded={item.id}
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
                     <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: '1rem', marginRight: '1rem'}}>
                        <div style={{}}>
                           Showing 1 to 9 of 9 entries
                        </div>
                        <PaginationControl
                           page={active}
                           between={3}
                           total={80}
                           limit={2}
                           changePage={handleOnPageChange}
                           ellipsis={1}
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
            onConfirm={handleDeleteModalOnConfirm}
            onClose={handleDeleteModalOnClose}
            headerTitle={'Are you sure want to delete ?'}
            bodyTitle={deleteModal.name}
         />
      </>
   )

}

export default CustomerList;

const KSModal = memo((props) => {
   const {
      id = 0,
      show = false, 
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
           <Button variant="danger" onClick={handleConfirm}>
             Delete
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
   const {urlSearchParams} = useKsSearchParam()
   const [searchParam, setSearchParam] = useSearchParams()
   const [show, setShow] = useState(false);
   const [formData, setFormData] = useState({...initForm, ...urlSearchParams});
 
   const handleClose = () => setShow(false);
   const toggleShow = () => setShow((s) => !s);
   const onReset = () => setFormData(initForm)
   const onClear = () => {
      setFormData(initForm)
      setSearchParam({})
      setShow(false)
   }

   const handleOnSearch = (event) => {
      console.log('======= handle submit => ', );
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