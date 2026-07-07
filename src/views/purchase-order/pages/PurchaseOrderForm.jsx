import React, { useState } from 'react'
import { Row, Col, Form, Card, FormCheck } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import Flatpickr from "react-flatpickr";
import { Controller, useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import { usePurchaseOrderById } from '../hooks/useApi'
import useHandleSubmit from '../hooks/useHandleSubmit'
import SubmitButton from '../../../components/SubmitButton'
import { FaRegCalendarAlt } from 'react-icons/fa';
import { purchaseOrderValidationSchema } from '../../../validation/purchaseOrder.validation';
import useFormInit from '../hooks/useFormInit';

const PurchaseOrderForm = ({ mode }) => {
   const { id: poId } = useParams();
   const [isInvoiced, setIsInvoiced] = useState(false);
   const isEditMode = !!(mode == 'edit');
   const defaultFormValue = {
      poNo: '',
      poDate: new Date(),
      isInvoiced: false,
      customerName: '',
   }

   const {
      register, handleSubmit, setValue, watch, reset, resetField, getValues, control, formState: { errors },
   } = useForm({
      resolver: joiResolver(purchaseOrderValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         invoiceId: null,
         ...defaultFormValue
      }
   });

   const { data: purchaseOrder = {} } = usePurchaseOrderById(poId);
   const { onSubmit, onError, createPurchaseOrderIsPending, updatePurchaseOrderIsPending } = useHandleSubmit({ poId, isEditMode })
   useFormInit({ purchaseOrder, isEditMode, reset, defaultFormValue })

   return (
      <>
         <div>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)} >
               <Row>
                  <Col xl="12" lg="12">
                     <Card>
                        <Card.Header className="d-flex justify-content-between">
                           <div className="header-title">
                              <h4 className="card-title">{`${isEditMode ? 'Update' : 'Create'}`} Purchase Order</h4>
                           </div>
                        </Card.Header>
                        <Card.Body>
                           <div className="row">
                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" id='poNo' placeholder="PO No" isInvalid={!!errors.poNo} {...register("poNo")} />
                                    <Form.Label htmlFor="poNo" >
                                       PO No <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.poNo?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <div className="input-group">
                                       <span className="input-group-text">
                                          <FaRegCalendarAlt />
                                       </span>
                                       <Controller
                                          name="poDate"
                                          control={control}
                                          defaultValue={new Date()} // or new Date() if you want default as today
                                          render={({ field, fieldState: { error } }) => (
                                             <div>
                                                <Flatpickr
                                                   {...field}
                                                   value={field.value}
                                                   onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                                   options={{
                                                      dateFormat: "d/m/Y", // 20/10/2025 format
                                                      defaultDate: ["today"],
                                                   }}
                                                   className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                   placeholder="Select Date..."
                                                />
                                                <Form.Control.Feedback type="invalid">{errors.poDate?.message}</Form.Control.Feedback>
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

export default PurchaseOrderForm;