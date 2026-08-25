import React from 'react';
import { Row, Col, Form, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Flatpickr from "react-flatpickr";
import { Controller, useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { useGetInvoiceChallanById } from '../hooks/useApi';
import useHandleSubmit from '../hooks/useHandleSubmit';
import { createInvoiceChallanValidationSchema, updateInvoiceChallanValidationSchema } from '../../../validation/invoiceChallan.validation';
import SubmitButton from '../../../components/SubmitButton';
import { FaRegCalendarAlt } from 'react-icons/fa';
import useFormInit from '../hooks/useFormInit';
import AttachmentManager from '../../../components/attachments/AttachmentManager';

const CHALLAN_DOC_TYPES = [
   { value: 'SIGNED_CHALLAN', label: 'Signed Delivery Challan / Gate Pass' },
   { value: 'OTHER', label: 'General / Other Document' }
];

const InvoiceChallan = ({ mode }) => {
   const { id: challanId } = useParams();
   const isEditMode = !!(mode === 'edit');
   const defaultFormValue = {
      challanNo: '',
      challanDate: new Date(),
      customerName: '',
   };

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
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
               <Row>
                  <Col xl="12" lg="12">
                     <Card className="shadow-sm border bg-white">
                        <Card.Header className="d-flex justify-content-between bg-transparent py-3 px-4 border-bottom">
                           <div className="header-title">
                              <h5 className="mb-0 fw-bold text-dark">{`${isEditMode ? 'Update' : 'Create'}`} Delivery Challan</h5>
                           </div>
                        </Card.Header>
                        <Card.Body className="p-4">
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

            {/* Delivery Challan Attachments */}
            {isEditMode && challanId && (
               <Card className="mt-4 shadow-sm border bg-white">
                  <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                     <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                        Delivery Challan Documents & Receiver Proof
                     </h6>
                     <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Upload physical receiver-stamped challans, gate passes, or weighbridge slips
                     </span>
                  </Card.Header>
                  <Card.Body className="p-4 pt-3.5">
                     <AttachmentManager
                        entityType="CHALLAN"
                        entityId={challanId}
                        docTypeOptions={CHALLAN_DOC_TYPES}
                        folder="ks-erp/challans/documents"
                     />
                  </Card.Body>
               </Card>
            )}
         </div >
      </>
   );
};

export default InvoiceChallan;