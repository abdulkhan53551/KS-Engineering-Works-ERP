import React, { useEffect, useState } from 'react'
import { Row, Col, Form, Button, Spinner, Card } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import { DEFAULT_PROFILE } from '../../utilities/constant/constants'
import { Controller, useForm } from 'react-hook-form'
import { createFirmValidationSchema } from '../../validation/firm.validation'
import { joiResolver } from '@hookform/resolvers/joi'
import { useCountryState, useStateCity } from '../dashboard/hooks/api.hooks'
import { useGetFirmById } from './hooks/api.hooks'
import useHandleSubmit from './hooks/useHandleSubmit'

const bankAccountType = ['Savings', 'Current']
const firmType = ['Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'Other']

const FirmForm = ({ mode }) => {
   const { id: firmId } = useParams();
   const [isGstRegistered, setIsGstRegistered] = useState(false);
   const isEditMode = !!(mode == 'edit');
   const [metaIds, setMetaIds] = useState({ firmAddressId: null, firmBankId: null });

   // const hasReset = useRef(false);

   const {
      register, handleSubmit, setValue, watch, reset, resetField, control, formState: { errors },
   } = useForm({
      resolver: joiResolver(createFirmValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
   });

   const watchIsGstRegistered = watch("isGstRegistered");
   const selectedState = watch("stateId");

   const { data: countryStates = [] } = useCountryState();
   const { data: cities = [], isFetching: isFetchingCities } = useStateCity(selectedState);
   const { data: firm = {}, isFetching: isFetchingFirm } = useGetFirmById(firmId);
   const { onSubmit, onError, createFirmIsPending, updateFirmIsPending } = useHandleSubmit({ firmId, isEditMode, metaIds })

   useEffect(() => {
      if (firm && isEditMode) {
         const { firmId, firmAddressId, firmBankAccountId, ...rest } = firm;

         setMetaIds({
            firmAddressId: firmAddressId,
            firmBankId: firmBankAccountId
         });

         reset({
            ...rest,
            isGstRegistered: Boolean(firm.gstin) || false,
         });

         // hasReset.current = true; // mark as done
      }
   }, [firm, isEditMode, reset]);

   useEffect(() => {
      if (firm?.cityId && cities.length > 0) {
         setValue("cityId", firm.cityId);
      }
   }, [firm?.cityId, cities, setValue]);


   // 👇 Clear GST fields automatically when switch turns off
   useEffect(() => {
      setIsGstRegistered(watchIsGstRegistered);
      resetField("gstin");
   }, [watchIsGstRegistered]);

   return (
      <>
         <div>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)} >
               <Row>
                  <Col xl="12" lg="12">
                     <Card>
                        <Card.Header className="d-flex justify-content-between">
                           <div className="header-title">
                              <h4 className="card-title">{`${isEditMode ? 'Update' : 'Create'}`} Firm</h4>
                           </div>
                        </Card.Header>
                        <Card.Body>
                           {/* <DismissibleAlert message="This alert will automatically dismiss after 3 seconds." /> */}
                           <div className="row">
                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" id='firmName' placeholder="Firm Name" isInvalid={!!errors.firmName} {...register("firmName")} />
                                    <Form.Label htmlFor="firmName" >
                                       Firm Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.firmName?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" id='tradeName' placeholder="Trade Name" isInvalid={!!errors.tradeName} {...register("tradeName")} />
                                    <Form.Label htmlFor="tradeName" >
                                       Trade Name
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.tradeName?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>
                              <Col lg="6">
                                 <Form.Group className="form-group required">
                                    <Form.Select name="firmType" id="firmType" isInvalid={!!errors.firmType} {...register("firmType")}>
                                       <option value="">--Select Firm Type--</option>
                                       {firmType.map((item) => (<option key={item} value={item}>{item}</option>))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{errors.firmType?.message}</Form.Control.Feedback>
                                 </Form.Group>
                              </Col>
                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                       as="textarea"
                                       name='businessActivity'
                                       id='businessActivity'
                                       placeholder="Business Activity"
                                       style={{ height: '80px' }}
                                       maxLength={200}
                                       isInvalid={!!errors.businessActivity}
                                       {...register("businessActivity")}
                                    />
                                    <Form.Label htmlFor="businessActivity" >
                                       Business Activity <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.businessActivity?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>
                              <Col lg="6">
                                 <Form.Group className="form-group col-md-6">
                                    <Form.Label className="custom-file-input">Firm Logo</Form.Label>
                                    {true && (
                                       <Card style={{ width: 100 }}>
                                          <Card.Img
                                             variant="top"
                                             src={DEFAULT_PROFILE}
                                             alt="Profile"
                                             style={{ height: '100px' }}
                                             onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = DEFAULT_PROFILE;
                                             }}
                                          />
                                       </Card>
                                    )}
                                    <Form.Control type="file" id="logoUrl" name='logoUrl' isInvalid={!!errors.logoUrl} {...register("logoUrl")} />
                                    <Form.Control.Feedback type="invalid">{errors.logoUrl?.message}</Form.Control.Feedback>
                                 </Form.Group>
                              </Col>
                              <Col lg="6">
                                 <Form.Group className={"form-group  mb-4"}>
                                    <Form.Label >GST Registered:</Form.Label>
                                    <div>
                                       <Controller
                                          name="isGstRegistered"
                                          control={control}
                                          defaultValue={false}
                                          render={({ field: { value, onChange } }) => (
                                             <BootstrapSwitchButton
                                                checked={value}
                                                onChange={onChange}
                                                width={80}
                                                height={40}
                                                onlabel="Yes"
                                                offlabel="No"
                                                onstyle="success"
                                                offstyle="danger"
                                                size="sm"
                                             />
                                          )}
                                       />
                                    </div>
                                    <Form.Control.Feedback type="invalid" className={errors.isGstRegistered ? "d-block" : ""}>{errors.isGstRegistered?.message}</Form.Control.Feedback>
                                 </Form.Group>
                                 {isGstRegistered && (
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" name='gstin' id='gstin' placeholder="GST No." isInvalid={!!errors.gstin} {...register("gstin")} />
                                       <Form.Label htmlFor="gstin" >
                                          GST No. <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.gstin?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 )}
                              </Col>

                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='invoicePrefix' id='invoicePrefix' placeholder="Invoice Prefix" isInvalid={!!errors.invoicePrefix} {...register("invoicePrefix")} />
                                    <Form.Label htmlFor="invoicePrefix" >
                                       Invoice Prefix <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.invoicePrefix?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                       type="text"
                                       inputMode="numeric"
                                       pattern="[0-9]*"
                                       name='invoiceStartNumber'
                                       id='invoiceStartNumber'
                                       placeholder="Invoice Start Number"
                                       maxLength={6}
                                       isInvalid={!!errors.invoiceStartNumber}
                                       {...register("invoiceStartNumber")}
                                       onChange={(e) => {
                                          // Allow only digits
                                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                       }}
                                    />
                                    <Form.Label htmlFor="invoiceStartNumber" >
                                       Invoice Start Number <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.invoiceStartNumber?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='panNumber' id='panNumber' placeholder="PAN No." isInvalid={!!errors.panNumber} {...register("panNumber")} />
                                    <Form.Label htmlFor="panNumber" >
                                       PAN No. <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.panNumber?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='cinNumber' id='cinNumber' placeholder="CIN No." isInvalid={!!errors.cinNumber} {...register("cinNumber")} />
                                    <Form.Label htmlFor="cinNumber" >
                                       CIN No.
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.cinNumber?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='tanNumber' id='tanNumber' placeholder="Tan No." isInvalid={!!errors.tanNumber} {...register("tanNumber")} />
                                    <Form.Label htmlFor="tanNumber" >
                                       Tan No.
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.tanNumber?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="12">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control as="textarea" name='notesFooter' id='notesFooter' placeholder="Business Activity" style={{ height: '120px' }} isInvalid={!!errors.notesFooter} {...register("notesFooter")} />
                                    <Form.Label htmlFor="notesFooter" >
                                       Footer Note
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.notesFooter?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <hr className="mx-2 border-2 border-primary" />

                              {/* Email */}
                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                       type="email"
                                       name="email"
                                       id="email"
                                       placeholder="Email"
                                       isInvalid={!!errors.email}
                                       {...register("email")}
                                    />
                                    <Form.Label htmlFor="email">
                                       Email
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              {/* Phone Number */}
                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                       type="text"
                                       name="phoneNumber"
                                       id="phoneNumber"
                                       placeholder="Phone Number"
                                       isInvalid={!!errors.phoneNumber}
                                       minLength={10}
                                       maxLength={10}
                                       {...register("phoneNumber", {
                                          onChange: (e) => {
                                             // allow only digits
                                             const onlyNumbers = e.target.value.replace(/\D/g, "");
                                             setValue("phoneNumber", onlyNumbers, { shouldValidate: true });
                                          }
                                       })}
                                    />
                                    <Form.Label htmlFor="phoneNumber">
                                       Phone Number <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.phoneNumber?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              {/* Website */}
                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                       type="text"
                                       name="website"
                                       id="website"
                                       placeholder="Website"
                                       isInvalid={!!errors.website}
                                       {...register("website")}
                                    />
                                    <Form.Label htmlFor="website">
                                       Website
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.website?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              {/* Address Line 1 */}
                              <Col lg='6'>
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control as="textarea" name='addressLine1' id='addressLine1' placeholder="Address" style={{ height: '105px' }} isInvalid={!!errors.addressLine1} {...register("addressLine1")} />
                                    <Form.Label htmlFor="addressLine1" >
                                       Address <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.addressLine1?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>
                              <Col lg='6'>
                                 <Row>
                                    {/* State */}
                                    <Col lg="6">
                                       <Form.Group className="form-group required">
                                          <Form.Select
                                             name="stateId"
                                             id="stateId"
                                             isInvalid={!!errors.stateId}
                                             {...register("stateId", { required: "Please select a state" })}
                                          >
                                             <option value="">-- Select State --</option>
                                             {countryStates.map((state) => (
                                                <option key={state.id} value={state.id}>
                                                   {state.name}
                                                </option>
                                             ))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors.stateId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>

                                    {/* City */}
                                    <Col lg="6">
                                       <Form.Group className="form-group required">
                                          <Form.Select name="cityId" id="cityId" disabled={!selectedState || isFetchingCities} isInvalid={!!errors.cityId} {...register("cityId")}>
                                             <option value="">{isFetchingCities ? "Loading..." : "-- Select City --"}</option>
                                             {cities.map((city) => (<option key={city.id} value={city.id}>{city.name}</option>))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors.cityId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>
                                 </Row>

                                 <Row>
                                    {/* Pincode */}
                                    <Col lg="12">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                          <Form.Control
                                             type="text"
                                             name="pincode"
                                             id="pincode"
                                             placeholder="Pincode"
                                             isInvalid={!!errors.pincode}
                                             maxLength={6}
                                             {...register("pincode")}
                                          />
                                          <Form.Label htmlFor="pincode">
                                             Pincode <span className="text-danger label-required">*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors.pincode?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                 </Row>
                              </Col>


                              <hr className="mx-2 border-2 border-primary" />

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='upiId' id='upiId' placeholder="UPI ID" isInvalid={!!errors.upiId} {...register("upiId")} />
                                    <Form.Label htmlFor="upiId" >
                                       UPI ID
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.upiId?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='accountHolderName' id='accountHolderName' placeholder="Account Holder Name" isInvalid={!!errors.accountHolderName} {...register("accountHolderName")} />
                                    <Form.Label htmlFor="accountHolderName" >
                                       Account Holder Name. <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.accountHolderName?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                       type="text"
                                       name='accountNumber'
                                       inputMode="numeric" // shows numeric keyboard on mobile
                                       id='accountNumber'
                                       placeholder="Account No."
                                       isInvalid={!!errors.accountNumber}
                                       {...register("accountNumber", {
                                          onChange: (e) => {
                                             // allow only digits
                                             const onlyNumbers = e.target.value.replace(/\D/g, "");
                                             setValue("accountNumber", onlyNumbers, { shouldValidate: true });
                                          },
                                       })}
                                    />
                                    <Form.Label htmlFor="accountNumber" >
                                       Account No. <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.accountNumber?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='ifscCode' id='ifscCode' placeholder="IFSC" isInvalid={!!errors.ifscCode} {...register("ifscCode")} />
                                    <Form.Label htmlFor="ifscCode" >
                                       IFSC <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.ifscCode?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='bankName' id='bankName' placeholder="Bank Name" isInvalid={!!errors.bankName} {...register("bankName")} />
                                    <Form.Label htmlFor="bankName" >
                                       Bank Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.bankName?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='branchName' id='branchName' placeholder="Branch Name" isInvalid={!!errors.branchName} {...register("branchName")} />
                                    <Form.Label htmlFor="branchName" >
                                       Branch Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.branchName?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="4">
                                 <Form.Group className="form-group">
                                    <Form.Select name="accountType" id="accountType" isInvalid={!!errors.accountType} {...register("accountType")}>
                                       <option value="">--Select Firm Type--</option>
                                       {bankAccountType.map((item) => (<option key={item} value={item.toLowerCase()}>{item}</option>))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{errors.accountType?.message}</Form.Control.Feedback>
                                 </Form.Group>
                              </Col>

                           </div>
                           <Button type='submit' variant="primary" disabled={createFirmIsPending || updateFirmIsPending}>
                              {createFirmIsPending || updateFirmIsPending && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                              {isEditMode ? 'Updating' : 'Adding'}{createFirmIsPending || updateFirmIsPending ? '...' : ''}
                           </Button>
                        </Card.Body>
                     </Card>
                  </Col>
               </Row>
            </Form>
         </div >
      </>
   )

}

export default FirmForm;