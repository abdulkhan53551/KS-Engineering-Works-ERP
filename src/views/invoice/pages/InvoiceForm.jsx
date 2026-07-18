import React, { useEffect, useMemo } from 'react'
import { Row, Col, Form, Card, FormCheck, Button, Table } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import Flatpickr from "react-flatpickr";
import { Controller, FormProvider, useFieldArray, useForm, useFormState, useWatch } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import useHandleSubmit from '../hooks/useHandleSubmit'
import SubmitButton from '../../../components/SubmitButton'
import { FaRegCalendarAlt, FaRegWindowClose, FaWindowClose } from 'react-icons/fa';
import useFormInit from '../hooks/useFormInit';
import { invoiceValidationSchema } from '../../../validation/invoice.validation';
import { useGetInvoiceChallanById } from '../../invoice-challan/hooks/useApi';
import { useInvoiceById } from '../hooks/useApi';
import { MdAddBox } from 'react-icons/md';
import { useCountryState, useGstSlab, usePaymentMode, usePaymentStatus, useProductUnit, useStateCity } from '../../dashboard/hooks/api.hooks';
import InvoiceItemsTable from '../components/InvoiceItemsTable';
import useInvoiceCalculation from '../hooks/useInvoiceCalculation';
// import { Eye, ListChecks, Watch } from 'lucide-react';
import IconButton from '../components/IconButton';
import { ModuleSelectorModal } from '../components/ModuleSelectorModal';
import useInvoiceModules from '../hooks/useAccountingDocumentModules';
import './invoice.scss'
import useAccountingDocumentModules from '../hooks/useAccountingDocumentModules';
import InvoiceRow from '../components/InvoiceRow';

const defaultFormValue = {
   invoiceNo: "",
   invoiceDate: new Date(),
   dueDays: 0,
   dueDate: new Date(),
   customerName: "",
   hasGst: false,
   gstNumber: "",
   billingAddress: {
      email: "",
      phoneNumber: "",
      website: "",
      addressLine1: "",
      cityId: null,
      stateId: null,
      pincode: null
   },
   shippingAddress: {
      email: "",
      phoneNumber: "",
      addressLine1: "",
      cityId: null,
      stateId: null,
      pincode: null
   },
   hasChallan: false,
   hasPo: false,
   hasEwayBill: false,
   challanIds: [],
   poIds: [],
   ewayBillIds: [],

   items: [
      {
         description: "",
         hsnSacCode: "",
         qty: 1,
         itemUnitId: null,
         rate: 0,
         discountPercent: 0,
         discountAmount: 0,
         taxableAmount: 0,
         gstSlabId: null,
         cgst: 0,
         sgst: 0,
         igst: 0,
         total: 0,
      }
   ],
   subTotal: 0,
   discountPercent: 0,
   discountAmount: 0,
   taxableAmount: 0,
   cgst: 0,
   sgst: 0,
   igst: 0,
   total: 0,
   roundOff: 0,
   other: 0,
   paymentStatusId: 1,
   paymentModeId: 0
}

