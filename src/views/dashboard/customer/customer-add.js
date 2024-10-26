import React, { useEffect, useMemo, useState } from 'react'
import {Row,Col,Image,Form,Button, Spinner, Dropdown, Card} from 'react-bootstrap'
// import Card from '../../../components/Card'
import { requestMethod } from '../../../utilities/api/constants'
import { serverCall } from '../../../utilities/api'
import { useDispatch, useSelector } from 'react-redux'
import { successCustomerAdd } from './action'
import { testCustomerApi } from './dispatcher'
import DismissibleAlert from '../../../components/DismissableAlert'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ROUTES, Route, dashboard } from '../../../utilities/constant/route-constant'
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import './../../../assets/custom/css/module.css'
import { DEFAULT_PROFILE } from '../../../utilities/constant/constants'

const states = [
   { "id": 1, "name": "Andhra Pradesh" },
   { "id": 2, "name": "Arunachal Pradesh" },
   { "id": 3, "name": "Assam" },
   { "id": 4, "name": "Bihar" },
   { "id": 5, "name": "Chhattisgarh" },
   { "id": 6, "name": "Goa" },
   { "id": 7, "name": "Gujarat" },
   { "id": 8, "name": "Haryana" },
   { "id": 9, "name": "Himachal Pradesh" },
   { "id": 10, "name": "Jharkhand" },
   { "id": 11, "name": "Karnataka" },
   { "id": 12, "name": "Kerala" },
   { "id": 13, "name": "Madhya Pradesh" },
   { "id": 14, "name": "Maharashtra" },
   { "id": 15, "name": "Manipur" },
   { "id": 16, "name": "Meghalaya" },
   { "id": 17, "name": "Mizoram" },
   { "id": 18, "name": "Nagaland" },
   { "id": 19, "name": "Odisha" },
   { "id": 20, "name": "Punjab" },
   { "id": 21, "name": "Rajasthan" },
   { "id": 22, "name": "Sikkim" },
   { "id": 23, "name": "Tamil Nadu" },
   { "id": 24, "name": "Telangana" },
   { "id": 25, "name": "Tripura" },
   { "id": 26, "name": "Uttar Pradesh" },
   { "id": 27, "name": "Uttarakhand" },
   { "id": 28, "name": "West Bengal" },
   { "id": 29, "name": "Andaman and Nicobar Islands" },
   { "id": 30, "name": "Chandigarh" },
   { "id": 31, "name": "Dadra and Nagar Haveli and Daman and Diu" },
   { "id": 32, "name": "Lakshadweep" },
   { "id": 33, "name": "Delhi" },
   { "id": 34, "name": "Puducherry" },
   { "id": 35, "name": "Ladakh" },
   { "id": 36, "name": "Jammu and Kashmir" }
] 
const cities = [
   { "id": 1, "name": "Mumbai" },
   { "id": 2, "name": "Pune" },
   { "id": 3, "name": "Nagpur" },
   { "id": 4, "name": "Nashik" },
   { "id": 5, "name": "Thane" },
   { "id": 6, "name": "Aurangabad" },
   { "id": 7, "name": "Solapur" },
   { "id": 8, "name": "Amravati" },
   { "id": 9, "name": "Kolhapur" },
   { "id": 10, "name": "Sangli" },
   { "id": 11, "name": "Jalgaon" },
   { "id": 12, "name": "Akola" },
   { "id": 13, "name": "Latur" },
   { "id": 14, "name": "Nanded" },
   { "id": 15, "name": "Ahmednagar" },
   { "id": 16, "name": "Chandrapur" },
   { "id": 17, "name": "Parbhani" },
   { "id": 18, "name": "Satara" },
   { "id": 19, "name": "Beed" },
   { "id": 20, "name": "Malegaon" },
   { "id": 21, "name": "Bhiwandi" },
   { "id": 22, "name": "Dhule" },
   { "id": 23, "name": "Miraj" },
   { "id": 24, "name": "Ulhasnagar" },
   { "id": 25, "name": "Bhusawal" },
   { "id": 26, "name": "Ratnagiri" },
   { "id": 27, "name": "Gondia" },
   { "id": 28, "name": "Wardha" },
   { "id": 29, "name": "Yavatmal" },
   { "id": 30, "name": "Panvel" },
   { "id": 31, "name": "Baramati" },
   { "id": 32, "name": "Palghar" }
 ] 

