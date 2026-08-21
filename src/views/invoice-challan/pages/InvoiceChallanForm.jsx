import React from 'react'
import { Row, Col, Form, Card } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import Flatpickr from "react-flatpickr";
import { Controller, useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import { useGetInvoiceChallanById } from '../hooks/useApi'
import useHandleSubmit from '../hooks/useHandleSubmit'
import { createInvoiceChallanValidationSchema, updateInvoiceChallanValidationSchema } from '../../../validation/invoiceChallan.validation'
import SubmitButton from '../../../components/SubmitButton'
import { FaRegCalendarAlt } from 'react-icons/fa';
import useFormInit from '../hooks/useFormInit';

const InvoiceChallan = ({ mode }) => {
   const { id: challanId } = useParams();
   const isEditMode = !!(mode === 'edit');
   const defaultFormValue = {
      challanNo: '',
      challanDate: new Date(),
      customerName: '',
   }

   const {
      register, handleSubmit, setValue, watch, reset, resetField, control, formState: { errors },
   } = useForm({
      resolver: joiResolver(isEditMode ? updateInvoiceChallanValidationSchema : createInvoiceChallanValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         invoiceId: null,
         ...defaultFormValue
      }
   });

   const { data: invoiceChallan = {}, isFetching } = useGetInvoiceChallanById(challanId);
   const { onSubmit, onError, createInvoiceChallanIsPending, updateInvoiceChallanIsPending } = useHandleSubmit({ challanId, isEditMode });
   useFormInit({ invoiceChallan, isEditMode, reset, defaultFormValue });

   return (
      <>
         <div>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)} >
               <Row>
                  <Col xl="12" lg="12">
                     <Card>
                        <Card.Header className="d-flex justify-content-between">
                           <div className="header-title">
                              <h4 className="card-title">{`${isEditMode ? 'Update' : 'Create'}`} Invoice Challan</h4>
                           </div>
                        </Card.Header>
                        <Card.Body>
                           <div className="row">
                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" id='challanNo' placeholder="Challan No" isInvalid={!!errors.challanNo} {...register("challanNo")} />
                                    <Form.Label htmlFor="challanNo" >
                                       Challan No <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.challanNo?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <div className="input-group">
                                       <span className="input-group-text">
                                          <FaRegCalendarAlt />
                                       </span>
                                       <Controller
                                          name="challanDate"
                                          control={control}
                                          defaultValue={new Date()}
                                          render={({ field, fieldState: { error } }) => (
                                             <div>
                                                <Flatpickr
                                                   {...field}
                                                   value={field.value}
                                                   onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                                   options={{
                                                      dateFormat: "d/m/Y",
                                                      defaultDate: ["today"],
                                                   }}
                                                   className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                   placeholder="Select Date..."
                                                />
                                                <Form.Control.Feedback type="invalid">{errors.challanDate?.message}</Form.Control.Feedback>
                                             </div>
                                          )}
                                       />
                                    </div>
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
                           </div>

                           <SubmitButton
                              isLoading={createInvoiceChallanIsPending || updateInvoiceChallanIsPending}
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

export default InvoiceChallan;