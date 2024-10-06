import React, { useEffect, useState } from 'react'
import {Row,Col,Image,Form,Button, Spinner, Dropdown} from 'react-bootstrap'
import Card from '../../../components/Card'
import { requestMethod } from '../../../utilities/api/constants'
import { serverCall } from '../../../utilities/api'
import { useDispatch, useSelector } from 'react-redux'
import { successCustomerAdd } from './action'
import { testCustomerApi } from './dispatcher'
import DismissibleAlert from '../../../components/DismissableAlert'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ROUTES, Route, dashboard } from '../../../utilities/constant/route-constant'

const CustomerAdd =() =>{
   const dispatch = useDispatch();
   const customerAddData = useSelector(state => state.customer);
   const { id } = useParams();
   const [searchParam, setSearchParam] = useSearchParams()
   const navigate = useNavigate();

   const initForm = {
      firstName: '',
      lastName: '',
      city: '',
      email: '',
      file: ''
   }

   const initFormError = {
      firstName: 'Please enter a First Name.', 
      lastName: 'Please enter a Last Name',
      city: 'Please select city',
      email: '',
      invalidEmail: 'Email is invalid',
      file: '',
      fileTypeInvalid: 'Invalid file type. Only PNG and JPEG are allowed.'
   }

   const [formData, setFormData] = useState(initForm);
   const [formErrors, setFormErrors] = useState({});
   const [isFormSubmit, setIsFormSubmit] = useState(false);
   const [isEditMode, setIsEditMode] = useState(false);
   const [required, setRequired] = useState({email: false, file: false});
   
   const handleSubmit = (event) => {
      console.log('======= handle submit => ', );
      event.preventDefault();
      const form = event.currentTarget;
      
      // File type input does not contain any error
      if (!formErrors.file && form.checkValidity()) {
            setFormData(prev => emptyObject(prev))
            setFormErrors(prev => emptyObject(prev))
            setIsFormSubmit(true)

            setTimeout(() => {
               setIsFormSubmit(false)
               navigate(`/${ROUTES.CUSTOMER.CUSTOMER_EDIT}/4`)
            }, 3000);
      } else {
         event.stopPropagation();
         setFormErrors(validateForm(formData))
      }
   };

   useEffect(() => {
      console.log('id => ', id);
      if (id > 0) {
         setIsEditMode(true)
         testApiCall();
      }

      return () => setIsEditMode(false)
   }, [id])
   
   const testApiCall = async () => {
      console.log('Test API Call');
      dispatch(testCustomerApi());
   }

   const validateForm = (form) => {
      const updatedErrors = {};
      Object.entries(form).forEach(([key, value]) => {
         updatedErrors[key] = validateField(key, value)
      });

      return updatedErrors
   }

   const handleChange = (e) => {
      const { name, value } = e.target;
      let errorMsg = ''

      setFormData({ ...formData, [name]: value.trim() ? value : '' });
      errorMsg = validateField(name, value)
      setFormErrors({ ...formErrors, [name]: errorMsg });
      handleOnEmailChange(name, value)
   };

   const handleOnEmailChange = (fieldName, value) => {
      if (fieldName == 'email') {
         if (value.trim()) {
            setRequired(prev => ({...prev, email: true}))
         } else {
            setRequired(prev => ({...prev, email: false}))
         }
      }
   }

   const handleBlur = (e) => {
      const { name, value } = e.target;
      let errorMsg = ''
      errorMsg = validateField(name, value)
      setFormErrors({ ...formErrors, [name]: errorMsg });
   };

   // Validate form field
   const validateField = (fieldName = '', value = '') => {
      // Regular expression for basic email validation
      const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      let errorMsg = ''

      if (fieldName) {
         if (typeof value === 'string' && !value.trim()) {
            errorMsg = initFormError[fieldName]
         } else if (fieldName == 'email' &&  !emailPattern.test(value)) {
            errorMsg = initFormError.invalidEmail
         } else if (fieldName == 'file') {
            errorMsg = validateFile(formData.file)
         }
      }

      return errorMsg
   }
   
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

   const validateFile = (files) => {
      // Allowed file types (MIME types)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const file = files[0]; // Get the first selected file
      let errorMsg = ''

      if (file) {
         // Check if the file's type is in the allowed types
         if (!allowedTypes.includes(file.type)) {
            errorMsg = initFormError.fileTypeInvalid
         }
      } else {
         setRequired(prev => ({...prev, file: false}))
         errorMsg = initFormError.file
      }

      return errorMsg
   }

   // File change handler
   const handleFileChange = (e) => {
      setRequired(prev => ({...prev, file: true}))

      const files = e.target.files; // Get the first selected file
      let errorMsg = ''

      setFormData({ ...formData, file: files });
      errorMsg = validateFile(files)   // Validate file
      setFormErrors(prev => ({ ...prev, file: errorMsg }));
   };
   
  return(
      <>
        <div>
        <Form noValidate onSubmit={handleSubmit} >
            <Row>
               <Col xl="12" lg="12">
                  <Card>
                     <Card.Header className="d-flex justify-content-between">
                        <div className="header-title">
                           <h4 className="card-title">New User Information</h4>
                        </div>
                     </Card.Header>
                     <Card.Body>
                      <DismissibleAlert message="This alert will automatically dismiss after 3 seconds." />
                        <div className="new-user-info">
                              <div className="row">
                                 <pre>

                                 {JSON.stringify(formData, undefined, 2)}
                                 {JSON.stringify(formErrors, undefined, 2)}
                                 </pre>
                                 {/* <Form.Group className={"col-md-6 form-group"}>
                                    <Form.Label htmlFor="fname">First Name:</Form.Label>
                                    <Form.Control type="text" name='firstName'  id="fname" value={formData.firstName} onChange={handleChange} isInvalid={formErrors.firstName} placeholder="First Name" onBlur={handleBlur} required />
                                    <Form.Control.Feedback type="invalid">{formErrors.firstName}</Form.Control.Feedback>
                                 </Form.Group>
                                 <Form.Group className="col-md-6 form-group">
                                    <Form.Label htmlFor="lname">Last Name:</Form.Label>
                                    <Form.Control type="text" name='lastName' id="lname" value={formData.lastName} onChange={handleChange} isInvalid={formErrors.lastName} placeholder="Last Name" onBlur={handleBlur} required />
                                    <Form.Control.Feedback type="invalid">{formErrors.lastName}</Form.Control.Feedback>
                                 </Form.Group> */}
                                 {/* <Form.Group className="col-md-6 form-group">
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
                                 </Form.Group> */}
                                {/* <Form.Group className="col-md-4 form-group">
                                   <Form.Label>City:</Form.Label>
                                   <Form.Control as="select" name='city' id='city' value={formData.city} onChange={handleChange} isInvalid={formErrors.city} placeholder="City" onBlur={handleBlur}>
                                      <option value="">--Select--</option>
                                      <option value="option1">Option 1</option>
                                      <option value="option2">Option 2</option>
                                      <option value="option3">Option 3</option>
                                   </Form.Control>
                                   <Form.Control.Feedback type="invalid">{formErrors.city}</Form.Control.Feedback>
                                </Form.Group> */}
                                 {/* <Form.Group className="col-md-4 form-group">
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
                                 </Form.Group> */}
                                 {/* <Form.Group className="col-md-6  form-group">
                                    <Form.Label htmlFor="mobno">Mobile Number:</Form.Label>
                                    <Form.Control type="text"  id="mobno" placeholder="Mobile Number"/>
                                 </Form.Group>
                                 <Form.Group className="col-md-6  form-group">
                                    <Form.Label htmlFor="altconno">Alternate Contact:</Form.Label>
                                    <Form.Control type="text"  id="altconno" placeholder="Alternate Contact"/>
                                 </Form.Group> */}
                                 {/* <Form.Group className="col-md-6  form-group">
                                    <Form.Label htmlFor="email">Email:</Form.Label>
                                    <Form.Control type="email"  id="email" name='email' placeholder="Email" value={formData.email} onChange={handleChange} isInvalid={formErrors.email} onBlur={handleBlur} required={required.email} />
                                    <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                                 </Form.Group> */}
                                 <Form.Group className="form-group col-md-6">
                                    <Form.Group>
                                        <Form.Label  className="custom-file-input">Choose file</Form.Label>
                                        <Form.Control  type="file" id="file" name='file' onChange={handleFileChange} isInvalid={formErrors.file} required={required.file} />
                                        <Form.Control.Feedback type="invalid">{formErrors.file}</Form.Control.Feedback>
                                    </Form.Group>
                                </Form.Group>
                                 {/* <Form.Group className="col-md-6 form-group">
                                    <Form.Label htmlFor="pno">Pin Code:</Form.Label>
                                    <Form.Control type="text"  id="pno" placeholder="Pin Code"/>
                                 </Form.Group> */}
                              </div>
                             {isFormSubmit ? (
                                 <Button variant="primary" disabled>
                                       <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                       {' '}Adding...
                                 </Button>
                             ) : (
                                 <Button type="submit" variant="btn btn-primary">Add New User</Button>
                             )}
                        </div>
                     </Card.Body>
                  </Card>
               </Col>
            </Row>
        </Form>
         </div>
      </>
  )

}

export default CustomerAdd;