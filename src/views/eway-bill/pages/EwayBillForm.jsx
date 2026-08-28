import React from 'react';
import { Row, Col, Form, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Flatpickr from "react-flatpickr";
import { Controller, useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { useEwayBillById } from '../hooks/useApi';
import useHandleSubmit from '../hooks/useHandleSubmit';
import SubmitButton from '../../../components/SubmitButton';
import { FaRegCalendarAlt } from 'react-icons/fa';
import useFormInit from '../hooks/useFormInit';
import { createEWayBillValidationSchema, updateEWayBillValidationSchema } from '../../../validation/ewayBill.validation';
import AttachmentManager from '../../../components/attachments/AttachmentManager';

const EWAY_BILL_DOC_TYPES = [
   { value: 'EWAY_BILL_PDF', label: 'E-Way Bill Document (PDF)' },
   { value: 'OTHER', label: 'General / Other Document' }
];

const EwayBillForm = ({ mode }) => {
   const { id: ewayBillId } = useParams();
   const isEditMode = !!(mode === 'edit');
   const defaultFormValue = {
      ewayBillNo: '',
      ewayBillDate: new Date(),
      ewaybillValidUpto: new Date(),
      customerName: '',
   };

   const {
      register, handleSubmit, setValue, reset, getValues, control, formState: { errors },
   } = useForm({
      resolver: joiResolver(isEditMode ? updateEWayBillValidationSchema : createEWayBillValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         invoiceId: null,
         ...defaultFormValue
      }
   });

   const { data: ewayBill = {} } = useEwayBillById(ewayBillId);
   const { onSubmit, onError, createEwayBillIsPending, updateEwayBillIsPending } = useHandleSubmit({ ewayBillId, isEditMode });
   useFormInit({ ewayBill, isEditMode, reset, defaultFormValue });

   return (
      <>
         <div>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
               <Row>
                  <Col xl="12" lg="12">
                     <Card className="shadow-sm border bg-white">
                        <Card.Header className="d-flex justify-content-between bg-transparent py-3 px-4 border-bottom">
                           <div className="header-title">
                              <h5 className="mb-0 fw-bold text-dark">{`${isEditMode ? 'Update' : 'Create'}`} E-Way Bill</h5>
                           </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                           <div className="row">
                              <Col lg="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control type="text" id='ewayBillNo' placeholder="E-way bill No" isInvalid={!!errors.ewayBillNo} {...register("ewayBillNo")} />
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
                                       defaultValue={new Date()}
                                       render={({ field, fieldState: { error } }) => (
                                          <div className="input-group">
                                             <span className="input-group-text">
                                                <FaRegCalendarAlt />
                                             </span>
                                             <Flatpickr
                                                {...field}
                                                value={field.value}
                                                onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
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
                                       defaultValue={new Date()}
                                       render={({ field, fieldState: { error } }) => (
                                          <div className="input-group">
                                             <span className="input-group-text">
                                                <FaRegCalendarAlt />
                                             </span>
                                             <Flatpickr
                                                {...field}
                                                value={field.value}
                                                onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
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
                           </div>

                           <SubmitButton
                              isLoading={createEwayBillIsPending || updateEwayBillIsPending}
                              isEditMode={isEditMode}
                           />
                        </Card.Body>
                     </Card>
                  </Col>
               </Row>
            </Form>

            {/* E-Way Bill Attachments */}
            {isEditMode && ewayBillId && (
               <Card className="mt-4 shadow-sm border bg-white">
                  <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                     <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                        E-Way Bill Documents & Transporter Proofs
                     </h6>
                     <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Upload official NIC E-Way Bill PDFs, transporter LR receipts, or vehicle trip documents
                     </span>
                  </Card.Header>
                  <Card.Body className="p-4 pt-3.5">
                     <AttachmentManager
                        entityType="EWAY_BILL"
                        entityId={ewayBillId}
                        docTypeOptions={EWAY_BILL_DOC_TYPES}
                        folder="ks-erp/eway-bills/documents"
                     />
                  </Card.Body>
               </Card>
            )}
         </div >
      </>
   );
};

export default EwayBillForm;