const InvoiceForm = ({ mode }) => {
   const { id: invoiceId } = useParams();
   const isEditMode = !!(mode == 'edit');

   const formMethods = useForm({
      resolver: joiResolver(invoiceValidationSchema(isEditMode)),
      shouldUnregister: false,
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         ...defaultFormValue
      }
   });

   const { register, handleSubmit, setValue, reset, getValues, control, formState: { errors } } = formMethods;
   const [
      selectedBillingState, selectedShippingState, hasChallan, hasPo, hasEwayBill, invoiceDate,
   ] = useWatch({
      control,
      name: [
         "billingAddress.stateId", "shippingAddress.stateId", "hasChallan", "hasPo", "hasEwayBill", "invoiceDate",
      ],
   });

   const invoiceDateOptons = useMemo(() => ({ dateFormat: "d/m/Y", defaultDate: ["today"] }), [])
   const dueDateOptons = useMemo(() => ({ dateFormat: "d/m/Y", defaultDate: ["today"], minDate: invoiceDate || "today" }), [invoiceDate])
   const { data: invoice = {} } = useInvoiceById(invoiceId);
   const { onSubmit, onError, createInvoiceIsPending, updateInvoiceIsPending } = useHandleSubmit({ invoiceId, isEditMode })
   useFormInit({ invoice, isEditMode, setValue, reset, control, defaultFormValue })
   const { lastEditedFieldRef } = useInvoiceCalculation({ control, setValue, getValues });
   const { data: productUnit = [] } = useProductUnit();
   const { data: gstSlab = [] } = useGstSlab();
   const { data: billingStates = [] } = useCountryState();
   const { data: billingCities = [], isFetching: isFetchingBillingCities } = useStateCity(selectedBillingState);
   const { data: shippingStates = [] } = useCountryState();
   const { data: shippingCities = [], isFetching: isFetchingShippingCities } = useStateCity(selectedShippingState);
   const { data: paymentStatus = [] } = usePaymentStatus();
   const { data: paymentMode = [] } = usePaymentMode();
   const { activeModule, moduleData, fetchModuleFun, openModule, closeModule, updateModuleData, submitModule } = useAccountingDocumentModules({ invoiceId, setValue });

   return (
      <>
         <style>{`
        /* Delete Button Hover Effect */
        .delete-btn { 
          opacity: 0; 
          border-radius: 50%;
          padding: 0.5rem; 
          background-color: transparent;
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out, background-color 0.2s ease-in-out, color 0.2s ease-in-out; 
          transform: scale(0.85); 
          line-height: 1; 
          color: #999; 
        }
        .delete-btn:hover {
          background-color: var(--bs-danger-bg-subtle, rgba(220, 53, 69, 0.15)); 
          transform: scale(1.05); 
        }
      `}</style>
         <div>
            <FormProvider {...formMethods}>
               <Form noValidate onSubmit={handleSubmit(onSubmit, onError)} >
                  <Row>
                     <Col xl="12" lg="12">
                        <Card>
                           <Card.Header className="d-flex justify-content-between">
                              <div className="header-title">
                                 <h4 className="card-title">{`${isEditMode ? 'Update' : 'Create'}`} Invoice</h4>
                              </div>
                           </Card.Header>
                           <Card.Body>
                              <div className="row">
                                 <Col lg="6">
                                    <Row>
                                       <Col lg="4">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control type="text" id='invoiceNo' placeholder="PO No" isInvalid={!!errors.invoiceNo} {...register("invoiceNo")} />
                                             <Form.Label htmlFor="invoiceNo" >
                                                Invoice No <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors.invoiceNo?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>
                                       <Col lg="8">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control type="text" name='customerName' id='customerName' placeholder="Customer Name" isInvalid={!!errors.customerName} {...register('customerName')} />
                                             <Form.Label htmlFor="customerName" >
                                                Customer Name <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors.customerName?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>
                                       <Col lg="4">
                                          <Form.Group className=" form-group mb-4">
                                             <Form.Check className=" form-check-inline">
                                                <FormCheck.Input
                                                   type="checkbox"
                                                   className="form-check-input"
                                                   id="hasGst"
                                                   isInvalid={!!errors.hasGst}
                                                   {...register("hasGst", {
                                                      onChange: (e) => {
                                                         const value = e.target.checked;
                                                         // ✅ Update value in RHF
                                                         setValue("hasGst", value, { shouldValidate: true });
                                                      }
                                                   })} />
                                                <FormCheck.Label className="form-check-label pl-2" htmlFor="hasGst">GST available</FormCheck.Label>
                                                <Form.Control.Feedback type="invalid">{errors.hasGst?.message}</Form.Control.Feedback>
                                             </Form.Check>
                                          </Form.Group>
                                       </Col>
                                       <Col lg="5">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control type="text" name='gstNumber' id='gstNumber' placeholder="GST No." isInvalid={!!errors.gstNumber} {...register("gstNumber")} />
                                             <Form.Label htmlFor="gstNumber" >
                                                GST No. <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors.gstNumber?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>
                                       <Col lg="4">
                                          <Form.Group className=" form-group mb-4">
                                             <Form.Check className=" form-check-inline">
                                                <FormCheck.Input
                                                   type="checkbox"
                                                   className="form-check-input"
                                                   id="hasChallan"
                                                   isInvalid={!!errors.challanIds || !!errors.hasChallan}
                                                   {...register("hasChallan", {
                                                      onChange: (e) => {
                                                         const value = e.target.checked;
                                                         // ✅ Update value in RHF
                                                         setValue("hasChallan", value, { shouldValidate: true });
                                                      }
                                                   })} />
                                                <FormCheck.Label className="form-check-label pl-2" htmlFor="hasChallan">Has Challan ?</FormCheck.Label>
                                                <Form.Control.Feedback type="invalid">{errors.hasChallan?.message}</Form.Control.Feedback>
                                             </Form.Check>
                                             <IconButton
                                                iconKey="FileText"
                                                label="Challan"
                                                disabled={!hasChallan}
                                                // onClick={() => openModule('challan')}
                                                onClick={() => {
                                                   openModule('challan')
                                                   // refetch()
                                                }}
                                                variant="primary"
                                             />
                                             {errors.challanIds && (
                                                <div className="invalid-feedback d-block">
                                                   {errors.challanIds.message}
                                                </div>
                                             )}
                                          </Form.Group>
                                       </Col>
                                       <Col lg="4">
                                          <Form.Group className=" form-group mb-4">
                                             <Form.Check className=" form-check-inline">
                                                <FormCheck.Input
                                                   type="checkbox"
                                                   className="form-check-input"
                                                   id="hasPo"
                                                   isInvalid={!!errors.hasPo || !!errors.poIds}
                                                   {...register("hasPo", {
                                                      onChange: (e) => {
                                                         const value = e.target.checked;
                                                         // ✅ Update value in RHF
                                                         setValue("hasPo", value, { shouldValidate: true });
                                                      }
                                                   })} />
                                                <FormCheck.Label className="form-check-label pl-2" htmlFor="hasPo">Has PO ?</FormCheck.Label>
                                             </Form.Check>
                                             <IconButton
                                                iconKey="ShoppingCart"
                                                label="P.O"
                                                disabled={!hasPo}
                                                // onClick={() => openModule('purchaseOrder')}
                                                onClick={() => {
                                                   openModule('purchaseOrder')
                                                   // refetch();
                                                }}
                                                variant="info"
                                             />
                                             {/* Show validation message (must use d-block) */}
                                             {errors.poIds && (
                                                <div className="invalid-feedback d-block">
                                                   {errors.poIds.message}
                                                </div>
                                             )}
                                          </Form.Group>
                                       </Col>
                                       <Col lg="4">
                                          <Form.Group className=" form-group mb-4">
                                             <Form.Check className=" form-check-inline">
                                                <FormCheck.Input
                                                   type="checkbox"
                                                   className="form-check-input"
                                                   id="hasEwayBill"
                                                   isInvalid={!!errors.ewayBillIds || !!errors.hasEwayBill}
                                                   {...register("hasEwayBill", {
                                                      onChange: (e) => {
                                                         const value = e.target.checked;
                                                         // ✅ Update value in RHF
                                                         setValue("hasEwayBill", value, { shouldValidate: true });
                                                      }
                                                   })} />
                                                <FormCheck.Label className="form-check-label pl-2" htmlFor="hasEwayBill">Has Eway Bill ?</FormCheck.Label>
                                                <Form.Control.Feedback type="invalid">{errors.hasEwayBill?.message}</Form.Control.Feedback>
                                             </Form.Check>
                                             <IconButton
                                                iconKey="Truck"
                                                label="E-Way Bill"
                                                disabled={!hasEwayBill}
                                                // onClick={() => console.log("EWB Clicked")}
                                                onClick={() => openModule('ewayBill')}
                                                variant="warning"
                                             />
                                             {errors.ewayBillIds && (
                                                <div className="invalid-feedback d-block">
                                                   {errors.ewayBillIds.message}
                                                </div>
                                             )}
                                          </Form.Group>
                                       </Col>
                                    </Row>
                                 </Col>

                                 <Col lg="6">
                                    <Row>
                                       <Col lg="6">
                                          <Form.Group className="form-group mb-4">
                                             <Form.Label htmlFor="invoiceDate">
                                                Invoice date <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Controller
                                                name="invoiceDate"
                                                control={control}
                                                defaultValue={new Date()} // Set default date
                                                render={({ field, fieldState: { error } }) => (
                                                   <div className="input-group">
                                                      <span className="input-group-text">
                                                         <FaRegCalendarAlt />
                                                      </span>
                                                      <Flatpickr
                                                         {...field}
                                                         value={field.value}
                                                         onChange={(selectedDates) => field.onChange(selectedDates[0] || null)} // return ISO or Date object
                                                         options={invoiceDateOptons}
                                                         className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                         placeholder="Select E-way bill Date..."
                                                      />
                                                      <Form.Control.Feedback type="invalid">
                                                         {errors.invoiceDate?.message}
                                                      </Form.Control.Feedback>
                                                   </div>
                                                )}
                                             />
                                          </Form.Group>
                                       </Col>
                                       <Col lg="6">
                                          <Form.Group className="form-group mb-4">
                                             <Form.Label htmlFor="dueDate">
                                                Due date <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Controller
                                                name="dueDate"
                                                control={control}
                                                defaultValue={new Date()} // Set default date
                                                // disabled={true}
                                                // readOnly={true}
                                                render={({ field, fieldState: { error } }) => (
                                                   <div className="input-group">
                                                      <span className="input-group-text">
                                                         <FaRegCalendarAlt />
                                                      </span>
                                                      <Flatpickr
                                                         {...field}
                                                         value={field.value}
                                                         onChange={(selectedDates) => field.onChange(selectedDates[0] || null)} // return ISO or Date object
                                                         options={dueDateOptons}
                                                         className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                         placeholder="Select E-way bill Date..."
                                                      />
                                                      <Form.Control.Feedback type="invalid">
                                                         {errors.dueDate?.message}
                                                      </Form.Control.Feedback>
                                                   </div>
                                                )}
                                             />
                                          </Form.Group>

                                       </Col>
                                       <Col lg="4">
                                          <Form.Group className="form-group">
                                             <Form.Label htmlFor="paymentStatusId">
                                                Payment Status <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Select name="paymentStatusId" id="paymentStatusId" isInvalid={!!errors.paymentStatusId} {...register("paymentStatusId")}>
                                                <option value="">--Select Payment Status--</option>
                                                {paymentStatus.map((item) => (<option key={item.id} value={item.id}>{item.label}</option>))}
                                             </Form.Select>
                                             <Form.Control.Feedback type="invalid">{errors.paymentStatusId?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>
                                       <Col lg="5">
                                          <Form.Group className="form-group">
                                             <Form.Label htmlFor="paymentModeId">
                                                Payment Mode <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Select name="paymentModeId" id="paymentModeId" isInvalid={!!errors.paymentModeId} {...register("paymentModeId")}>
                                                <option value="">--Select Payment Mode--</option>
                                                {paymentMode.map((item) => (<option key={item.id} value={item.id}>{item.label}</option>))}
                                             </Form.Select>
                                             <Form.Control.Feedback type="invalid">{errors.paymentModeId?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>
                                       <Col lg="3">
                                          <Form.Label htmlFor="dueDays">&nbsp;</Form.Label>
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control type="text" id='dueDays' placeholder="PO No" isInvalid={!!errors.dueDays} {...register("dueDays")} />
                                             <Form.Label htmlFor="dueDays" >
                                                Due Day <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors.dueDays?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>
                                    </Row>
                                 </Col>

                                 <hr className="mx-2 border-2 border-primary" />

                                 <div className="row">
                                 </div>
                                 {/* Billing Section */}
                                 <Col lg="6">
                                    <Row>
                                       <Col lg='12'>
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control as="textarea" placeholder="Address" style={{ height: '105px' }} isInvalid={!!errors?.billingAddress?.addressLine1} {...register("billingAddress.addressLine1")} />
                                             <Form.Label htmlFor="addressLine1" >
                                                Billing Address <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.addressLine1?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       {/* Phone Number */}
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control
                                                type="text"
                                                placeholder="Billing Phone Number"
                                                isInvalid={!!errors?.billingAddress?.phoneNumber}
                                                minLength={10}
                                                maxLength={10}
                                                {...register("billingAddress.phoneNumber", {
                                                   onChange: (e) => {
                                                      // allow only digits
                                                      const onlyNumbers = e.target.value.replace(/\D/g, "");
                                                      setValue("billingAddress.phoneNumber", onlyNumbers, { shouldValidate: true });
                                                   }
                                                })}
                                             />
                                             <Form.Label htmlFor="phoneNumber">
                                                Billing Phone Number <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.phoneNumber?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       {/* Email */}
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control
                                                type="email"
                                                placeholder="Billing Email"
                                                isInvalid={!!errors?.billingAddress?.email}
                                                {...register("billingAddress.email")}
                                             />
                                             <Form.Label htmlFor="email">
                                                Billing Email
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.email?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       {/* State */}
                                       <Col lg="6">
                                          <Form.Group className="form-group required">
                                             <Form.Select
                                                isInvalid={!!errors?.billingAddress?.stateId}
                                                {...register("billingAddress.stateId")}
                                             >
                                                <option value="">-- Select State --</option>
                                                {billingStates.map((state) => (<option key={state.id} value={state.id}>{state.name}</option>))}
                                             </Form.Select>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.stateId?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>

                                       {/* City */}
                                       <Col lg="6">
                                          <Form.Group className="form-group required">
                                             <Form.Select disabled={!selectedBillingState || isFetchingBillingCities} isInvalid={!!errors?.billingAddress?.cityId} {...register("billingAddress.cityId")}>
                                                <option value="">{isFetchingBillingCities ? "Loading..." : "-- Select City --"}</option>
                                                {billingCities.map((city) => (<option key={city.id} value={city.id}>{city.name}</option>))}
                                             </Form.Select>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.cityId?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>
                                       {/* Pincode */}
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control
                                                type="text"
                                                placeholder="Pincode"
                                                isInvalid={!!errors?.billingAddress?.pincode}
                                                maxLength={6}
                                                {...register("billingAddress.pincode")}
                                             />
                                             <Form.Label htmlFor="pincode">
                                                Pincode <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.pincode?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       {/* Website */}
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control
                                                type="text"
                                                placeholder="Website"
                                                isInvalid={!!errors?.billingAddress?.website}
                                                {...register("billingAddress.website")}
                                             />
                                             <Form.Label htmlFor="website">
                                                Website
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.website?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>
                                       <Col lg='6'>
                                          <Row>
                                          </Row>

                                          <Row>

                                          </Row>
                                       </Col>

                                    </Row>
                                    {/* Address Line 1 */}
                                 </Col>

                                 {/* Shipping Address Section */}
                                 {/* Address Line 1 */}
                                 <Col lg="6">
                                    <Row>
                                       <Col lg='12'>
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control as="textarea" placeholder="Address" style={{ height: '105px' }} isInvalid={!!errors?.shippingAddress?.addressLine1} {...register("shippingAddress.addressLine1")} />
                                             <Form.Label htmlFor="addressLine1" >
                                                Shipping Address <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.addressLine1?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       {/* Phone Number */}
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control
                                                type="text"
                                                placeholder="Shipping Phone Number"
                                                isInvalid={!!errors?.shippingAddress?.phoneNumber}
                                                minLength={10}
                                                maxLength={10}
                                                {...register("shippingAddress.phoneNumber", {
                                                   onChange: (e) => {
                                                      // allow only digits
                                                      const onlyNumbers = e.target.value.replace(/\D/g, "");
                                                      setValue("shippingAddress.phoneNumber", onlyNumbers, { shouldValidate: true });
                                                   }
                                                })}
                                             />
                                             <Form.Label htmlFor="phoneNumber">
                                                Shipping Phone Number <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.phoneNumber?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       {/* Email */}
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control
                                                type="email"
                                                placeholder="Shipping Email"
                                                isInvalid={!!errors?.shippingAddress?.email}
                                                {...register("shippingAddress.email")}
                                             />
                                             <Form.Label htmlFor="email">
                                                Shipping Email
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.email?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       {/* State */}
                                       <Col lg="6">
                                          <Form.Group className="form-group required">
                                             <Form.Select
                                                isInvalid={!!errors?.shippingAddress?.stateId}
                                                {...register("shippingAddress.stateId")}
                                             >
                                                <option value="">-- Select State --</option>
                                                {shippingStates.map((state) => (<option key={state.id} value={state.id}>{state.name}</option>))}
                                             </Form.Select>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.stateId?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>

                                       {/* City */}
                                       <Col lg="6">
                                          <Form.Group className="form-group required">
                                             <Form.Select disabled={!selectedShippingState || isFetchingShippingCities} isInvalid={!!errors?.shippingAddress?.cityId} {...register("shippingAddress.cityId")}>
                                                <option value="">{isFetchingShippingCities ? "Loading..." : "-- Select City --"}</option>
                                                {shippingCities.map((city) => (<option key={city.id} value={city.id}>{city.name}</option>))}
                                             </Form.Select>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.cityId?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>
                                       {/* Pincode */}
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                             <Form.Control
                                                type="text"
                                                placeholder="Pincode"
                                                isInvalid={!!errors?.shippingAddress?.pincode}
                                                maxLength={6}
                                                {...register("shippingAddress.pincode")}
                                             />
                                             <Form.Label htmlFor="pincode">
                                                Pincode <span className="text-danger label-required">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.pincode?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>
                                    </Row>
                                 </Col>
                              </div>

                              <hr className="mx-2 border-2 border-primary" />

                              <div className="row">
                                 <Col lg="12">
                                    <InvoiceItemsTable
                                       productUnit={productUnit}
                                       gstSlab={gstSlab}
                                       lastEditedFieldRef={lastEditedFieldRef}
                                    />
                                 </Col>

                                 <hr className="mx-2 border-2 border-primary" />

                                 <Col lg="3">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='subTotal' placeholder="Sub Total" className="text-end" disabled={true} isInvalid={!!errors.subTotal} {...register("subTotal")} />
                                       <Form.Label htmlFor="subTotal" >
                                          Sub Total <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.subTotal?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="3">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='discountPercent' placeholder="Discount (%)" className="text-end" disabled={true} isInvalid={!!errors.discountPercent} {...register("discountPercent")} />
                                       <Form.Label htmlFor="discountPercent" >
                                          Discount (%) <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.discountPercent?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="3">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='discountAmount' placeholder="Discount Amount" className="text-end" isInvalid={!!errors.discountAmount} {...register("discountAmount")} />
                                       <Form.Label htmlFor="discountAmount" >
                                          Discount Amount <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.discountAmount?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="3">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='taxableAmount' placeholder="Taxable Amount" className="text-end" disabled={true} isInvalid={!!errors.taxableAmount} {...register("taxableAmount")} />
                                       <Form.Label htmlFor="taxableAmount" >
                                          Taxable Amount <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.taxableAmount?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="2">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='cgst' placeholder="CGST" className="text-end" disabled={true} isInvalid={!!errors.cgst} {...register("cgst")} />
                                       <Form.Label htmlFor="cgst" >
                                          CGST <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.cgst?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="2">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='sgst' placeholder="SGST" className="text-end" disabled={true} isInvalid={!!errors.sgst} {...register("sgst")} />
                                       <Form.Label htmlFor="sgst" >
                                          SGST <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.sgst?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="2">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='igst' placeholder="IGST" className="text-end" disabled={true} isInvalid={!!errors.igst} {...register("igst")} />
                                       <Form.Label htmlFor="igst" >
                                          IGST <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.igst?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="2">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='other' placeholder="Other Charges" className="text-end" isInvalid={!!errors.other} {...register("other")} />
                                       <Form.Label htmlFor="other" >
                                          Other Charges <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.other?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="2">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='roundOff' placeholder="Round Off" className="text-end" isInvalid={!!errors.roundOff} {...register("roundOff", {
                                          onChange: () => setValue("roundOffManual", true),
                                       })} />
                                       <Form.Label htmlFor="roundOff" >
                                          Round Off. <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.roundOff?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                                 <Col lg="2">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                       <Form.Control type="text" id='total' placeholder="Total" className="text-end" disabled={true} isInvalid={!!errors.total} {...register("total")} />
                                       <Form.Label htmlFor="total" >
                                          Total <span className="text-danger label-required">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.total?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>
                              </div>
                              <SubmitButton
                                 isLoading={createInvoiceIsPending || updateInvoiceIsPending}
                                 isEditMode={isEditMode}
                              />
                           </Card.Body>
                        </Card>
                     </Col>
                  </Row>
               </Form>
               {/* Conditional Modal Rendering */}
               {activeModule && (
                  <ModuleSelectorModal
                     moduleKey={activeModule}
                     invoiceId={invoiceId}
                     show={!!activeModule} // Only show if activeModule is set
                     fetchModuleFun={fetchModuleFun}
                     onClose={closeModule}
                     moduleData={moduleData}
                     updateModuleData={updateModuleData}
                     onSubmit={submitModule}
                  />
               )}
            </FormProvider>
         </div >
      </>
   )
}

export default InvoiceForm;