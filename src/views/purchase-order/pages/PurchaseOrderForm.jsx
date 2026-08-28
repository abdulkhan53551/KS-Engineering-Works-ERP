import React from 'react';
import { Row, Col, Form, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Flatpickr from "react-flatpickr";
import { Controller, useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { usePurchaseOrderById } from '../hooks/useApi';
import useHandleSubmit from '../hooks/useHandleSubmit';
import SubmitButton from '../../../components/SubmitButton';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { createPurchaseOrderValidationSchema, updatePurchaseOrderValidationSchema } from '../../../validation/purchaseOrder.validation';
import useFormInit from '../hooks/useFormInit';
import AttachmentManager from '../../../components/attachments/AttachmentManager';

const PO_DOC_TYPES = [
   { value: 'SIGNED_PO', label: 'Signed Purchase Order' },
   { value: 'VENDOR_QUOTATION', label: 'Vendor Quotation' },
   { value: 'ORDER_SPEC', label: 'Order / Technical Spec (PDF)' },
   { value: 'OTHER', label: 'General / Other Document' }
];

const PurchaseOrderForm = ({ mode }) => {
   const { id: poId } = useParams();
   const isEditMode = !!(mode === 'edit');
   const defaultFormValue = {
      poNo: '',
      poDate: new Date(),
      customerName: '',
      status: 'OPEN'
   };

   const {
      register, handleSubmit, setValue, watch, reset, resetField, getValues, control, formState: { errors },
   } = useForm({
      resolver: joiResolver(isEditMode ? updatePurchaseOrderValidationSchema : createPurchaseOrderValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: defaultFormValue
   });

   const { data: purchaseOrder = {} } = usePurchaseOrderById(poId);
   const { onSubmit, onError, createPurchaseOrderIsPending, updatePurchaseOrderIsPending } = useHandleSubmit({ poId, isEditMode });
   useFormInit({ purchaseOrder, isEditMode, reset, defaultFormValue });

   return (
      <>
         <div>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
               <Row>
                  <Col xl="12" lg="12">
                     <Card className="shadow-sm border bg-white">
                        <Card.Header className="d-flex justify-content-between bg-transparent py-3 px-4 border-bottom">
                           <div className="header-title">
                              <h5 className="mb-0 fw-bold text-dark">{`${isEditMode ? 'Update' : 'Create'}`} Purchase Order</h5>
                           </div>
                        </Card.Header>
                        <Card.Body className="p-4">
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
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Select id="status" isInvalid={!!errors.status} {...register("status")}>
                                       <option value="OPEN">OPEN</option>
                                       <option value="COMPLETED">COMPLETED</option>
                                       <option value="CANCELLED">CANCELLED</option>
                                    </Form.Select>
                                    <Form.Label htmlFor="status">Status</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.status?.message}</Form.Control.Feedback>
                                 </Form.Floating>
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

            {/* PO Associated Documents & Attachments */}
            {isEditMode && poId && (
               <Card className="mt-4 shadow-sm border bg-white">
                  <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                     <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                        Purchase Order Attachments & Quotations
                     </h6>
                     <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Upload vendor price quotations, signed PO copies, engineering specifications, or delivery schedules
                     </span>
                  </Card.Header>
                  <Card.Body className="p-4 pt-3.5">
                     <AttachmentManager
                        entityType="PURCHASE_ORDER"
                        entityId={poId}
                        docTypeOptions={PO_DOC_TYPES}
                        folder="ks-erp/purchase-orders/documents"
                     />
                  </Card.Body>
               </Card>
            )}
         </div >
      </>
   );
};

export default PurchaseOrderForm;