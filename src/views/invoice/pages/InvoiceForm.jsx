import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Row, Col, Form, Card, FormCheck, Button, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Flatpickr from "react-flatpickr";
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import useHandleSubmit from '../hooks/useHandleSubmit';
import SubmitButton from '../../../components/SubmitButton';
import {
   FaRegCalendarAlt,
   FaTimes,
   FaFileAlt,
   FaShoppingCart,
   FaTruck,
   FaMoneyBillWave,
   FaArrowLeft,
   FaPlus,
   FaUndo,
   FaPercent,
   FaCoins,
   FaMapMarkerAlt,
   FaPaperclip,
   FaExternalLinkAlt,
   FaCopy
} from 'react-icons/fa';
import useFormInit from '../hooks/useFormInit';
import { invoiceValidationSchema } from '../../../validation/invoice.validation';
import { useInvoiceById } from '../hooks/useApi';
import { useCountryState, useGstSlab, usePaymentMode, usePaymentStatus, useProductUnit, useStateCity } from '../../dashboard/hooks/api.hooks';
import InvoiceItemsTable from '../components/InvoiceItemsTable';
import useInvoiceCalculation from '../hooks/useInvoiceCalculation';
import { ModuleSelectorModal } from '../components/ModuleSelectorModal';
import useAccountingDocumentModules from '../hooks/useAccountingDocumentModules';
import usePartyAddressSync from '../hooks/usePartyAddressSync';
import useInvoiceDates, { DUE_PRESET_DAYS } from '../hooks/useInvoiceDates';
import './invoice.scss';
import PartyAutocompleteInput from '../components/PartyAutocompleteInput';
import moment from 'moment';
import { numberToIndianRupeesWords } from '../../../utilities/numberToWords';
import { findDbStateByGstCode } from '../../../utilities/gstStateHelper';

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
   roundOffManual: false,
   other: 0,
   paymentStatusId: "",
   paymentModeId: ""
};