const CustomerAdd =() =>{
   const dispatch = useDispatch();
   const customerAddData = useSelector(state => state.customer);
   const { id } = useParams();
   const [searchParam, setSearchParam] = useSearchParams()
   const navigate = useNavigate();

   const initForm = {
      isCustomerTypeBusiness: false,
      profileLogo: '',
      customerName: '',
      businessName: '',
      billingAddress: '',
      shippingAddress: '',
      isGSTRegistered: false,
      gstNo: '',
      state: '',
      city: '',
      pinCode: '',
      paymentTerms: 0,
      mobileNo: '',
      email: ''
   }

   const initFormRequired = useMemo(() => Object.keys(initForm).reduce((acc, key) => ({ ...acc, [key]: false }), {}), [])
      
   const initFormError = {
      profileLogo: '',
      profileLogoInvalid: 'Invalid file type. Only PNG and JPEG are allowed.',
      customerName: 'Please enter customer name',
      businessName: 'Please enter business name',
      billingAddress: 'Please enter billing address',
      shippingAddress: 'Please enter shipping address',
      gstNoInvalid: 'GST is invalid',
      gstNo: 'Please enter GST no.',
      state: 'Please select state',
      city: 'Please select city',
      pinCode: 'Please enter pin code',
      pinCodeInvalid: 'Please enter 6 digit pin code',
      paymentTerms: 'Please enter payment term',
      mobileNo: 'Please enter mobile no.',
      mobileNoInvalid: 'Please enter 10 digit mobile number',
      email: '',
      emailInvalid: 'Email is invalid'
   }
   
   const [formData, setFormData] = useState(initForm);
   const [formErrors, setFormErrors] = useState({});
   const [isFormSubmit, setIsFormSubmit] = useState(false);
   const [isEditMode, setIsEditMode] = useState(false);
   const [required, setRequired] = useState({ ...initFormRequired, customerName: !initForm.isCustomerTypeBusiness, businessName: initForm.isCustomerTypeBusiness, billingAddress: true, shippingAddress: true, state: true, city: true, pinCode: true, paymentTerms: true, mobileNo: true });

   // Set validation for customer name OR business name
   useEffect(() => {
      let updatedErrors = {
         customerName: required.customerName ? validateField('customerName', formData.customerName) : '',
         businessName: required.businessName ? validateField('businessName', formData.businessName) : ''
      }

      setFormErrors(prev => ({ ...prev, ...updatedErrors }));
   }, [required.customerName, required.businessName])

   // Set validation for gst number
   useEffect(() => {
      setFormErrors(prev => ({ ...prev, gstNo: required.gstNo ? validateField('gstNo', formData.gstNo) : '' }));
   }, [required.gstNo])
   
   const handleSubmit = (event) => {
      console.log('======= handle submit => ', );
      event.preventDefault();
      const form = event.currentTarget;
      
      // File type input does not contain any error
      if (!formErrors.profileLogo && form.checkValidity()) {
            setFormData(prev => emptyObject(prev))
            setFormErrors(prev => emptyObject(prev))
            setIsFormSubmit(true)

            setTimeout(() => {
               setIsFormSubmit(false)
               setIsEditMode(true)
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

         const formData = {
            isCustomerTypeBusiness: true,
            profileLogo: 'https://dummyimage.com/600x400/000/fff',
            customerName: '',
            businessName: 'K.S Engineering Works',
            billingAddress: 'FA-03, Plot 01, SSI Unit, Ambad, MIDC, Nashik',
            shippingAddress: 'FA-03, Plot 01, SSI Unit, Ambad, MIDC, Nashik',
            isGSTRegistered: true,
            gstNo: '27AQUPK5416E1ZM',
            state: 14,
            city: 4,
            pinCode: '422010',
            paymentTerms: 30,
            mobileNo: '9890241776',
            email: 'mdkadirkhan535@gmail.com'
         }

         setFormData(formData)
         setRequired(prev => ({
            ...prev, 
            customerName: !formData.isCustomerTypeBusiness, 
            businessName: formData.isCustomerTypeBusiness,
            gstNo: formData.isGSTRegistered
         }))
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
         updatedErrors[key] = required[key] ? validateField(key, value) : ''
      });

      return updatedErrors
   }

   const handleChange = (e) => {
      const { name, value } = e.target;
      let errorMsg = ''
      let fieldValue = value

      if (name == 'gstNo') fieldValue = fieldValue?.toUpperCase()
         
      setFormData({ ...formData, [name]: fieldValue.trim() ? fieldValue : '' });
      errorMsg = validateField(name, fieldValue)
      setFormErrors({ ...formErrors, [name]: errorMsg });
      handleOnEmailChange(name, fieldValue)
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
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
      let errorMsg = ''

      if (fieldName) {
         if (typeof value === 'string' && !value.trim()) {
            errorMsg = initFormError[fieldName]
         } else if (fieldName == 'email' &&  !emailPattern.test(value)) {
            errorMsg = initFormError.emailInvalid
         } else if (fieldName == 'profileLogo') {
            errorMsg = validateFile(formData.profileLogo)
         } else if (fieldName == 'gstNo' &&  !gstRegex.test(value)) {
            errorMsg = initFormError.gstNoInvalid
         } else if (fieldName == 'pinCode' && (isNaN(value) || value.length !== 6)) {
            errorMsg = initFormError.pinCodeInvalid
         } else if (fieldName == 'mobileNo' && (isNaN(value) || value.length !== 10)) {
            errorMsg = initFormError.mobileNoInvalid
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
            errorMsg = initFormError.profileLogoInvalid
         }
      } else {
         setRequired(prev => ({...prev, profileLogo: false}))
         errorMsg = initFormError.profileLogo
      }

      return errorMsg
   }

   // File change handler
   const handleFileChange = (e) => {
      setRequired(prev => ({...prev, profileLogo: true}))

      const files = e.target.files; // Get the first selected file
      let errorMsg = ''

      setFormData({ ...formData, profileLogo: files });
      errorMsg = validateFile(files)   // Validate file
      setFormErrors(prev => ({ ...prev, profileLogo: errorMsg }));
   };

   // Get customer type
   const customerType = (checked) => {
      const isCustomerTypeBusiness = checked
      let errorMsg = ''
      
      setFormData(prev => ({
         ...prev, 
         isCustomerTypeBusiness: isCustomerTypeBusiness,
         customerName: isCustomerTypeBusiness ? '' : prev?.customerName,
         businessName: isCustomerTypeBusiness ? prev?.businessName : ''
      }))
      setRequired(prev => ({
         ...prev, 
         customerName: !isCustomerTypeBusiness,
         businessName: isCustomerTypeBusiness
      }))
   }

   // Change GST resgistered
   const changeGSTRegistered = (checked) => {
      const isGSTRegistered = checked
      setFormData(prev => ({...prev, isGSTRegistered: isGSTRegistered, gstNo: isGSTRegistered ? prev?.gstNo : ''}))
      setRequired(prev => ({...prev, gstNo: isGSTRegistered}))
   }
   
  return(
      <>
        <div>
        <Form noValidate onSubmit={handleSubmit} >
            <Row>
               <Col xl="12" lg="12">
                  <Card>
                     <Card.Header className="d-flex justify-content-between">
                        <div className="header-title">
                           <h4 className="card-title">Add Customer</h4>
                        </div>
                     </Card.Header>
                     <Card.Body>
                      {/* <DismissibleAlert message="This alert will automatically dismiss after 3 seconds." /> */}
                        <div className="row">
                           {/* <pre>
                              {JSON.stringify(formData, undefined, 2)}
                              {JSON.stringify(formErrors, undefined, 2)}
                           </pre> */}
                           <Form.Group className={"form-group"}>
                              <Form.Label >Customer Type:</Form.Label>
                              <div>
                                 <BootstrapSwitchButton
                                    checked={formData.isCustomerTypeBusiness}
                                    width={200}
                                    height={40}
                                    onlabel='Business'
                                    onstyle='success'
                                    offlabel='Individual'
                                    offstyle='secondary'
                                    size='sm'
                                    onChange={customerType}
                                 />
                              </div>
                           </Form.Group>
                           <Form.Group className="form-group col-md-6">
                              <Form.Label className="custom-file-input">Business Logo</Form.Label>
                              {isEditMode && (
                              <Card style={{ width: 100 }}>
                                 <Card.Img
                                    variant="top"
                                    src={formData.profileLogo}
                                    alt="Profile"
                                    style={{ height: '100px' }}
                                    onError={(e) => {
                                       e.target.onerror = null;
                                       e.target.src = DEFAULT_PROFILE;
                                    }}
                                 />
                              </Card>
                              )}
                              <Form.Control type="file" id="profileLogo" name='profileLogo' onChange={handleFileChange} isInvalid={formErrors.profileLogo} required={required.profileLogo} />
                              <Form.Control.Feedback type="invalid">{formErrors.profileLogo}</Form.Control.Feedback>
                           </Form.Group>
                              {formData.isCustomerTypeBusiness ? (
                              <Form.Group className={`col-md-6 form-group ${required.businessName ? 'required' : ''}`}>
                                 <Form.Label htmlFor="businessName">Business Name:</Form.Label>
                                 <Form.Control type="text" name='businessName'  id="businessName" value={formData.businessName} onChange={handleChange} isInvalid={formErrors.businessName} placeholder="Business Name" onBlur={handleBlur} required={required.businessName} />
                                 <Form.Control.Feedback type="invalid">{formErrors.businessName}</Form.Control.Feedback>
                              </Form.Group>
                              ) : (
                              <Form.Group className={`col-md-6 form-group ${required.customerName ? 'required' : ''}`}>
                                 <Form.Label htmlFor="customerName">Customer Name:</Form.Label>
                                 <Form.Control className='' type="text" name='customerName'  id="customerName" value={formData.customerName} onChange={handleChange} isInvalid={formErrors.customerName} placeholder="Customer Name" onBlur={handleBlur} required={required.customerName} />
                                 <Form.Control.Feedback type="invalid">{formErrors.customerName}</Form.Control.Feedback>
                              </Form.Group>
                              )}
                           <Form.Group className="col-md-6 form-group required">
                              <Form.Label htmlFor="billingAddress">Billing Address:</Form.Label>
                              <Form.Control as="textarea" rows={3} name='billingAddress' id="billingAddress" value={formData.billingAddress} onChange={handleChange} isInvalid={formErrors.billingAddress} placeholder="Billing Address" onBlur={handleBlur} required />
                              <Form.Control.Feedback type="invalid">{formErrors.billingAddress}</Form.Control.Feedback>
                           </Form.Group>
                           <Form.Group className="col-md-6 form-group required">
                              <Form.Label htmlFor="shippingAddress">Shipping Address:</Form.Label>
                              <Form.Control as="textarea" rows={3} name='shippingAddress' id="shippingAddress" value={formData.shippingAddress} onChange={handleChange} isInvalid={formErrors.shippingAddress} placeholder="Shipping Address" onBlur={handleBlur} required />
                              <Form.Control.Feedback type="invalid">{formErrors.shippingAddress}</Form.Control.Feedback>
                           </Form.Group>
                           <Form.Group className={"form-group col-md-6"}>
                              <Form.Label >GST Registered:</Form.Label>
                              <div>
                                 <BootstrapSwitchButton
                                    checked={formData.isGSTRegistered}
                                    width={80}
                                    height={40}
                                    onlabel='Yes'
                                    onstyle='success'
                                    offlabel='No'
                                    offstyle='danger'
                                    // style='w-100'
                                    size='sm'
                                    onChange={changeGSTRegistered}
                                 />
                              </div>
                           </Form.Group>
                           {formData.isGSTRegistered && (
                              <Form.Group className={`col-md-6 form-group ${required.gstNo ? 'required' : ''}`}>
                                 <Form.Label htmlFor="gstNo">GST No.:</Form.Label>
                                 <Form.Control type="text" name='gstNo'  id="gstNo" value={formData.gstNo} onChange={handleChange} isInvalid={formErrors.gstNo} placeholder="GST No." onBlur={handleBlur} required={required.gstNo} />
                                 <Form.Control.Feedback type="invalid">{formErrors.gstNo}</Form.Control.Feedback>
                              </Form.Group>
                           )}
                           <Form.Group className="col-md-4 form-group required">
                              <Form.Label>State:</Form.Label>
                              <Form.Control as="select" name='state' id='state' value={formData.state} onChange={handleChange} isInvalid={formErrors.state} placeholder="State" onBlur={handleBlur} required>
                                 <option value="">--Select--</option>
                                 {states.map(item => (<option value={item.id}>{item.name}</option>))}
                              </Form.Control>
                              <Form.Control.Feedback type="invalid">{formErrors.state}</Form.Control.Feedback>
                           </Form.Group>
                           <Form.Group className="col-md-4 form-group required">
                              <Form.Label>City:</Form.Label>
                              <Form.Control as="select" name='city' id='city' value={formData.city} onChange={handleChange} isInvalid={formErrors.city} placeholder="City" onBlur={handleBlur} required>
                                 <option value="">--Select--</option>
                                 {cities.map(item => (<option value={item.id}>{item.name}</option>))}
                              </Form.Control>
                              <Form.Control.Feedback type="invalid">{formErrors.city}</Form.Control.Feedback>
                           </Form.Group>
                           <Form.Group className="col-md-4 form-group required">
                              <Form.Label htmlFor="pinCode">Pin Code:</Form.Label>
                              <Form.Control type="text" name='pinCode' id="pinCode" placeholder="Pin Code" value={formData.pinCode} onChange={handleChange} isInvalid={formErrors.pinCode} onBlur={handleBlur} required/>
                              <Form.Control.Feedback type="invalid">{formErrors.pinCode}</Form.Control.Feedback>
                           </Form.Group>
                           <Form.Group className="col-md-4 form-group required">
                              <Form.Label htmlFor="paymentTerms">Payment Term (In Days):</Form.Label>
                              <Form.Control type="text" name='paymentTerms' id="paymentTerms" placeholder="Payment Term (In Days)" value={formData.paymentTerms} onChange={handleChange} isInvalid={formErrors.paymentTerms} onBlur={handleBlur} required/>
                              <Form.Control.Feedback type="invalid">{formErrors.paymentTerms}</Form.Control.Feedback>
                           </Form.Group>
                           <Form.Group className="col-md-4 form-group required">
                              <Form.Label htmlFor="mobileNo">Mobile Number:</Form.Label>
                              <Form.Control type="text" name='mobileNo' id="mobileNo" placeholder="Mobile Number" value={formData.mobileNo} onChange={handleChange} isInvalid={formErrors.mobileNo} onBlur={handleBlur} required/>
                              <Form.Control.Feedback type="invalid">{formErrors.mobileNo}</Form.Control.Feedback>
                           </Form.Group>
                           <Form.Group className="col-md-4 form-group">
                              <Form.Label htmlFor="email">Email:</Form.Label>
                              <Form.Control type="email"  id="email" name='email' placeholder="Email" value={formData.email} onChange={handleChange} isValid={Boolean(formErrors.email)} isInvalid={formErrors.email} onBlur={handleBlur} required={required.email} />
                              <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                           </Form.Group> 
                        </div>
                        {isFormSubmit ? (
                           <Button variant="primary" disabled>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                              {' '}{isEditMode ? 'Updating...' : 'Adding'}
                           </Button>
                        ) : (
                           <Button type="submit" variant="btn btn-primary">{isEditMode ? 'Update' : 'Add'}</Button>
                        )}
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