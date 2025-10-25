import React, { useState } from 'react'
import { Row, Col, Form, Card, FormCheck } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import Flatpickr from "react-flatpickr";
import { Controller, useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import { useEwayBillById } from '../hooks/useApi'
import useHandleSubmit from '../hooks/useHandleSubmit'
import SubmitButton from '../../../components/SubmitButton'
import { FaRegCalendarAlt } from 'react-icons/fa';
import useFormInit from '../hooks/useFormInit';
import { eWayBillValidationSchema } from '../../../validation/ewayBill.validation';

const EwayBillForm = ({ mode }) => {
   const { id: ewayBillId } = useParams();
   const [isInvoiced, setIsInvoiced] = useState(false);
   const isEditMode = !!(mode == 'edit');
   const defaultFormValue = {
      ewayBillNo: '',
      ewayBillDate: new Date(),
      ewaybillValidUpto: new Date(),
      isInvoiced: false,
      customerName: '',
   }

   const {
      register, handleSubmit, setValue, reset, getValues, control, formState: { errors },
   } = useForm({
      resolver: joiResolver(eWayBillValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         invoiceId: null,
         ...defaultFormValue
      }
   });

   const { data: ewayBill = {} } = useEwayBillById(ewayBillId);
   const { onSubmit, onError, createPurchaseOrderIsPending, updatePurchaseOrderIsPending } = useHandleSubmit({ ewayBillId, isEditMode })
   useFormInit({ ewayBill, isEditMode, reset, defaultFormValue })

   const formValue = getValues();

   return (
      <>
         <div>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)} >
               <Row>
                  <Col xl="12" lg="12">
                     <Card>
                        <Card.Header className="d-flex justify-content-between">
                           <div className="header-title">
                              <h4 className="card-title">{`${isEditMode ? 'Update' : 'Create'}`} E Way Bill</h4>
                           </div>
                        </Card.Header>
                        <Card.Body>
                           <div className="row">
                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" id='ewayBillNo' placeholder="PO No" isInvalid={!!errors.ewayBillNo} {...register("ewayBillNo")} />
                                    <Form.Label htmlFor="ewayBillNo" >
                                       E-way bill No <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.ewayBillNo?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>


                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" name='customerName' id='customerName' placeholder="Customer Name" isInvalid={!!errors.customerName} {...register('customerName')} />
                                    <Form.Label htmlFor="customerName" >
                                       Customer Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.customerName?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="6">
                                 <Form.Group className="form-group mb-4">
                                    <Form.Label htmlFor="ewayBillDate">
                                       E-way bill date <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Controller
                                       name="ewayBillDate"
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
                                                options={{
                                                   dateFormat: "d/m/Y",
                                                   defaultDate: ["today"]
                                                }}
                                                className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                placeholder="Select E-way bill Date..."
                                             />
                                             <Form.Control.Feedback type="invalid">
                                                {errors.ewayBillDate?.message}
                                             </Form.Control.Feedback>
                                          </div>
                                       )}
                                    />
                                 </Form.Group>

                              </Col>
                              <Col lg="6">
                                 <Form.Group className="form-group mb-4">
                                    <Form.Label htmlFor="ewaybillValidUpto">
                                       E-way bill validity <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Controller
                                       name="ewaybillValidUpto"
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
                                                options={{
                                                   dateFormat: "d/m/Y",
                                                   defaultDate: ["today"]
                                                }}
                                                className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                placeholder="Select E-way bill validity..."
                                             />
                                             <Form.Control.Feedback type="invalid">
                                                {errors.ewaybillValidUpto?.message}
                                             </Form.Control.Feedback>
                                          </div>
                                       )}
                                    />
                                 </Form.Group>

                              </Col>

                              <Col lg="6">
                                 <Form.Group className=" form-group mb-4">
                                    <Form.Check className=" form-check-inline">
                                       <FormCheck.Input
                                          type="checkbox"
                                          className="form-check-input"
                                          id="isInvoiced"
                                          isInvalid={!!errors.isInvoiced}
                                          {...register("isInvoiced", {
                                             onChange: (e) => {
                                                const value = e.target.checked;
                                                // ✅ Update value in RHF
                                                setValue("isInvoiced", value, { shouldValidate: true });
                                             }
                                          })} />
                                       <FormCheck.Label className="form-check-label pl-2" htmlFor="isInvoiced">Is Invoiced</FormCheck.Label>
                                       <Form.Control.Feedback type="invalid">{errors.isInvoiced?.message}</Form.Control.Feedback>
                                    </Form.Check>
                                 </Form.Group>
                              </Col>
                           </div>

                           <SubmitButton
                              isLoading={createPurchaseOrderIsPending || updatePurchaseOrderIsPending}
                              isEditMode={isEditMode}
                           />
                        </Card.Body>
                     </Card>
                  </Col>
               </Row>
            </Form>
         </div >
      </>
   )

}

export default EwayBillForm;