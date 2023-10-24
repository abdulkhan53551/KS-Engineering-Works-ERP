import React from 'react'
import {Row,Col,Image,Form,Button} from 'react-bootstrap'
import Card from '../../../components/Card'

const CustomerAdd =() =>{
  return(
      <>
        <div>
            <Row>
               <Col xl="12" lg="12">
                  <Card>
                     <Card.Header className="d-flex justify-content-between">
                        <div className="header-title">
                           <h4 className="card-title">New User Information</h4>
                        </div>
                     </Card.Header>
                     <Card.Body>
                        <div className="new-user-info">
                           <form>
                              <div className="row">
                                 <Form.Group className="col-md-6 form-group">
                                    <Form.Label htmlFor="fname">First Name:</Form.Label>
                                    <Form.Control type="text"  id="fname" placeholder="First Name"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-6 form-group">
                                    <Form.Label htmlFor="lname">Last Name:</Form.Label>
                                    <Form.Control type="text"  id="lname" placeholder="Last Name"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-6 form-group">
                                    <Form.Label htmlFor="add1">Street Address 1:</Form.Label>
                                    <Form.Control type="text"  id="add1" placeholder="Street Address 1"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-6 form-group">
                                    <Form.Label htmlFor="add2">Street Address 2:</Form.Label>
                                    <Form.Control type="text"  id="add2" placeholder="Street Address 2"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-12 form-group">
                                    <Form.Label htmlFor="cname">Company Name:</Form.Label>
                                    <Form.Control type="text"  id="cname" placeholder="Company Name"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-4 form-group">
                                    <Form.Label>City:</Form.Label>
                                    <select name="type" className="selectpicker form-control" data-style="py-0">
                                       <option>Select City</option>
                                       <option>Nashik</option>
                                       <option>Mumbai</option>
                                       <option >Pune</option>
                                    </select>
                                 </Form.Group>
                                 <Form.Group className="col-md-4 form-group">
                                    <Form.Label>State:</Form.Label>
                                    <select name="type" className="selectpicker form-control" data-style="py-0">
                                       <option>Select State</option>
                                       <option>Maharastra</option>
                                       <option>Banglore</option>
                                       <option >Punjab</option>
                                       <option>Gujrat</option>
                                    </select>
                                 </Form.Group>
                                 <Form.Group className="col-md-4 form-group">
                                    <Form.Label>Country:</Form.Label>
                                    <select name="type" className="selectpicker form-control" data-style="py-0">
                                       <option>Select Country</option>
                                       <option>Caneda</option>
                                       <option>Noida</option>
                                       <option >USA</option>
                                       <option>India</option>
                                       <option>Africa</option>
                                    </select>
                                 </Form.Group>
                                 <Form.Group className="col-md-6  form-group">
                                    <Form.Label htmlFor="mobno">Mobile Number:</Form.Label>
                                    <Form.Control type="text"  id="mobno" placeholder="Mobile Number"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-6  form-group">
                                    <Form.Label htmlFor="altconno">Alternate Contact:</Form.Label>
                                    <Form.Control type="text"  id="altconno" placeholder="Alternate Contact"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-6  form-group">
                                    <Form.Label htmlFor="email">Email:</Form.Label>
                                    <Form.Control type="email"  id="email" placeholder="Email"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-6 form-group">
                                    <Form.Label htmlFor="pno">Pin Code:</Form.Label>
                                    <Form.Control type="text"  id="pno" placeholder="Pin Code"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-12 form-group">
                                    <Form.Label htmlFor="city">Town/City:</Form.Label>
                                    <Form.Control type="text"  id="city" placeholder="Town/City"/>
                                 </Form.Group>
                              </div>
                              <Button type="button" variant="btn btn-primary">Add New User</Button>
                           </form>
                        </div>
                     </Card.Body>
                  </Card>
               </Col>
            </Row>
         </div>
      </>
  )

}

export default CustomerAdd;