const InvoiceForm = ({ mode }) => {
   const { id: invoiceId } = useParams();
   const navigate = useNavigate();
   const isEditMode = !!(mode === 'edit');
   const isDuplicateMode = !!(mode === 'duplicate');

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

   // Watch primitive scalar values only to prevent infinite re-render loops
   const [
      selectedBillingState,
      selectedShippingState,
      hasChallan,
      hasPo,
      hasEwayBill,
      invoiceDate,
      customerName,
      hasGst,
      dueDays,
      watchedTotal,
      watchedSubTotal,
      watchedTaxableAmount,
      watchedCgst,
      watchedSgst,
      watchedIgst,
      watchedOther,
      watchedRoundOff,
      watchedDiscountAmount,
      roundOffManual
   ] = useWatch({
      control,
      name: [
         "billingAddress.stateId",
         "shippingAddress.stateId",
         "hasChallan",
         "hasPo",
         "hasEwayBill",
         "invoiceDate",
         "customerName",
         "hasGst",
         "dueDays",
         "total",
         "subTotal",
         "taxableAmount",
         "cgst",
         "sgst",
         "igst",
         "other",
         "roundOff",
         "discountAmount",
         "roundOffManual"
      ],
   });

   const { data: invoice = {} } = useInvoiceById(invoiceId);

   // Master Data Queries
   const { data: productUnit = [] } = useProductUnit();
   const { data: gstSlab = [] } = useGstSlab();
   const { data: billingStates = [] } = useCountryState();
   const { data: billingCities = [], isFetching: isFetchingBillingCities } = useStateCity(selectedBillingState);
   const { data: shippingStates = [] } = useCountryState();
   const { data: shippingCities = [], isFetching: isFetchingShippingCities } = useStateCity(selectedShippingState);
   const { data: paymentStatus = [] } = usePaymentStatus();
   const { data: paymentMode = [] } = usePaymentMode();

   // 1. Party Selection & Address Live Synchronization (with GST Code derivation & async city auto-fill)
   const { sameAsBilling, handleSameAsBillingChange, handlePartySelect } = usePartyAddressSync({
      setValue,
      getValues,
      control,
      billingStates,
      billingCities,
      shippingCities
   });

   // 2. Invoice Dates & Due Date Presets
   const { handleDuePresetClick, invoiceDateOptons, dueDateOptons } = useInvoiceDates({ invoiceDate, setValue });

   // 3. Reset Roundoff to Auto
   const handleResetRoundOffToAuto = () => {
      setValue("roundOffManual", false, { shouldDirty: true });
   };

   // 4. Form Lifecycle, Calculation & Submit
   const { onSubmit, onError, createInvoiceIsPending, updateInvoiceIsPending } = useHandleSubmit({ invoiceId, isEditMode });
   useFormInit({ invoice, mode, setValue, reset, control, defaultFormValue });
   const { lastEditedFieldRef, isInterState } = useInvoiceCalculation({
      control,
      setValue,
      getValues,
      companyStateId: invoice?.companyStateId || 27,
      statesList: billingStates
   });

   // 5. Linked Document Modules (Challan, PO, E-Way Bill)
   const { activeModule, moduleData, fetchModuleFun, openModule, closeModule, updateModuleData, submitModule, getDocumentLabel, activeSelectedIds, handleRemoveLinkedDoc, currentChallanIds, currentPoIds, currentEwayBillIds } = useAccountingDocumentModules({ invoiceId, setValue, control });

   // Amount in words
   const amountInWords = useMemo(() => {
      return numberToIndianRupeesWords(watchedTotal || 0);
   }, [watchedTotal]);

   return (
      <div>
         <FormProvider {...formMethods}>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
               <Row>
                  <Col xl="12" lg="12">
                     <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom py-3 flex-wrap gap-2">
                           <div className="header-title d-flex align-items-center gap-2">
                              <Button
                                 variant="outline-secondary"
                                 size="sm"
                                 className="btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center me-2"
                                 style={{ width: '32px', height: '32px' }}
                                 onClick={() => navigate('/sales/invoice')}
                                 title="Back to Invoices"
                              >
                                 <FaArrowLeft size={13} />
                              </Button>
                              <h4 className="card-title mb-0 fw-bold text-dark d-flex align-items-center gap-2 flex-wrap">
                                 {isEditMode ? (
                                    <>
                                       <span>Update Invoice</span>
                                       {invoice.invoiceNo && (
                                          <span className="text-muted fs-6 fw-normal">#{invoice.invoiceNo}</span>
                                       )}
                                    </>
                                 ) : isDuplicateMode ? (
                                    <>
                                       <span>Duplicate Invoice</span>
                                       {invoice.invoiceNo && (
                                          <Badge bg="soft-primary" className="text-primary border border-primary-subtle fs-7 fw-normal py-1 px-2">
                                             Cloned from #{invoice.invoiceNo}
                                          </Badge>
                                       )}
                                    </>
                                 ) : (
                                    'Create Invoice'
                                 )}
                              </h4>
                           </div>
                           <div className="d-flex align-items-center gap-2">
                              {isEditMode && invoiceId && (
                                 <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fw-medium shadow-none"
                                    style={{ fontSize: '0.82rem' }}
                                    onClick={() => navigate(`/sales/invoice/${invoiceId}/duplicate`)}
                                    title="Duplicate / Clone this invoice"
                                 >
                                    <FaCopy size={13} />
                                    <span>Duplicate Invoice</span>
                                 </Button>
                              )}
                              {isInterState ? (
                                 <Badge bg="info" className="px-3 py-2 fw-medium">
                                    🌐 Inter-State (IGST)
                                 </Badge>
                              ) : (
                                 <Badge bg="primary" className="px-3 py-2 fw-medium">
                                    📍 Intra-State (CGST + SGST)
                                 </Badge>
                              )}
                           </div>
                        </Card.Header>

                        <Card.Body className="p-4">
                           {/* SECTION 1: INVOICE MAIN DETAILS */}
                           <div className="row g-3">
                              {/* Left: Invoice No, Customer, GST, Linked Docs */}
                              <Col lg="6">
                                 <Row className="g-3">
                                    <Col lg="4">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="text"
                                             id="invoiceNo"
                                             placeholder="Invoice No"
                                             isInvalid={!!errors.invoiceNo}
                                             {...register("invoiceNo")}
                                          />
                                          <Form.Label htmlFor="invoiceNo">
                                             Invoice No <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors.invoiceNo?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="8">
                                       <PartyAutocompleteInput
                                          value={customerName || ''}
                                          onChange={(e) => setValue('customerName', e.target.value, { shouldValidate: true, shouldDirty: true })}
                                          onSelectParty={handlePartySelect}
                                          isInvalid={!!errors.customerName}
                                          errorMessage={errors.customerName?.message}
                                          placeholder="Search party by name or code..."
                                          label="Customer Name"
                                          required
                                       />
                                    </Col>

                                    {/* GST Row */}
                                    <Col lg="4" className="d-flex align-items-center">
                                       <FormCheck className="form-check-inline mb-0">
                                          <FormCheck.Input
                                             type="checkbox"
                                             id="hasGst"
                                             isInvalid={!!errors.hasGst}
                                             {...register("hasGst", {
                                                onChange: (e) => {
                                                   setValue("hasGst", e.target.checked, { shouldValidate: true });
                                                }
                                             })}
                                          />
                                          <FormCheck.Label className="form-check-label ps-1 fw-medium" htmlFor="hasGst">
                                             GST Available
                                          </FormCheck.Label>
                                       </FormCheck>
                                    </Col>

                                    <Col lg="8">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="text"
                                             id="gstNumber"
                                             placeholder="GSTIN No."
                                             disabled={!hasGst}
                                             maxLength={15}
                                             className="text-uppercase font-monospace"
                                             isInvalid={!!errors.gstNumber}
                                             {...register("gstNumber", {
                                                onChange: (e) => {
                                                   const upper = (e.target.value || "").toUpperCase();
                                                   setValue("gstNumber", upper, { shouldValidate: true, shouldDirty: true });
                                                   if (upper.length >= 2) {
                                                      const stateCode = upper.substring(0, 2);
                                                      const dbState = findDbStateByGstCode(stateCode, billingStates);
                                                      if (dbState?.id) {
                                                         const dbStateId = Number(dbState.id);
                                                         setValue("billingAddress.stateId", dbStateId, { shouldValidate: true, shouldDirty: true });
                                                         if (sameAsBilling) {
                                                            setValue("shippingAddress.stateId", dbStateId, { shouldValidate: false, shouldDirty: true });
                                                         }
                                                      }
                                                   }
                                                }
                                             })}
                                          />
                                          <Form.Label htmlFor="gstNumber">
                                             GSTIN No. {hasGst && <span className="text-danger">*</span>}
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors.gstNumber?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    {/* Reference Documents (Clean Pill Dock) */}
                                    <Col lg="12">
                                       <div className="doc-pill-dock">
                                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                             <div className="d-flex align-items-center gap-2">
                                                <div className="rounded d-flex align-items-center justify-content-center bg-primary text-white" style={{ width: '22px', height: '22px' }}>
                                                   <FaPaperclip size={11} />
                                                </div>
                                                <span className="fw-bold text-dark small" style={{ fontSize: '0.82rem' }}>Attach Reference Documents</span>
                                             </div>
                                             <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                                                Click any button to attach or manage documents
                                             </small>
                                          </div>

                                          {/* Interactive Quick-Action Document Pills */}
                                          <div className="d-flex flex-wrap align-items-center gap-2">
                                             {/* Challan Pill */}
                                             <div
                                                className={`doc-pill-btn ${currentChallanIds.length > 0 ? 'active-challan' : ''}`}
                                                onClick={() => {
                                                   openModule('challan');
                                                }}
                                                title="Click to select or manage Challans"
                                             >
                                                <FaFileAlt size={13} className={currentChallanIds.length > 0 ? "text-primary" : "text-secondary"} />
                                                <span>Challan</span>
                                                {currentChallanIds.length > 0 ? (
                                                   <span className="badge bg-primary text-white pill-badge">
                                                      {currentChallanIds.length} Linked
                                                   </span>
                                                ) : (
                                                   <span className="badge bg-light text-muted border pill-badge">
                                                      + Add
                                                   </span>
                                                )}
                                             </div>

                                             {/* Purchase Order Pill */}
                                             <div
                                                className={`doc-pill-btn ${currentPoIds.length > 0 ? 'active-po' : ''}`}
                                                onClick={() => {
                                                   openModule('purchaseOrder');
                                                }}
                                                title="Click to select or manage Purchase Orders"
                                             >
                                                <FaShoppingCart size={13} className={currentPoIds.length > 0 ? "text-success" : "text-secondary"} />
                                                <span>Purchase Order</span>
                                                {currentPoIds.length > 0 ? (
                                                   <span className="badge bg-success text-white pill-badge">
                                                      {currentPoIds.length} Linked
                                                   </span>
                                                ) : (
                                                   <span className="badge bg-light text-muted border pill-badge">
                                                      + Add
                                                   </span>
                                                )}
                                             </div>

                                             {/* E-Way Bill Pill */}
                                             <div
                                                className={`doc-pill-btn ${currentEwayBillIds.length > 0 ? 'active-eway' : ''}`}
                                                onClick={() => {
                                                   openModule('ewayBill');
                                                }}
                                                title="Click to select or manage E-Way Bills"
                                             >
                                                <FaTruck size={13} className={currentEwayBillIds.length > 0 ? "text-rose" : "text-secondary"} />
                                                <span>E-Way Bill</span>
                                                {currentEwayBillIds.length > 0 ? (
                                                   <span className="badge bg-rose text-white pill-badge">
                                                      {currentEwayBillIds.length} Linked
                                                   </span>
                                                ) : (
                                                   <span className="badge bg-light text-muted border pill-badge">
                                                      + Add
                                                   </span>
                                                )}
                                             </div>
                                          </div>

                                          {/* Attached Documents Tag Tray */}
                                          {(currentChallanIds.length > 0 || currentPoIds.length > 0 || currentEwayBillIds.length > 0) && (
                                             <div className="d-flex flex-wrap align-items-center gap-1 mt-2 pt-2 border-top border-light-subtle">
                                                <span className="text-muted fw-semibold me-1" style={{ fontSize: '0.74rem' }}>Linked:</span>
                                                {currentChallanIds.map(id => (
                                                   <span key={`ch-${id}`} className="badge bg-white text-primary border border-primary-subtle document-badge-chip">
                                                      <FaFileAlt size={10} /> {getDocumentLabel ? getDocumentLabel('challan', id) : 'Challan'}
                                                      <FaTimes size={10} className="chip-close ms-1" onClick={(e) => { e.stopPropagation(); handleRemoveLinkedDoc('challan', id); }} />
                                                   </span>
                                                ))}
                                                {currentPoIds.map(id => (
                                                   <span key={`po-${id}`} className="badge bg-white text-success border border-success-subtle document-badge-chip">
                                                      <FaShoppingCart size={10} /> {getDocumentLabel ? getDocumentLabel('purchaseOrder', id) : 'Purchase Order'}
                                                      <FaTimes size={10} className="chip-close ms-1" onClick={(e) => { e.stopPropagation(); handleRemoveLinkedDoc('purchaseOrder', id); }} />
                                                   </span>
                                                ))}
                                                {currentEwayBillIds.map(id => (
                                                   <span key={`ewb-${id}`} className="badge bg-white text-rose border border-rose-subtle document-badge-chip">
                                                      <FaTruck size={10} className="text-rose" /> {getDocumentLabel ? getDocumentLabel('ewayBill', id) : 'E-Way Bill'}
                                                      <FaTimes size={10} className="chip-close ms-1" onClick={(e) => { e.stopPropagation(); handleRemoveLinkedDoc('ewayBill', id); }} />
                                                   </span>
                                                ))}
                                             </div>
                                          )}
                                       </div>
                                    </Col>
                                 </Row>
                              </Col>

                              {/* Right: Dates, Payment Status, Payment Mode, Due Presets */}
                              <Col lg="6">
                                 <Row className="g-3">
                                    <Col lg="6">
                                       <Form.Group className="form-group mb-0">
                                          <Form.Label htmlFor="invoiceDate" className="fw-medium small mb-1">
                                             Invoice Date <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Controller
                                             name="invoiceDate"
                                             control={control}
                                             defaultValue={new Date()}
                                             render={({ field, fieldState: { error } }) => (
                                                <div className="input-group">
                                                   <span className="input-group-text bg-light">
                                                      <FaRegCalendarAlt />
                                                   </span>
                                                   <Flatpickr
                                                      {...field}
                                                      value={field.value}
                                                      onChange={(selectedDates) => {
                                                         const date = selectedDates[0] || null;
                                                         field.onChange(date);
                                                         const days = getValues("dueDays") ?? 0;
                                                         if (date) {
                                                            setValue(
                                                               "dueDate",
                                                               moment(date).add(days, "days").toDate(),
                                                               { shouldDirty: true, shouldValidate: true }
                                                            );
                                                         }
                                                      }}
                                                      options={invoiceDateOptons}
                                                      className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                      placeholder="Select Invoice Date..."
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
                                       <Form.Group className="form-group mb-0">
                                          <Form.Label htmlFor="dueDate" className="fw-medium small mb-1">
                                             Due Date <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Controller
                                             name="dueDate"
                                             control={control}
                                             defaultValue={new Date()}
                                             render={({ field, fieldState: { error } }) => (
                                                <div className="input-group">
                                                   <span className="input-group-text bg-light">
                                                      <FaRegCalendarAlt />
                                                   </span>
                                                   <Flatpickr
                                                      {...field}
                                                      value={field.value}
                                                      onChange={(selectedDates) => {
                                                         const date = selectedDates[0];
                                                         field.onChange(date);
                                                         if (invoiceDate && date) {
                                                            const days = moment(date)
                                                               .startOf("day")
                                                               .diff(moment(invoiceDate).startOf("day"), "days");
                                                            setValue("dueDays", Math.max(0, days), {
                                                               shouldDirty: true,
                                                               shouldValidate: true,
                                                            });
                                                         }
                                                      }}
                                                      options={dueDateOptons}
                                                      className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                      placeholder="Select Due Date..."
                                                   />
                                                   <Form.Control.Feedback type="invalid">
                                                      {errors.dueDate?.message}
                                                   </Form.Control.Feedback>
                                                </div>
                                             )}
                                          />
                                       </Form.Group>
                                    </Col>

                                    {/* Due Days & Preset Chips */}
                                    <Col lg="12">
                                       <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 bg-light rounded border">
                                          <div className="d-flex align-items-center gap-2">
                                             <span className="fw-semibold small text-secondary">Due Days:</span>
                                             <Form.Control
                                                type="number"
                                                id="dueDays"
                                                min={0}
                                                step={1}
                                                style={{ width: '80px' }}
                                                className="text-center form-control-sm"
                                                isInvalid={!!errors.dueDays}
                                                {...register("dueDays", {
                                                   onChange: ({ target }) => {
                                                      const days = Math.max(0, target.valueAsNumber || 0);
                                                      setValue("dueDays", days, { shouldValidate: true });
                                                      if (invoiceDate) {
                                                         setValue(
                                                            "dueDate",
                                                            moment(invoiceDate).add(days, "days").toDate(),
                                                            { shouldDirty: true, shouldValidate: true }
                                                         );
                                                      }
                                                   },
                                                })}
                                             />
                                          </div>

                                          {/* Presets */}
                                          <div className="d-flex flex-wrap gap-1">
                                             {DUE_PRESET_DAYS.map((days) => {
                                                const isActive = Number(dueDays) === days;
                                                return (
                                                   <span
                                                      key={days}
                                                      className={`badge due-preset-badge ${isActive ? 'bg-primary text-white' : 'bg-white text-secondary border'}`}
                                                      onClick={() => handleDuePresetClick(days)}
                                                   >
                                                      {days === 0 ? "Immediate" : `${days}d`}
                                                   </span>
                                                );
                                             })}
                                          </div>
                                       </div>
                                    </Col>

                                    <Col lg="6">
                                       <Form.Group className="form-group mb-0">
                                          <Form.Label htmlFor="paymentStatusId" className="fw-medium small mb-1">
                                             Payment Status <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Form.Select
                                             name="paymentStatusId"
                                             id="paymentStatusId"
                                             isInvalid={!!errors.paymentStatusId}
                                             {...register("paymentStatusId")}
                                          >
                                             <option value="">-- Select Status --</option>
                                             {paymentStatus.map((item) => (
                                                <option key={item.id} value={item.id}>{item.label}</option>
                                             ))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors.paymentStatusId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>

                                    <Col lg="6">
                                       <Form.Group className="form-group mb-0">
                                          <Form.Label htmlFor="paymentModeId" className="fw-medium small mb-1">
                                             Payment Mode <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Form.Select
                                             name="paymentModeId"
                                             id="paymentModeId"
                                             isInvalid={!!errors.paymentModeId}
                                             {...register("paymentModeId")}
                                          >
                                             <option value="">-- Select Mode --</option>
                                             {paymentMode.map((item) => (
                                                <option key={item.id} value={item.id}>{item.label}</option>
                                             ))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors.paymentModeId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>
                                 </Row>
                              </Col>
                           </div>

                           <hr className="my-4 border-light-subtle" />

                           {/* SECTION 2: BILLING & SHIPPING ADDRESSES (WITH PROPER MARGINS & OVERLAP FIX) */}
                           <Row className="g-4">
                              {/* Billing Address */}
                              <Col lg="6">
                                 <div className="address-section-header">
                                    <div className="d-flex align-items-center gap-2">
                                       <FaMapMarkerAlt className="text-primary" />
                                       <h6 className="fw-bold text-dark mb-0">Billing Address</h6>
                                    </div>
                                    <span className="badge bg-light text-secondary border">Buyer Information</span>
                                 </div>
                                 <Row className="g-3">
                                    <Col lg="12">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             as="textarea"
                                             placeholder="Billing Address"
                                             style={{ height: '95px' }}
                                             isInvalid={!!errors?.billingAddress?.addressLine1}
                                             {...register("billingAddress.addressLine1")}
                                          />
                                          <Form.Label htmlFor="billingAddress.addressLine1">
                                             Billing Address <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.billingAddress?.addressLine1?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="6">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="text"
                                             placeholder="Phone, Landline or 1800 No."
                                             isInvalid={!!errors?.billingAddress?.phoneNumber}
                                             maxLength={15}
                                             {...register("billingAddress.phoneNumber", {
                                                onChange: (e) => {
                                                   const onlyNumbers = e.target.value.replace(/\D/g, "");
                                                   setValue("billingAddress.phoneNumber", onlyNumbers, { shouldValidate: true });
                                                }
                                             })}
                                          />
                                          <Form.Label htmlFor="billingAddress.phoneNumber">
                                             Phone Number
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.billingAddress?.phoneNumber?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="6">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="email"
                                             placeholder="Billing Email"
                                             isInvalid={!!errors?.billingAddress?.email}
                                             {...register("billingAddress.email")}
                                          />
                                          <Form.Label htmlFor="billingAddress.email">Email Address</Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.billingAddress?.email?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="4">
                                       <Form.Group className="form-group mb-0">
                                          <Form.Select
                                             isInvalid={!!errors?.billingAddress?.stateId}
                                             {...register("billingAddress.stateId")}
                                          >
                                             <option value="">-- State --</option>
                                             {billingStates.map((state) => (
                                                <option key={state.id} value={state.id}>{state.name}</option>
                                             ))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors?.billingAddress?.stateId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>

                                    <Col lg="4">
                                       <Form.Group className="form-group mb-0">
                                          <Form.Select
                                             disabled={!selectedBillingState || isFetchingBillingCities}
                                             isInvalid={!!errors?.billingAddress?.cityId}
                                             {...register("billingAddress.cityId")}
                                          >
                                             <option value="">{isFetchingBillingCities ? "Loading..." : "-- City --"}</option>
                                             {billingCities.map((city) => (
                                                <option key={city.id} value={city.id}>{city.name}</option>
                                             ))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors?.billingAddress?.cityId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>

                                    <Col lg="4">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="text"
                                             placeholder="Pincode"
                                             isInvalid={!!errors?.billingAddress?.pincode}
                                             maxLength={6}
                                             {...register("billingAddress.pincode")}
                                          />
                                          <Form.Label htmlFor="billingAddress.pincode">
                                             Pincode <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.billingAddress?.pincode?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>
                                 </Row>
                              </Col>

                              {/* Shipping Address */}
                              <Col lg="6">
                                 <div className="address-section-header">
                                    <div className="d-flex align-items-center gap-2">
                                       <FaTruck className="text-primary" />
                                       <h6 className="fw-bold text-dark mb-0">Shipping Address</h6>
                                    </div>
                                    <FormCheck
                                       type="switch"
                                       id="sameAsBillingSwitch"
                                       label="Same as Billing"
                                       className="small fw-semibold cursor-pointer text-primary"
                                       checked={sameAsBilling}
                                       onChange={(e) => handleSameAsBillingChange(e.target.checked)}
                                    />
                                 </div>
                                 <Row className="g-3">
                                    <Col lg="12">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             as="textarea"
                                             placeholder="Shipping Address"
                                             style={{ height: '95px' }}
                                             disabled={sameAsBilling}
                                             isInvalid={!!errors?.shippingAddress?.addressLine1}
                                             {...register("shippingAddress.addressLine1")}
                                          />
                                          <Form.Label htmlFor="shippingAddress.addressLine1">
                                             Shipping Address <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.addressLine1?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="6">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="text"
                                             placeholder="Shipping Phone Number"
                                             disabled={sameAsBilling}
                                             isInvalid={!!errors?.shippingAddress?.phoneNumber}
                                             maxLength={15}
                                             {...register("shippingAddress.phoneNumber", {
                                                onChange: (e) => {
                                                   const onlyNumbers = e.target.value.replace(/\D/g, "");
                                                   setValue("shippingAddress.phoneNumber", onlyNumbers, { shouldValidate: true });
                                                }
                                             })}
                                          />
                                          <Form.Label htmlFor="shippingAddress.phoneNumber">
                                             Phone Number
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.phoneNumber?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="6">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="email"
                                             placeholder="Shipping Email"
                                             disabled={sameAsBilling}
                                             isInvalid={!!errors?.shippingAddress?.email}
                                             {...register("shippingAddress.email")}
                                          />
                                          <Form.Label htmlFor="shippingAddress.email">Email Address</Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.email?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="4">
                                       <Form.Group className="form-group mb-0">
                                          <Form.Select
                                             disabled={sameAsBilling}
                                             isInvalid={!!errors?.shippingAddress?.stateId}
                                             {...register("shippingAddress.stateId")}
                                          >
                                             <option value="">-- State --</option>
                                             {shippingStates.map((state) => (
                                                <option key={state.id} value={state.id}>{state.name}</option>
                                             ))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.stateId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>

                                    <Col lg="4">
                                       <Form.Group className="form-group mb-0">
                                          <Form.Select
                                             disabled={sameAsBilling || !selectedShippingState || isFetchingShippingCities}
                                             isInvalid={!!errors?.shippingAddress?.cityId}
                                             {...register("shippingAddress.cityId")}
                                          >
                                             <option value="">{isFetchingShippingCities ? "Loading..." : "-- City --"}</option>
                                             {shippingCities.map((city) => (
                                                <option key={city.id} value={city.id}>{city.name}</option>
                                             ))}
                                          </Form.Select>
                                          <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.cityId?.message}</Form.Control.Feedback>
                                       </Form.Group>
                                    </Col>

                                    <Col lg="4">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="text"
                                             placeholder="Pincode"
                                             disabled={sameAsBilling}
                                             isInvalid={!!errors?.shippingAddress?.pincode}
                                             maxLength={6}
                                             {...register("shippingAddress.pincode")}
                                          />
                                          <Form.Label htmlFor="shippingAddress.pincode">
                                             Pincode <span className="text-danger">*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.pincode?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>
                                 </Row>
                              </Col>
                           </Row>

                           <hr className="my-4 border-light-subtle" />

                           {/* SECTION 3: LINE ITEMS TABLE */}
                           <div className="mb-4">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                 <h5 className="fw-bold text-dark mb-0">Invoice Line Items</h5>
                                 <small className="text-muted">Rates and taxes calculate automatically</small>
                              </div>
                              <InvoiceItemsTable
                                 productUnit={productUnit}
                                 gstSlab={gstSlab}
                                 lastEditedFieldRef={lastEditedFieldRef}
                              />
                           </div>

                           {/* SECTION 4: INVOICE SUMMARY & TOTALS */}
                           <Row className="g-4 mt-2">
                              {/* Left Column: Enhanced Discounts, Additional Charges & Amount in Words */}
                              <Col lg="6">
                                 <div className="charges-adjustments-card">
                                    <div className="charges-header">
                                       <div className="d-flex align-items-center gap-2">
                                          <FaPercent className="text-primary" />
                                          <span className="fw-bold text-dark">Discounts & Financial Adjustments</span>
                                       </div>
                                       <Badge bg="light" text="secondary" className="border">Bill Adjustments</Badge>
                                    </div>

                                    <Row className="g-3">
                                       {/* Discount Amount Input */}
                                       <Col lg="6">
                                          <Form.Group className="form-group mb-0">
                                             <Form.Label className="fw-semibold small text-secondary d-flex justify-content-between mb-1">
                                                <span>Discount (₹)</span>
                                                <span className="text-muted small">Deducted from taxable</span>
                                             </Form.Label>
                                             <div className="input-group">
                                                <span className="input-group-text bg-light text-muted fw-semibold">₹</span>
                                                <Form.Control
                                                   type="number"
                                                   step="0.01"
                                                   id="discountAmount"
                                                   placeholder="0.00"
                                                   className="text-end fw-semibold"
                                                   isInvalid={!!errors.discountAmount}
                                                   {...register("discountAmount", {
                                                      onBlur: (e) => {
                                                         const val = e.target.value;
                                                         if (val !== '' && val !== null && val !== undefined && !Number.isNaN(Number(val))) {
                                                            setValue("discountAmount", Number(val).toFixed(2), { shouldValidate: true });
                                                         }
                                                      }
                                                   })}
                                                />
                                             </div>
                                             <Form.Control.Feedback type="invalid" className="d-block">{errors.discountAmount?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>

                                       {/* Other Charges Input */}
                                       <Col lg="6">
                                          <Form.Group className="form-group mb-0">
                                             <Form.Label className="fw-semibold small text-secondary d-flex justify-content-between mb-1">
                                                <span>Other Charges (₹)</span>
                                                <span className="text-muted small">Freight / packaging</span>
                                             </Form.Label>
                                             <div className="input-group">
                                                <span className="input-group-text bg-light text-muted fw-semibold">+ ₹</span>
                                                <Form.Control
                                                   type="number"
                                                   step="0.01"
                                                   id="other"
                                                   placeholder="0.00"
                                                   className="text-end fw-semibold"
                                                   isInvalid={!!errors.other}
                                                   {...register("other", {
                                                      onBlur: (e) => {
                                                         const val = e.target.value;
                                                         if (val !== '' && val !== null && val !== undefined && !Number.isNaN(Number(val))) {
                                                            setValue("other", Number(val).toFixed(2), { shouldValidate: true });
                                                         }
                                                      }
                                                   })}
                                                />
                                             </div>
                                             <Form.Control.Feedback type="invalid" className="d-block">{errors.other?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>

                                       {/* Round Off Input & Auto/Manual Controller */}
                                       <Col lg="12">
                                          <Form.Group className="form-group mb-0">
                                             <div className="d-flex justify-content-between align-items-center mb-1">
                                                <Form.Label className="fw-semibold small text-secondary mb-0">
                                                   Round Off Adjustment (₹)
                                                </Form.Label>
                                                {roundOffManual ? (
                                                   <Button
                                                      variant="link"
                                                      size="sm"
                                                      className="p-0 text-decoration-none text-primary small d-flex align-items-center gap-1"
                                                      onClick={handleResetRoundOffToAuto}
                                                      title="Recalculate round off automatically"
                                                   >
                                                      <FaUndo size={10} /> Reset to Auto
                                                   </Button>
                                                ) : (
                                                   <span className="badge bg-success-subtle text-success small py-1 px-2 border border-success-subtle">
                                                      Auto-Calculated
                                                   </span>
                                                )}
                                             </div>
                                             <div className="input-group">
                                                <span className="input-group-text bg-light text-muted fw-semibold">± ₹</span>
                                                <Form.Control
                                                   type="number"
                                                   step="0.01"
                                                   id="roundOff"
                                                   placeholder="0.00"
                                                   className={`text-end fw-semibold ${roundOffManual ? 'border-primary bg-primary-subtle bg-opacity-10' : ''}`}
                                                   isInvalid={!!errors.roundOff}
                                                   {...register("roundOff", {
                                                      onChange: () => setValue("roundOffManual", true),
                                                      onBlur: (e) => {
                                                         const val = e.target.value;
                                                         if (val !== '' && val !== null && val !== undefined && !Number.isNaN(Number(val))) {
                                                            setValue("roundOff", Number(val).toFixed(2), { shouldValidate: true });
                                                         }
                                                      }
                                                   })}
                                                />
                                             </div>
                                             <Form.Control.Feedback type="invalid" className="d-block">{errors.roundOff?.message}</Form.Control.Feedback>
                                          </Form.Group>
                                       </Col>
                                    </Row>
                                 </div>

                                 {/* Amount in Words Card */}
                                 <div className="amount-in-words-box">
                                    <div className="words-label d-flex align-items-center gap-1">
                                       <FaMoneyBillWave size={12} className="text-primary" /> Amount in Words
                                    </div>
                                    <div className="words-text">{amountInWords}</div>
                                 </div>
                              </Col>

                              {/* Right Column: Structured ERP Accounting Summary Card */}
                              <Col lg="6">
                                 <div className="invoice-summary-card">
                                    <div className="summary-header">
                                       <span>Invoice Breakdown</span>
                                       {isInterState ? (
                                          <Badge bg="info-subtle" text="info" className="border border-info-subtle">
                                             IGST Applicable
                                          </Badge>
                                       ) : (
                                          <Badge bg="primary-subtle" text="primary" className="border border-primary-subtle">
                                             CGST + SGST Applicable
                                          </Badge>
                                       )}
                                    </div>

                                    {/* Sub Total */}
                                    <div className="summary-row">
                                       <span className="label">Sub Total</span>
                                       <span className="value">₹ {Number(watchedSubTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {/* Discount */}
                                    {Number(watchedDiscountAmount || 0) > 0 && (
                                       <div className="summary-row text-danger">
                                          <span className="label">Discount</span>
                                          <span className="value">- ₹ {Number(watchedDiscountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                       </div>
                                    )}

                                    {/* Taxable Amount */}
                                    <div className="summary-row highlight">
                                       <span className="label">Taxable Amount</span>
                                       <span className="value">₹ {Number(watchedTaxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {/* Taxes: Intra vs Inter */}
                                    {!isInterState ? (
                                       <>
                                          <div className="summary-row">
                                             <span className="label">CGST</span>
                                             <span className="value">+ ₹ {Number(watchedCgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                          <div className="summary-row">
                                             <span className="label">SGST</span>
                                             <span className="value">+ ₹ {Number(watchedSgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                       </>
                                    ) : (
                                       <div className="summary-row">
                                          <span className="label">IGST</span>
                                          <span className="value">+ ₹ {Number(watchedIgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                       </div>
                                    )}

                                    {/* Other Charges */}
                                    {Number(watchedOther || 0) > 0 && (
                                       <div className="summary-row">
                                          <span className="label">Other Charges</span>
                                          <span className="value">+ ₹ {Number(watchedOther || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                       </div>
                                    )}

                                    {/* Round Off */}
                                    <div className="summary-row">
                                       <span className="label">Round Off</span>
                                       <span className="value">
                                          {Number(watchedRoundOff || 0) >= 0 ? '+ ' : '- '}
                                          ₹ {Math.abs(Number(watchedRoundOff || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                       </span>
                                    </div>

                                    {/* Grand Total Banner */}
                                    <div className="grand-total-banner">
                                       <div className="total-title">Total Payable</div>
                                       <div className="total-amount">
                                          ₹ {Number(watchedTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </div>
                                    </div>
                                 </div>
                              </Col>
                           </Row>

                           {/* FORM ACTION BUTTONS */}
                           <div className="d-flex justify-content-end align-items-center gap-3 mt-4 pt-3 border-top">
                              <Button
                                 variant="outline-secondary"
                                 className="px-4 py-2 fw-medium"
                                 onClick={() => navigate('/sales/invoice')}
                              >
                                 Cancel
                              </Button>

                              <SubmitButton
                                 isLoading={createInvoiceIsPending || updateInvoiceIsPending}
                                 isEditMode={isEditMode}
                              />
                           </div>
                        </Card.Body>
                     </Card>
                  </Col>
               </Row>
            </Form>

            {/* Conditional Module Selector Modal */}
            {activeModule && (
               <ModuleSelectorModal
                  moduleKey={activeModule}
                  invoiceId={invoiceId}
                  show={!!activeModule}
                  selectedIds={activeSelectedIds}
                  fetchModuleFun={fetchModuleFun}
                  onClose={closeModule}
                  moduleData={moduleData}
                  updateModuleData={updateModuleData}
                  onSubmit={submitModule}
               />
            )}
         </FormProvider>
      </div>
   );
};

export default InvoiceForm;