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
   FaCopy,
   FaBan
} from 'react-icons/fa';
import { Ban } from 'lucide-react';
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
import usePartyBranchLoader from '../hooks/usePartyBranchLoader';
import { FaBuilding, FaCheckCircle, FaLock } from 'react-icons/fa';

const defaultFormValue = {
   invoiceNo: "",
   invoiceDate: new Date(),
   dueDays: 0,
   dueDate: new Date(),
   customerName: "",
   partyId: null,
   branchId: null,
   hasGst: false,
   gstNumber: "",
   billingAddress: {
      branchName: "",
      gstin: "",
      email: "",
      phoneNumber: "",
      website: "",
      addressLine1: "",
      cityId: null,
      stateId: null,
      pincode: null
   },
   shippingAddress: {
      branchName: "",
      gstin: "",
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

   const handleBack = () => {
      if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
         navigate(-1);
      } else if (window.history.length > 1) {
         navigate(-1);
      } else {
         navigate('/sales/invoice');
      }
   };

   const formMethods = useForm({
      resolver: joiResolver(invoiceValidationSchema(isEditMode)),
      shouldUnregister: false,
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         ...defaultFormValue
      }
   });

   const { register, handleSubmit, setValue, reset, getValues, control, formState: { errors }, clearErrors } = formMethods;

   // Watch primitive scalar values only to prevent infinite re-render loops
   const [
      selectedBillingState,
      selectedShippingState,
      billingBranchName,
      hasChallan,
      hasPo,
      hasEwayBill,
      invoiceDate,
      customerName,
      hasGst,
      dueDays,
      dueDate,
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
         "billingAddress.branchName",
         "hasChallan",
         "hasPo",
         "hasEwayBill",
         "invoiceDate",
         "customerName",
         "hasGst",
         "dueDays",
         "dueDate",
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

   // 1. Party Selection & Address Live Synchronization (with Multi-Branch & GST code derivation)
   const {
      sameAsBilling,
      handleSameAsBillingChange,
      handlePartySelect,
      partyBranches,
      setPartyBranches,
      selectedBillingBranchId,
      setSelectedBillingBranchId,
      selectedShippingBranchId,
      shippingMode,
      handleShippingModeChange,
      handleSelectBillingBranch,
      handleSelectShippingBranch,
      handleClearParty,
      handleDetachParty,
      resolveAndApplyShippingMode,
      setSelectedParty
   } = usePartyAddressSync({
      setValue,
      getValues,
      control,
      clearErrors,
      billingStates,
      billingCities,
      shippingCities,
      isEditMode: isEditMode || isDuplicateMode
   });

   // 2. Hydrate Party Branches & Facility Selection in Edit / Duplicate Mode
   usePartyBranchLoader({
      invoice,
      setSelectedParty,
      setPartyBranches,
      setSelectedBillingBranchId,
      resolveAndApplyShippingMode
   });

   // 3. Invoice Dates & Due Date Presets
   const { handleDuePresetClick, invoiceDateOptons, dueDateOptons } = useInvoiceDates({ invoiceDate, setValue });

   // 4. Reset Roundoff to Auto
   const handleResetRoundOffToAuto = () => {
      setValue("roundOffManual", false, { shouldDirty: true });
   };

   // 5. Form Lifecycle, Calculation & Submit
   const { onSubmit, onError, createInvoiceIsPending, updateInvoiceIsPending } = useHandleSubmit({ invoiceId, isEditMode });
   useFormInit({ invoice, mode, setValue, reset, control, defaultFormValue });
   const { lastEditedFieldRef, isInterState, placeOfSupplyCode } = useInvoiceCalculation({
      control,
      setValue,
      getValues,
      companyGstin: invoice?.firm_gstin || invoice?.companyGstin,
      companyStateId: invoice?.companyStateId || 12,
      supplierGstCode: invoice?.firm_gstin ? invoice.firm_gstin.substring(0, 2) : "27",
      statesList: billingStates
   });

   // 5. Linked Document Modules (Challan, PO, E-Way Bill)
   const { activeModule, moduleData, fetchModuleFun, openModule, closeModule, updateModuleData, submitModule, getDocumentLabel, activeSelectedIds, handleRemoveLinkedDoc, currentChallanIds, currentPoIds, currentEwayBillIds } = useAccountingDocumentModules({ invoiceId, setValue, control });

   // Amount in words
   const amountInWords = useMemo(() => {
      return numberToIndianRupeesWords(watchedTotal || 0);
   }, [watchedTotal]);

   // Payment Protection Invariant Checks
   const invoicePaidAmount = Number(invoice?.paidAmount ?? invoice?.paid_amount ?? 0);
   const invoiceBalanceAmount = Number(invoice?.balanceAmount ?? invoice?.balance_amount ?? 0);
   const isTotalBelowPaid = isEditMode && invoicePaidAmount > 0 && Number(watchedTotal || 0) < invoicePaidAmount;

   return (
      <div>
         <FormProvider {...formMethods}>
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
               <Row>
                  <Col xl="12" lg="12">
                     <Card className="invoice-form-card shadow-sm border-0 mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom py-3 flex-wrap gap-2">
                           <div className="header-title d-flex align-items-center gap-2">
                              <Button
                                 variant="outline-secondary"
                                 size="sm"
                                 className="btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center me-2"
                                 style={{ width: '32px', height: '32px' }}
                                 onClick={handleBack}
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
                                       {invoice.status === 'Cancelled' && (
                                          <span
                                             className="badge rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5 ms-2 align-middle"
                                             style={{
                                                backgroundColor: '#fee2e2',
                                                color: '#b91c1c',
                                                border: '1px solid #fecaca',
                                                fontSize: '0.72rem',
                                                letterSpacing: '0.04em',
                                                padding: '3px 10px'
                                             }}
                                          >
                                             <span
                                                style={{
                                                   width: 6,
                                                   height: 6,
                                                   borderRadius: '50%',
                                                   backgroundColor: '#ef4444',
                                                   display: 'inline-block'
                                                }}
                                             />
                                             CANCELLED
                                          </span>
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
                                    🌐 Inter-State (IGST) {placeOfSupplyCode ? `• POS: ${placeOfSupplyCode}` : ''}
                                 </Badge>
                              ) : (
                                 <Badge bg="primary" className="px-3 py-2 fw-medium">
                                    📍 Intra-State (CGST + SGST) {placeOfSupplyCode ? `• POS: ${placeOfSupplyCode}` : ''}
                                 </Badge>
                              )}
                           </div>
                        </Card.Header>

                        <Card.Body className="p-4">
                           {/* Invariant Alert: Payment Protection */}
                           {isEditMode && invoicePaidAmount > 0 && (
                              <div className={`alert ${isTotalBelowPaid ? 'alert-danger' : 'alert-soft-warning'} d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border`} role="alert">
                                 <div className="d-flex align-items-center gap-2">
                                    <FaMoneyBillWave className={isTotalBelowPaid ? 'text-danger flex-shrink-0' : 'text-warning flex-shrink-0'} size={20} />
                                    <div>
                                       <strong>Payment Protection Active:</strong> Payments of{' '}
                                       <span className="font-monospace fw-bold text-dark">₹{invoicePaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> have been recorded on this invoice.
                                       {isTotalBelowPaid ? (
                                          <span className="text-danger d-block fw-bold mt-1">
                                             Current Total (₹{Number(watchedTotal || 0).toFixed(2)}) cannot be lower than the recorded payment (₹{invoicePaidAmount.toFixed(2)}). Please adjust items before updating.
                                          </span>
                                       ) : (
                                          <span className="text-muted d-block small">
                                             Invoice total cannot be reduced below the amount already received.
                                          </span>
                                       )}
                                    </div>
                                 </div>
                                 <Badge bg={isTotalBelowPaid ? 'danger' : 'warning'} className={`${isTotalBelowPaid ? 'text-white' : 'text-dark'} font-monospace px-2.5 py-1.5 fs-7 text-nowrap`}>
                                    Paid: ₹{invoicePaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Due: ₹{invoiceBalanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                 </Badge>
                              </div>
                           )}

                           {/* CANCELLED INVOICE NOTICE */}
                           {isEditMode && invoice?.status === 'Cancelled' && (
                              <div
                                 className="p-3 mb-4 rounded-3 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3"
                                 style={{
                                    background: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
                                    border: '1px solid #fed7d7',
                                    borderLeft: '4px solid #ef4444',
                                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.06)'
                                 }}
                                 role="alert"
                              >
                                 <div className="d-flex align-items-start gap-3">
                                    <div
                                       className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                                       style={{
                                          width: '38px',
                                          height: '38px',
                                          backgroundColor: '#fee2e2',
                                          color: '#dc2626',
                                          border: '1px solid #fca5a5'
                                       }}
                                    >
                                       <Ban size={18} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                       <div className="d-flex align-items-center gap-2 flex-wrap">
                                          <span className="fw-bold text-dark fs-6" style={{ letterSpacing: '-0.01em' }}>
                                             This Invoice is Cancelled
                                          </span>
                                          <span
                                             className="badge rounded-pill fw-semibold"
                                             style={{
                                                backgroundColor: '#fee2e2',
                                                color: '#b91c1c',
                                                border: '1px solid #fecaca',
                                                fontSize: '0.68rem',
                                                letterSpacing: '0.04em',
                                                padding: '2px 8px'
                                             }}
                                          >
                                             VOID / READ-ONLY
                                          </span>
                                       </div>
                                       <div className="text-secondary small mt-0.5" style={{ fontSize: '0.80rem', lineHeight: '1.45' }}>
                                          Under GST compliance regulations, cancelled invoices cannot be modified or re-submitted. Linked Delivery Challans and Purchase Orders have been safely unlinked for re-billing.
                                       </div>
                                       {invoice?.cancel_reason && (
                                          <div className="d-flex align-items-center gap-2 mt-2 pt-1.5 border-top border-danger-subtle small">
                                             <span className="fw-semibold text-danger" style={{ fontSize: '0.78rem' }}>Cancellation Reason:</span>
                                             <span className="bg-white px-2.5 py-0.5 rounded border border-danger-subtle text-dark fw-medium fst-italic" style={{ fontSize: '0.78rem' }}>
                                                "{invoice.cancel_reason}"
                                             </span>
                                          </div>
                                       )}
                                    </div>
                                 </div>

                                 {isEditMode && invoiceId && (
                                    <Button
                                       variant="outline-danger"
                                       size="sm"
                                       className="flex-shrink-0 d-flex align-items-center gap-1.5 rounded-3 fw-semibold shadow-none px-3 py-2 ms-md-auto"
                                       style={{
                                          fontSize: '0.80rem',
                                          backgroundColor: '#ffffff',
                                          borderColor: '#fca5a5',
                                          color: '#dc2626'
                                       }}
                                       onClick={() => navigate(`/sales/invoice/${invoiceId}/duplicate`)}
                                       title="Create a new invoice using data from this cancelled invoice"
                                    >
                                       <FaCopy size={12} />
                                       <span>Duplicate to New Invoice</span>
                                    </Button>
                                 )}
                              </div>
                           )}

                           {/* SECTION 1: INVOICE MAIN DETAILS */}
                           <div className="form-section-card">
                              <div className="form-section-header">
                                 <div className="section-title-wrap">
                                    <div className="section-icon-badge primary">
                                       <FaFileAlt />
                                    </div>
                                    <div>
                                       <h6 className="section-title">Invoice Particulars & Terms</h6>
                                       <p className="section-subtitle">Core invoice details, customer selection, and payment terms</p>
                                    </div>
                                 </div>
                              </div>
                              <Row className="g-3 align-items-stretch">
                                 {/* ROW 1: Invoice No (2) + Customer Name (4) + Invoice Date (3) + Due Date (3) = 12 Cols */}
                                 <Col lg="2" md="4" sm="4">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0 readonly-floating-wrapper">
                                       <Form.Control
                                          type="text"
                                          id="invoiceNo"
                                          placeholder="Invoice No"
                                          isInvalid={!!errors.invoiceNo}
                                          readOnly
                                          tabIndex={-1}
                                          className="form-control-readonly-modern font-monospace"
                                          {...register("invoiceNo")}
                                       />
                                       <Form.Label htmlFor="invoiceNo" className="d-flex align-items-center gap-1.5">
                                          <FaLock size={10} className="text-muted flex-shrink-0" />
                                          <span>Invoice No</span>
                                          {!isEditMode && <span className="readonly-pill-tag primary">AUTO #</span>}
                                          {isEditMode && invoice.status === 'Cancelled' ? (
                                             <span className="readonly-pill-tag danger">CANCELLED</span>
                                          ) : isEditMode ? (
                                             <span className="readonly-pill-tag">LOCKED</span>
                                          ) : null}
                                       </Form.Label>
                                       <span className="readonly-watermark-icon" title="System-generated invoice identifier">
                                          <FaLock size={11} />
                                       </span>
                                       <Form.Control.Feedback type="invalid">{errors.invoiceNo?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>

                                 <Col lg="4" md="8" sm="8">
                                    <PartyAutocompleteInput
                                       value={customerName || ''}
                                       onChange={(e) => setValue('customerName', e.target.value, { shouldValidate: true, shouldDirty: true })}
                                       onSelectParty={handlePartySelect}
                                       onClearParty={handleClearParty}
                                       onDetachParty={handleDetachParty}
                                       isInvalid={!!errors.customerName}
                                       errorMessage={errors.customerName?.message}
                                       placeholder="Search party by name or code..."
                                       label="Customer Name"
                                       required
                                    />
                                 </Col>

                                 <Col lg="3" md="6" sm="6">
                                    <Controller
                                       name="invoiceDate"
                                       control={control}
                                       defaultValue={new Date()}
                                       render={({ field, fieldState: { error } }) => (
                                          <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                             <Flatpickr
                                                {...field}
                                                id="invoiceDate"
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
                                                placeholder=" "
                                             />
                                             <Form.Label htmlFor="invoiceDate">
                                                Invoice Date <span className="text-danger">*</span>
                                             </Form.Label>
                                             <FaRegCalendarAlt className="floating-date-icon" />
                                             <Form.Control.Feedback type="invalid">
                                                {errors.invoiceDate?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       )}
                                    />
                                 </Col>

                                 <Col lg="3" md="6" sm="6">
                                    <Controller
                                       name="dueDate"
                                       control={control}
                                       defaultValue={new Date()}
                                       render={({ field, fieldState: { error } }) => (
                                          <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                             <Flatpickr
                                                {...field}
                                                id="dueDate"
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
                                                placeholder=" "
                                             />
                                             <Form.Label htmlFor="dueDate">
                                                Due Date <span className="text-danger">*</span>
                                             </Form.Label>
                                             <FaRegCalendarAlt className="floating-date-icon" />
                                             <Form.Control.Feedback type="invalid">
                                                {errors.dueDate?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       )}
                                    />
                                 </Col>

                                 {/* ROW 2: GST Toggle (2) + GSTIN (4) + Payment Status (3) + Payment Mode (3) = 12 Cols */}
                                 <Col lg="2" md="4" sm="4" className="d-flex align-items-center">
                                    <div
                                       className={`gst-toggle-box w-100 ${hasGst ? 'active' : ''}`}
                                       onClick={() => {
                                          const nextVal = !hasGst;
                                          setValue("hasGst", nextVal, { shouldValidate: true });
                                       }}
                                    >
                                       <span className="gst-label-text">
                                          GST Registered
                                       </span>
                                       <FormCheck
                                          type="switch"
                                          id="hasGst"
                                          checked={!!hasGst}
                                          className="mb-0"
                                          isInvalid={!!errors.hasGst}
                                          {...register("hasGst", {
                                             onChange: (e) => {
                                                setValue("hasGst", e.target.checked, { shouldValidate: true });
                                             }
                                          })}
                                          onClick={(e) => e.stopPropagation()}
                                       />
                                    </div>
                                 </Col>

                                 <Col lg="4" md="8" sm="8">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                       <Form.Control
                                          type="text"
                                          id="gstNumber"
                                          placeholder={hasGst ? "GSTIN No. (15 Characters)" : "GST Not Applicable (Toggle switch to enter)"}
                                          disabled={!hasGst}
                                          maxLength={15}
                                          tabIndex={!hasGst ? -1 : 0}
                                          className={`text-uppercase font-monospace ${!hasGst ? 'form-control-readonly-modern' : ''}`}
                                          isInvalid={!!errors.gstNumber}
                                          {...register("gstNumber", {
                                             onChange: (e) => {
                                                const upper = (e.target.value || "").toUpperCase();
                                                setValue("gstNumber", upper, { shouldValidate: true, shouldDirty: true });
                                                setValue("billingAddress.gstin", upper, { shouldValidate: false, shouldDirty: true });
                                                if (upper.length >= 2) {
                                                   const stateCode = upper.substring(0, 2);
                                                   const dbState = findDbStateByGstCode(stateCode, billingStates);
                                                   if (dbState?.id) {
                                                      const dbStateId = Number(dbState.id);
                                                      setValue("billingAddress.stateId", dbStateId, { shouldValidate: true, shouldDirty: true });
                                                      if (sameAsBilling) {
                                                         setValue("shippingAddress.stateId", dbStateId, { shouldValidate: true, shouldDirty: true });
                                                         clearErrors("shippingAddress.stateId");
                                                      }
                                                   }
                                                }
                                             }
                                          })}
                                       />
                                       <Form.Label htmlFor="gstNumber">
                                          GSTIN No. {hasGst ? <span className="text-danger">*</span> : <span className="text-muted small fst-italic ms-1">(Not Applicable)</span>}
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.gstNumber?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>

                                 <Col lg="3" md="6" sm="6">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                       <Form.Select
                                          name="paymentStatusId"
                                          id="paymentStatusId"
                                          isInvalid={!!errors.paymentStatusId}
                                          {...register("paymentStatusId")}
                                       >
                                          <option value="">Select Status</option>
                                          {paymentStatus.map((item) => (
                                             <option key={item.id} value={item.id}>{item.label}</option>
                                          ))}
                                       </Form.Select>
                                       <Form.Label htmlFor="paymentStatusId">
                                          Payment Status <span className="text-danger">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.paymentStatusId?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>

                                 <Col lg="3" md="6" sm="6">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                       <Form.Select
                                          name="paymentModeId"
                                          id="paymentModeId"
                                          isInvalid={!!errors.paymentModeId}
                                          {...register("paymentModeId")}
                                       >
                                          <option value="">Select Mode</option>
                                          {paymentMode.map((item) => (
                                             <option key={item.id} value={item.id}>{item.label}</option>
                                          ))}
                                       </Form.Select>
                                       <Form.Label htmlFor="paymentModeId">
                                          Payment Mode <span className="text-danger">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">{errors.paymentModeId?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                 </Col>

                                 {/* ROW 3: Reference Documents (6) & Payment Credit Terms (6) - Equal Height & Bottom Margin */}
                                 <Col lg="6" md="12" className="d-flex">
                                    <div className="doc-pill-dock flex-grow-1 w-100 d-flex flex-column justify-content-between">
                                       <div>
                                          <div className="d-flex align-items-center justify-content-between mb-2">
                                             <div className="d-flex align-items-center gap-2">
                                                <div className="doc-icon-badge bg-primary text-white">
                                                   <FaPaperclip size={11} />
                                                </div>
                                                <div>
                                                   <span className="doc-dock-title">Attach Reference Documents</span>
                                                   <span className="doc-dock-subtitle d-block">Link Challan, PO or E-Way Bill</span>
                                                </div>
                                             </div>
                                             {(currentChallanIds.length > 0 || currentPoIds.length > 0 || currentEwayBillIds.length > 0) && (
                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                   {currentChallanIds.length + currentPoIds.length + currentEwayBillIds.length} Linked
                                                </span>
                                             )}
                                          </div>

                                          {/* 3 Equal Column Action Buttons */}
                                          <div className="doc-actions-grid">
                                             {/* Challan Pill */}
                                             <div
                                                className={`doc-pill-btn ${currentChallanIds.length > 0 ? 'active-challan' : ''}`}
                                                onClick={() => openModule('challan')}
                                                title="Click to select or manage Challans"
                                             >
                                                <div className="doc-btn-lead">
                                                   <FaFileAlt size={12} className={currentChallanIds.length > 0 ? "text-primary flex-shrink-0" : "text-secondary flex-shrink-0"} />
                                                   <span className="doc-btn-text">Challan</span>
                                                </div>
                                                {currentChallanIds.length > 0 ? (
                                                   <span className="badge bg-primary text-white pill-badge">
                                                      <span className="pill-count">{currentChallanIds.length}</span>
                                                      <span className="pill-label"> Linked</span>
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
                                                onClick={() => openModule('purchaseOrder')}
                                                title="Click to select or manage Purchase Orders"
                                             >
                                                <div className="doc-btn-lead">
                                                   <FaShoppingCart size={12} className={currentPoIds.length > 0 ? "text-success flex-shrink-0" : "text-secondary flex-shrink-0"} />
                                                   <span className="doc-btn-text">
                                                      <span className="label-full">Purchase Order</span>
                                                      <span className="label-short">PO</span>
                                                   </span>
                                                </div>
                                                {currentPoIds.length > 0 ? (
                                                   <span className="badge bg-success text-white pill-badge">
                                                      <span className="pill-count">{currentPoIds.length}</span>
                                                      <span className="pill-label"> Linked</span>
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
                                                onClick={() => openModule('ewayBill')}
                                                title="Click to select or manage E-Way Bills"
                                             >
                                                <div className="doc-btn-lead">
                                                   <FaTruck size={12} className={currentEwayBillIds.length > 0 ? "text-danger flex-shrink-0" : "text-secondary flex-shrink-0"} />
                                                   <span className="doc-btn-text">
                                                      <span className="label-full">E-Way Bill</span>
                                                      <span className="label-short">E-Way</span>
                                                   </span>
                                                </div>
                                                {currentEwayBillIds.length > 0 ? (
                                                   <span className="badge bg-danger text-white pill-badge">
                                                      <span className="pill-count">{currentEwayBillIds.length}</span>
                                                      <span className="pill-label"> Linked</span>
                                                   </span>
                                                ) : (
                                                   <span className="badge bg-light text-muted border pill-badge">
                                                      + Add
                                                   </span>
                                                )}
                                             </div>
                                          </div>
                                       </div>

                                       {/* Attached Documents Tag Tray */}
                                       {(currentChallanIds.length > 0 || currentPoIds.length > 0 || currentEwayBillIds.length > 0) ? (
                                          <div className="doc-tray-footer">
                                             <span className="tray-label">Linked:</span>
                                             <div className="doc-chips-scroll">
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
                                                   <span key={`ewb-${id}`} className="badge bg-white text-danger border border-danger-subtle document-badge-chip">
                                                      <FaTruck size={10} className="text-danger" /> {getDocumentLabel ? getDocumentLabel('ewayBill', id) : 'E-Way Bill'}
                                                      <FaTimes size={10} className="chip-close ms-1" onClick={(e) => { e.stopPropagation(); handleRemoveLinkedDoc('ewayBill', id); }} />
                                                   </span>
                                                ))}
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="doc-tray-footer text-muted" style={{ fontSize: '0.73rem', fontStyle: 'italic' }}>
                                             No reference documents attached to this invoice yet.
                                          </div>
                                       )}
                                    </div>
                                 </Col>

                                 {/* Payment Credit Terms */}
                                 <Col lg="6" md="12" className="d-flex">
                                    <div className="due-terms-container flex-grow-1 w-100 d-flex flex-column justify-content-between">
                                       <div>
                                          <div className="d-flex align-items-center justify-content-between mb-2">
                                             <div className="d-flex align-items-center gap-2">
                                                <div className="doc-icon-badge text-white" style={{ background: '#4f46e5' }}>
                                                   <FaCoins size={11} />
                                                </div>
                                                <div>
                                                   <span className="doc-dock-title">Payment Credit Terms</span>
                                                   <span className="doc-dock-subtitle d-block">Select days or quick preset schedule</span>
                                                </div>
                                             </div>
                                             <span className={`badge px-2 py-1 ${Number(dueDays) === 0 ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-success-subtle text-success border border-success-subtle'}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                {Number(dueDays) === 0 ? 'Immediate Due' : `${dueDays} Days Credit`}
                                             </span>
                                          </div>

                                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                             <div className="due-input-group">
                                                <span className="terms-label">Days:</span>
                                                <Form.Control
                                                   type="number"
                                                   id="dueDays"
                                                   min={0}
                                                   step={1}
                                                   className="due-number-input"
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

                                             <div className="due-chips-wrap flex-grow-1">
                                                <span className="chip-label">Quick:</span>
                                                <div className="d-flex align-items-center gap-1 flex-wrap">
                                                   {DUE_PRESET_DAYS.map((days) => {
                                                      const isActive = Number(dueDays) === days;
                                                      return (
                                                         <span
                                                            key={days}
                                                            className={`badge due-preset-badge ${isActive ? 'active' : ''}`}
                                                            onClick={() => handleDuePresetClick(days)}
                                                            title={`Set due date to ${days === 0 ? 'same day' : `${days} days`}`}
                                                         >
                                                            {days === 0 ? "Immediate" : `${days}d`}
                                                         </span>
                                                      );
                                                   })}
                                                </div>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="doc-tray-footer d-flex align-items-center justify-content-between">
                                          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.74rem' }}>
                                             <FaRegCalendarAlt size={11} className="text-primary" />
                                             <span>
                                                {Number(dueDays) === 0 ? (
                                                   <span>Payment due on invoice issue date: <strong className="text-dark">{invoiceDate ? moment(invoiceDate).format('DD MMM YYYY') : moment().format('DD MMM YYYY')}</strong></span>
                                                ) : (
                                                   <span>Calculated Due Date: <strong className="text-success">{dueDate ? moment(dueDate).format('DD MMM YYYY') : moment(invoiceDate || new Date()).add(dueDays, 'days').format('DD MMM YYYY')}</strong></span>
                                                )}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 </Col>
                              </Row>
                           </div>

                           {/* SECTION 2: BILLING & SHIPPING ADDRESSES */}
                           <div className="form-section-card">
                              <div className="form-section-header">
                                 <div className="section-title-wrap">
                                    <div className="section-icon-badge indigo">
                                       <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                       <h6 className="section-title">Address & Delivery Logistics</h6>
                                       <p className="section-subtitle">Billing address and delivery facility specifications</p>
                                    </div>
                                 </div>
                              </div>
                              {/* Hidden snapshot inputs to ensure full registration with react-hook-form */}
                              <input type="hidden" {...register("partyId")} />
                              <input type="hidden" {...register("branchId")} />
                              <input type="hidden" {...register("billingAddress.branchName")} />
                              <input type="hidden" {...register("billingAddress.gstin")} />
                              <input type="hidden" {...register("shippingAddress.branchName")} />
                              <input type="hidden" {...register("shippingAddress.gstin")} />

                              <Row className="g-4">
                                 {/* Billing Address */}
                                 <Col lg="6">
                                    <div className="address-section-header flex-wrap gap-2">
                                       <div className="d-flex align-items-center gap-2">
                                          <FaMapMarkerAlt className="text-primary" />
                                          <h6 className="fw-bold text-dark mb-0">Billing Address</h6>
                                       </div>
                                       <span className="badge bg-soft-primary text-primary border border-primary-subtle rounded-pill px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                                          Buyer Location
                                       </span>
                                    </div>

                                    {/* Symmetrical Billing Facility Selector */}
                                    <div className="facility-select-card active-billing">
                                       <div className="d-flex align-items-center gap-2 text-truncate">
                                          <FaBuilding className="text-primary flex-shrink-0" size={13} />
                                          <span className="small text-secondary fw-semibold text-nowrap" style={{ fontSize: '0.78rem' }}>Billing Facility:</span>
                                       </div>
                                       {partyBranches && partyBranches.length > 1 ? (
                                          <Form.Select
                                             size="sm"
                                             value={selectedBillingBranchId || ''}
                                             onChange={(e) => handleSelectBillingBranch(Number(e.target.value))}
                                             className="facility-select"
                                          >
                                             {partyBranches.map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                   {branch.branchName || 'Branch'} {branch.isDefault ? '★ (Default)' : ''}
                                                </option>
                                             ))}
                                          </Form.Select>
                                       ) : partyBranches && partyBranches.length === 1 ? (
                                          <span className="fw-semibold text-dark small text-truncate d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                             {partyBranches[0]?.branchName || 'Head Office'}
                                             {partyBranches[0]?.isDefault && <span className="badge bg-soft-primary text-primary rounded-pill px-1.5 py-0.5 ms-1" style={{ fontSize: '0.68rem' }}>Default ★</span>}
                                          </span>
                                       ) : (
                                          <span className="text-muted small fst-italic" style={{ fontSize: '0.78rem' }}>
                                             {customerName ? 'Primary Location' : 'Select Customer'}
                                          </span>
                                       )}
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
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Select
                                                id="billingStateId"
                                                isInvalid={!!errors?.billingAddress?.stateId}
                                                {...register("billingAddress.stateId")}
                                             >
                                                <option value="">Select State</option>
                                                {billingStates.map((state) => (
                                                   <option key={state.id} value={state.id}>{state.name}</option>
                                                ))}
                                             </Form.Select>
                                             <Form.Label htmlFor="billingStateId">
                                                State <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.stateId?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="4">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Select
                                                id="billingCityId"
                                                disabled={!selectedBillingState || isFetchingBillingCities}
                                                isInvalid={!!errors?.billingAddress?.cityId}
                                                {...register("billingAddress.cityId")}
                                             >
                                                <option value="">{isFetchingBillingCities ? "Loading cities..." : "Select City"}</option>
                                                {billingCities.map((city) => (
                                                   <option key={city.id} value={city.id}>{city.name}</option>
                                                ))}
                                             </Form.Select>
                                             <Form.Label htmlFor="billingCityId">
                                                City <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.billingAddress?.cityId?.message}</Form.Control.Feedback>
                                          </Form.Floating>
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
                                    <div className="address-section-header flex-wrap gap-2">
                                       <div className="d-flex align-items-center gap-2">
                                          <FaTruck className="text-primary" />
                                          <h6 className="fw-bold text-dark mb-0">Shipping Address</h6>
                                       </div>
                                       {/* Modern Segmented Pill Selector when party has branches, otherwise fallback to simple Same-As-Billing toggle */}
                                       {partyBranches && partyBranches.length > 0 ? (
                                          <div className="ship-mode-pills">
                                             <button
                                                type="button"
                                                className={`ship-mode-pill ${shippingMode === 'SAME_AS_BILLING' ? 'active-same' : ''}`}
                                                onClick={() => handleShippingModeChange('SAME_AS_BILLING')}
                                             >
                                                Same as Billing
                                             </button>
                                             {partyBranches.length > 1 && (
                                                <button
                                                   type="button"
                                                   className={`ship-mode-pill ${shippingMode === 'OTHER_BRANCH' ? 'active-branch' : ''}`}
                                                   onClick={() => handleShippingModeChange('OTHER_BRANCH')}
                                                >
                                                   Other Branch
                                                </button>
                                             )}
                                             <button
                                                type="button"
                                                className={`ship-mode-pill ${shippingMode === 'CUSTOM_SITE' ? 'active-custom' : ''}`}
                                                onClick={() => handleShippingModeChange('CUSTOM_SITE')}
                                             >
                                                Custom Site
                                             </button>
                                          </div>
                                       ) : (
                                          <FormCheck
                                             type="checkbox"
                                             id="sameAsBilling"
                                             label="Same as Billing"
                                             className="small fw-semibold text-secondary cursor-pointer mb-0"
                                             style={{ fontSize: '0.82rem' }}
                                             checked={sameAsBilling}
                                             onChange={(e) => handleSameAsBillingChange(e.target.checked)}
                                          />
                                       )}
                                    </div>

                                    {/* Symmetrical Shipping Facility Bar */}
                                    <div className="facility-select-card active-shipping">
                                       {shippingMode === 'SAME_AS_BILLING' ? (
                                          <div className="d-flex align-items-center gap-2 w-100 py-0.5 text-truncate">
                                             <FaCheckCircle className="text-primary flex-shrink-0" size={13} />
                                             <span className="small text-secondary text-truncate" style={{ fontSize: '0.78rem' }}>
                                                Deliver to: <strong className="text-dark">{billingBranchName || partyBranches?.find(b => Number(b.id) === Number(selectedBillingBranchId))?.branchName || 'Billing Facility'}</strong>
                                             </span>
                                          </div>
                                       ) : shippingMode === 'OTHER_BRANCH' ? (
                                          <>
                                             <div className="d-flex align-items-center gap-2 text-truncate">
                                                <FaBuilding className="text-success flex-shrink-0" size={13} />
                                                <span className="small text-secondary fw-semibold text-nowrap" style={{ fontSize: '0.78rem' }}>Ship To Branch:</span>
                                             </div>
                                             <Form.Select
                                                size="sm"
                                                value={selectedShippingBranchId || ''}
                                                onChange={(e) => handleSelectShippingBranch(Number(e.target.value))}
                                                className="facility-select border-success-subtle"
                                             >
                                                <option value="" disabled>-- Select Shipping Branch --</option>
                                                {partyBranches.map((branch) => (
                                                   <option key={branch.id} value={branch.id}>
                                                      {branch.branchName || 'Branch'} {branch.isDefault ? '★ (Default)' : ''}
                                                   </option>
                                                ))}
                                             </Form.Select>
                                          </>
                                       ) : (
                                          <div className="d-flex align-items-center gap-2 w-100 py-0.5 text-truncate">
                                             <FaMapMarkerAlt className="text-secondary flex-shrink-0" size={13} />
                                             <span className="small text-secondary text-truncate" style={{ fontSize: '0.78rem' }}>
                                                Custom delivery site / consignee address specified below
                                             </span>
                                          </div>
                                       )}
                                    </div>


                                    <Row className="g-3">
                                       <Col lg="12">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Control
                                                as="textarea"
                                                placeholder="Shipping Address"
                                                style={{ height: '95px' }}
                                                disabled={sameAsBilling}
                                                className={sameAsBilling ? "form-control-readonly-modern" : ""}
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
                                                className={sameAsBilling ? "form-control-readonly-modern" : ""}
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
                                                className={sameAsBilling ? "form-control-readonly-modern" : ""}
                                                isInvalid={!!errors?.shippingAddress?.email}
                                                {...register("shippingAddress.email")}
                                             />
                                             <Form.Label htmlFor="shippingAddress.email">Email Address</Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.email?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="4">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Select
                                                id="shippingStateId"
                                                disabled={sameAsBilling}
                                                className={sameAsBilling ? "form-control-readonly-modern" : ""}
                                                isInvalid={!!errors?.shippingAddress?.stateId}
                                                {...register("shippingAddress.stateId")}
                                             >
                                                <option value="">Select State</option>
                                                {shippingStates.map((state) => (
                                                   <option key={state.id} value={state.id}>{state.name}</option>
                                                ))}
                                             </Form.Select>
                                             <Form.Label htmlFor="shippingStateId">
                                                State <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.stateId?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="4">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Select
                                                id="shippingCityId"
                                                disabled={sameAsBilling || !selectedShippingState || isFetchingShippingCities}
                                                className={sameAsBilling ? "form-control-readonly-modern" : ""}
                                                isInvalid={!!errors?.shippingAddress?.cityId}
                                                {...register("shippingAddress.cityId")}
                                             >
                                                <option value="">{isFetchingShippingCities ? "Loading..." : "Select City"}</option>
                                                {shippingCities.map((city) => (
                                                   <option key={city.id} value={city.id}>{city.name}</option>
                                                ))}
                                             </Form.Select>
                                             <Form.Label htmlFor="shippingCityId">
                                                City <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">{errors?.shippingAddress?.cityId?.message}</Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="4">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Control
                                                type="text"
                                                placeholder="Pincode"
                                                disabled={sameAsBilling}
                                                className={sameAsBilling ? "form-control-readonly-modern" : ""}
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
                           </div>

                           {/* SECTION 3: LINE ITEMS TABLE */}
                           <div className="form-section-card">
                              <div className="form-section-header">
                                 <div className="section-title-wrap">
                                    <div className="section-icon-badge success">
                                       <FaShoppingCart />
                                    </div>
                                    <div>
                                       <div className="d-flex align-items-center gap-2">
                                          <h6 className="section-title mb-0">Invoice Line Items</h6>
                                          {isInterState ? (
                                             <Badge bg="info-subtle" text="info" className="border border-info-subtle font-monospace px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                                Inter-State (IGST)
                                             </Badge>
                                          ) : (
                                             <Badge bg="primary-subtle" text="primary" className="border border-primary-subtle font-monospace px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                                Intra-State (CGST + SGST)
                                             </Badge>
                                          )}
                                       </div>
                                       <p className="section-subtitle">Line items, quantities, rates, and taxes calculate automatically</p>
                                    </div>
                                 </div>
                              </div>
                              <InvoiceItemsTable
                                 productUnit={productUnit}
                                 gstSlab={gstSlab}
                                 lastEditedFieldRef={lastEditedFieldRef}
                                 isInterState={isInterState}
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
                                                   onFocus={(e) => e.target.select()}
                                                   onClick={(e) => e.target.select()}
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
                                                   onFocus={(e) => e.target.select()}
                                                   onClick={(e) => e.target.select()}
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
                                                   onFocus={(e) => e.target.select()}
                                                   onClick={(e) => e.target.select()}
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
                                       <span className="value">₹ {Number(watchedSubTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {/* Discount */}
                                    {Number(watchedDiscountAmount || 0) > 0 && (
                                       <div className="summary-row text-danger">
                                          <span className="label">Discount</span>
                                          <span className="value">- ₹ {Number(watchedDiscountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                       </div>
                                    )}

                                    {/* Taxable Amount */}
                                    <div className="summary-row highlight">
                                       <span className="label">Taxable Amount</span>
                                       <span className="value">₹ {Number(watchedTaxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {/* Taxes: Intra vs Inter */}
                                    {!isInterState ? (
                                       <>
                                          <div className="summary-row">
                                             <span className="label">CGST</span>
                                             <span className="value">+ ₹ {Number(watchedCgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          </div>
                                          <div className="summary-row">
                                             <span className="label">SGST</span>
                                             <span className="value">+ ₹ {Number(watchedSgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          </div>
                                       </>
                                    ) : (
                                       <div className="summary-row">
                                          <span className="label">IGST</span>
                                          <span className="value">+ ₹ {Number(watchedIgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                       </div>
                                    )}

                                    {/* Other Charges */}
                                    {Number(watchedOther || 0) > 0 && (
                                       <div className="summary-row">
                                          <span className="label">Other Charges</span>
                                          <span className="value">+ ₹ {Number(watchedOther || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                       </div>
                                    )}

                                    {/* Round Off */}
                                    <div className="summary-row">
                                       <span className="label">Round Off</span>
                                       <span className="value">
                                          {Number(watchedRoundOff || 0) >= 0 ? '+ ' : '- '}
                                          ₹ {Math.abs(Number(watchedRoundOff || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                 onClick={handleBack}
                              >
                                 Cancel
                              </Button>

                              <SubmitButton
                                 isLoading={createInvoiceIsPending || updateInvoiceIsPending}
                                 isEditMode={isEditMode}
                                 disabled={isTotalBelowPaid || (isEditMode && invoice?.status === 'Cancelled')}
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