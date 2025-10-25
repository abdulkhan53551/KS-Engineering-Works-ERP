import React, { useCallback, useState } from 'react'
import { Row, Col, Table, Button, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Card from '../../../components/Card'
import { FaPen, FaTrash } from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import { useDeleteEwayBill, useEwayBill, useEwayBillPagination } from '../hooks/useApi';
import PaginationBar from '../../../components/PaginationBar';
import { useUIManager } from '../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../store/uiModal.slice';

const pageSize = 10;

const EwayBillList = () => {
   const dispatch = useDispatch();
   const [page, setPage] = useState(1)

   const { data: ewayBill = [] } = useEwayBill({ page, pageSize });
   const { data: pagination = {} } = useEwayBillPagination({ page, pageSize });
   const { mutate: deleteEwayBill } = useDeleteEwayBill();
   const { showModal, showToast } = useUIManager();
   const { pageStart, pageEnd, total: totalItems } = pagination;

   // Handle on page change
   const handleOnPageChange = useCallback(setPage, [page])

   // Handle item delete
   const handleDelete = (id, name) => {
      showModal("confirm", {
         show: true,
         title: "Confirm Delete",
         message: `Are you sure you want to delete "${name}"?`,
         confirmText: "Delete",
         onConfirm: async () => {
            dispatch(setModalLoading({ key: "delete", isLoading: true }));
            deleteEwayBill(id);
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
                           <h4 className="card-title">E-way Bill List</h4>
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

                        </Col>
                        <div className="table-responsive">
                           <Table className='table-sortable ms-1 me-1' striped bordered hover responsive>
                              <thead>
                                 <tr className="light">
                                    <th>#ID</th>
                                    <th>E-way Bill Date</th>
                                    <th>E-way Bill Validity</th>
                                    <th>Customer Name</th>
                                    <th>E-way Bill No.</th>
                                    <th>Is Invoiced</th>
                                    <th>Added By</th>
                                    <th>Last Modified</th>
                                    <th min-width="100px">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {ewayBill.length ? (
                                    ewayBill.map((item, idx) => (
                                       <tr key={idx} id='example-collapse-text'>
                                          <td className="text-center">{item.ewayBillId}</td>
                                          <td>{new Date(item.ewayBillDate).toLocaleDateString('en-GB')}</td>
                                          <td>{new Date(item.validUpto).toLocaleDateString('en-GB')}</td>
                                          <td>{item.customerName}</td>
                                          <td>{item.ewayBillNo}</td>
                                          <td><span className={`badge ${item.color}`}>{item.invoiceStatus}</span></td>
                                          <td>{item.createdBy}</td>
                                          <td>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</td>
                                          <td>
                                             <div className="flex align-items-center list-user-action">
                                                <Link className="me-2" to={`/sales/eway-bill/${item.ewayBillId}/edit`}>
                                                   <Button variant="outline-success" size='sm'>
                                                      <FaPen />
                                                   </Button>
                                                </Link>
                                                <Button
                                                   variant="outline-danger"
                                                   size='sm'
                                                   onClick={() => handleDelete(item.ewayBillId, item.customerName)}
                                                   aria-controls="example-collapse-text"
                                                   aria-expanded={item.ewayBillId}
                                                >
                                                   <FaTrash />
                                                </Button>
                                             </div>
                                          </td>
                                       </tr>
                                    ))
                                 ) : (
                                    <tr>
                                       <td colSpan={9} className="text-center text-muted">
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

export default EwayBillList;