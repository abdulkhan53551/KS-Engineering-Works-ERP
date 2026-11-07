import React, { useMemo } from 'react';
import { Row, Col, Form, Card, Button, Table, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Flatpickr from "react-flatpickr";
import { Controller, useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { usePurchaseOrderById } from '../hooks/useApi';
import useHandleSubmit from '../hooks/useHandleSubmit';
import useFormInit from '../hooks/useFormInit';
import usePoPartySync from '../hooks/usePoPartySync';
import usePoItems from '../hooks/usePoItems';
import { createPurchaseOrderValidationSchema, updatePurchaseOrderValidationSchema } from '../../../validation/purchaseOrder.validation';
import SubmitButton from '../../../components/SubmitButton';
import {
   FaRegCalendarAlt,
   FaBoxes,
   FaPlus,
   FaTrash,
   FaBuilding,
   FaArrowLeft,
   FaCopy,
   FaMapMarkerAlt,
   FaPaperclip,
   FaInfoCircle,
   FaFileContract,
   FaCoins,
   FaMoneyBillWave,
   FaTruck,
   FaCheckCircle
} from 'react-icons/fa';
import AttachmentManager from '../../../components/attachments/AttachmentManager';
import PartyAutocompleteInput from '../../invoice/components/PartyAutocompleteInput';
import ProductAutocompleteInput from '../../products/components/ProductAutocompleteInput';
import { numberToIndianRupeesWords } from '../../../utilities/numberToWords';

// Import unified invoice styling system
import '../../invoice/pages/invoice.scss';
import '../../invoice/pages/invoice-list-modern.scss';

const PO_DOC_TYPES = [
   { value: 'SIGNED_PO', label: 'Customer Signed Purchase Order / Work Order' },
   { value: 'ORDER_SPEC', label: 'Technical Spec / Approved Fabrication Drawing' },
   { value: 'AMENDMENT_COPY', label: 'PO Amendment / Scope Revision Letter' },
   { value: 'OTHER', label: 'General / Supporting Document' }
];

const PO_STATUS_OPTIONS = [
   { value: 'OPEN', label: 'Open / In Progress' },
   { value: 'PARTIALLY_INVOICED', label: 'Partially Invoiced' },
   { value: 'COMPLETED', label: 'Completed / Short-Closed' },
   { value: 'CANCELLED', label: 'Cancelled' }
];

const DATE_PICKER_OPTIONS = {
   dateFormat: "d/m/Y",
   defaultDate: ["today"],
};

// Static default form state defined at module level to guarantee stable object reference across renders
const defaultFormValue = {
   poNo: '',
   poDate: new Date(),
   customerName: '',
   partyId: null,
   partyBranchId: null,
   billingAddress: '',
   deliveryAddress: '',
   deliveryDueDate: null,
   validUntil: null,
   paymentTerms: '30 Days after Delivery',
   advancePercentage: 0,
   status: 'OPEN',
   notes: '',
   items: [
      { itemName: '', description: '', hsnSacCode: '', qty: 1, invoicedQty: 0, unit: 'Nos', rate: 0, gstRate: 18, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
   ]
};

const PurchaseOrderForm = ({ mode }) => {
   const { id: poId } = useParams();
   const navigate = useNavigate();
   const isEditMode = Boolean(mode === 'edit');

   const {
      register, handleSubmit, setValue, getValues, reset, control, formState: { errors }
   } = useForm({
      resolver: joiResolver(isEditMode ? updatePurchaseOrderValidationSchema : createPurchaseOrderValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         ...defaultFormValue
      }
   });

   const watchedStatus = useWatch({ control, name: "status" });
   const watchedCustomerName = useWatch({ control, name: "customerName" });
   const watchedAdvance = useWatch({ control, name: "advancePercentage" });

   // 1. API Queries & Initial Form Hydration
   const { data: purchaseOrder = {} } = usePurchaseOrderById(poId);
   const { onSubmit, onError, createPurchaseOrderIsPending, updatePurchaseOrderIsPending } = useHandleSubmit({ poId, isEditMode });
   useFormInit({ purchaseOrder, isEditMode, reset });

   // 2. Business Logic Hook: Party Selection & Symmetrical Multi-Branch Address Sync
   const {
      selectedParty,
      partyBranches,
      selectedBillingBranchId,
      selectedDeliveryBranchId,
      selectedBranchId,
      isLoadingBranches,
      handleSelectBillingBranch,
      handleSelectDeliveryBranch,
      handleSelectBranch,
      handlePartySelect,
      handleClearParty,
      handleDetachParty
   } = usePoPartySync({
      setValue,
      getValues,
      initialPartyId: purchaseOrder.partyId,
      initialPartyBranchId: purchaseOrder.partyBranchId,
      isEditMode
   });

   // 3. Business Logic Hook: Line Items, Calculations & Product Autocomplete
   const {
      fields,
      productUnits,
      watchedItems,
      totalQty,
      subTotal,
      taxAmount,
      totalAmount,
      handleQtyOrRateChange,
      handleDuplicateRow,
      handleAddItem,
      handleProductSelect,
      remove
   } = usePoItems({ control, setValue, getValues });

   // Amount in words
   const amountInWords = useMemo(() => {
      return numberToIndianRupeesWords(totalAmount || 0);
   }, [totalAmount]);

   // Calculate advance amount in rupees
   const advanceAmount = useMemo(() => {
      const pct = Number(watchedAdvance) || 0;
      if (pct <= 0 || !totalAmount) return 0;
      return Number(((totalAmount * pct) / 100).toFixed(2));
   }, [watchedAdvance, totalAmount]);

   const handleBack = () => {
      if (window.history.length > 1) {
         navigate(-1);
      } else {
         navigate('/purchase/purchase-order');
      }
   };

   const handleCopyBillingToDelivery = () => {
      const billing = getValues('billingAddress');
      if (billing) {
         setValue('deliveryAddress', billing, { shouldValidate: true, shouldDirty: true });
      }
   };

   return (
      <div className="invoice-form-wrapper pb-5">
         <Form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
            <Row>
               <Col xl="12" lg="12">
                  <Card className="invoice-form-card shadow-sm border-0 mb-4">
                     {/* Form Header matching InvoiceForm.jsx */}
                     <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom py-3 px-4 flex-wrap gap-2">
                        <div className="header-title d-flex align-items-center gap-2">
                           <Button
                              variant="outline-secondary"
                              size="sm"
                              className="btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center me-2"
                              style={{ width: '32px', height: '32px' }}
                              onClick={handleBack}
                              title="Go back"
                           >
                              <FaArrowLeft size={12} />
                           </Button>
                           <div>
                              <div className="d-flex align-items-center gap-2">
                                 <h4 className="card-title mb-0 fw-bold text-dark">
                                    {isEditMode ? `Customer PO: ${purchaseOrder.poNo || ''}` : 'New Customer Purchase Order'}
                                 </h4>
                                 <span className="readonly-pill-tag primary" style={{ fontSize: '0.68rem' }}>
                                    {isEditMode ? 'EDIT MODE' : 'CREATE (RECEIVABLE)'}
                                 </span>
                                 {purchaseOrder.invoices && purchaseOrder.invoices.length > 0 && (
                                    <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.70rem', padding: '3px 8px' }}>
                                       ✓ Billed in {purchaseOrder.invoices.length} Invoice(s)
                                    </span>
                                 )}
                              </div>
                              <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                                 Client inward work order, fabrication scope & commercial terms
                              </p>
                           </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                           <Button
                              variant="light"
                              size="sm"
                              onClick={handleBack}
                              className="px-3"
                              style={{ fontSize: '0.82rem' }}
                           >
                              Cancel
                           </Button>
                           <SubmitButton
                              isLoading={createPurchaseOrderIsPending || updatePurchaseOrderIsPending}
                              isEditMode={isEditMode}
                              label={isEditMode ? "Save Changes" : "Save Purchase Order"}
                           />
                        </div>
                     </Card.Header>

                     <Card.Body className="p-4" style={{ backgroundColor: '#fafbfc' }}>
                        {/* SECTION 1: PO METADATA & STATUS */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge primary">
                                    <FaFileContract />
                                 </div>
                                 <div>
                                    <h6 className="section-title">PO Particulars & Commercial Status</h6>
                                    <p className="section-subtitle">Customer order number, issue date, and completion timeline</p>
                                 </div>
                              </div>
                              <div>
                                 <span className={`badge rounded-pill fw-semibold ${watchedStatus === 'COMPLETED' ? 'bg-success' : watchedStatus === 'PARTIALLY_INVOICED' ? 'bg-info' : 'bg-primary'}`} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                                    Status: <strong className="text-uppercase">{watchedStatus || 'OPEN'}</strong>
                                 </span>
                              </div>
                           </div>

                           <Row className="g-3">
                              {/* Customer PO Number */}
                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       type="text"
                                       id="poNo"
                                       placeholder="Customer PO No"
                                       isInvalid={!!errors.poNo}
                                       className="font-monospace fw-bold"
                                       {...register("poNo")}
                                    />
                                    <Form.Label htmlFor="poNo">
                                       Customer PO No <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.poNo?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              {/* PO Issue Date (Standard Floating Date Field) */}
                              <Col lg="3" md="6">
                                 <Controller
                                    name="poDate"
                                    control={control}
                                    defaultValue={new Date()}
                                    render={({ field, fieldState: { error } }) => (
                                       <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                          <Flatpickr
                                             {...field}
                                             id="poDate"
                                             value={field.value}
                                             onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                             options={DATE_PICKER_OPTIONS}
                                             className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                             placeholder=" "
                                          />
                                          <Form.Label htmlFor="poDate">
                                             PO Issue Date <span className="text-danger">*</span>
                                          </Form.Label>
                                          <FaRegCalendarAlt className="floating-date-icon" />
                                          <Form.Control.Feedback type="invalid">
                                             {error?.message}
                                          </Form.Control.Feedback>
                                       </Form.Floating>
                                    )}
                                 />
                              </Col>

                              {/* Delivery Due Date (Standard Floating Date Field) */}
                              <Col lg="3" md="6">
                                 <Controller
                                    name="deliveryDueDate"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                       <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                          <Flatpickr
                                             {...field}
                                             id="deliveryDueDate"
                                             value={field.value}
                                             onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                             options={DATE_PICKER_OPTIONS}
                                             className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                             placeholder=" "
                                          />
                                          <Form.Label htmlFor="deliveryDueDate">
                                             Delivery Due Date
                                          </Form.Label>
                                          <FaRegCalendarAlt className="floating-date-icon" />
                                          <Form.Control.Feedback type="invalid">
                                             {error?.message}
                                          </Form.Control.Feedback>
                                       </Form.Floating>
                                    )}
                                 />
                              </Col>

                              {/* Order Status */}
                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Select id="status" {...register("status")}>
                                       {PO_STATUS_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                       ))}
                                    </Form.Select>
                                    <Form.Label htmlFor="status">Fulfillment Status</Form.Label>
                                 </Form.Floating>
                              </Col>
                           </Row>
                        </div>

                        {/* SECTION 2: CUSTOMER (CONSIGNEE) & SITE DETAILS */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge success">
                                    <FaBuilding />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Customer / Client Information</h6>
                                    <p className="section-subtitle">Purchasing organization, billing address, and site delivery branch</p>
                                 </div>
                              </div>
                              {partyBranches && partyBranches.length > 0 && (
                                 <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.72rem', padding: '3px 8px' }}>
                                    {partyBranches.length} {partyBranches.length === 1 ? 'Location Registered' : 'Locations Registered'}
                                 </span>
                              )}
                           </div>

                           <Row className="g-3">
                              {/* Customer Autocomplete */}
                              <Col lg="12">
                                 <PartyAutocompleteInput
                                    value={watchedCustomerName || ''}
                                    onChange={(e) => {
                                       const val = (e && e.target) ? e.target.value : (typeof e === 'string' ? e : '');
                                       setValue('customerName', val, { shouldValidate: true, shouldDirty: true });
                                    }}
                                    onSelectParty={handlePartySelect}
                                    onClearParty={handleClearParty}
                                    onDetachParty={handleDetachParty}
                                    isInvalid={!!errors.customerName}
                                    errorMessage={errors.customerName?.message}
                                    placeholder="Search customer party by legal name, trade name or code..."
                                    label="Customer / Client Legal Name"
                                    required
                                 />
                              </Col>

                              {/* Customer Billing Address & Symmetrical Facility Selector */}
                              <Col lg="6" md="12">
                                 <div className="address-section-header flex-wrap gap-2 mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                       <FaBuilding className="text-primary" />
                                       <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.88rem' }}>Customer Billing Address</h6>
                                    </div>
                                    <span className="badge bg-soft-primary text-primary border border-primary-subtle rounded-pill px-2 py-0.5" style={{ fontSize: '0.70rem' }}>
                                       Invoicing Branch
                                    </span>
                                 </div>

                                 <div className="facility-select-card active-billing mb-2">
                                    <div className="d-flex align-items-center gap-2 text-truncate">
                                       <FaBuilding className="text-primary flex-shrink-0" size={13} />
                                       <span className="small text-secondary fw-semibold text-nowrap" style={{ fontSize: '0.78rem' }}>Billing Facility:</span>
                                    </div>
                                    {partyBranches && partyBranches.length > 1 ? (
                                       <Form.Select
                                          size="sm"
                                          value={selectedBillingBranchId || ''}
                                          onChange={(e) => handleSelectBillingBranch(Number(e.target.value))}
                                          disabled={isLoadingBranches}
                                          className="facility-select"
                                       >
                                          {partyBranches.map((branch) => (
                                             <option key={branch.id} value={branch.id}>
                                                {branch.branchName || branch.branchCode || 'Branch'} {branch.cityName ? `• ${branch.cityName}` : ''} {branch.isDefault ? '★ (Default)' : ''}
                                             </option>
                                          ))}
                                       </Form.Select>
                                    ) : partyBranches && partyBranches.length === 1 ? (
                                       <span className="fw-semibold text-dark small text-truncate d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                          {partyBranches[0]?.branchName || 'Head Office'}
                                          {partyBranches[0]?.cityName && ` (${partyBranches[0]?.cityName})`}
                                          {partyBranches[0]?.isDefault && <span className="badge bg-soft-primary text-primary rounded-pill px-1.5 py-0.5 ms-1" style={{ fontSize: '0.68rem' }}>Default ★</span>}
                                       </span>
                                    ) : (
                                       <span className="text-muted small fst-italic" style={{ fontSize: '0.78rem' }}>
                                          {watchedCustomerName ? 'Direct Customer Billing' : 'Select Customer'}
                                       </span>
                                    )}
                                 </div>

                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       as="textarea"
                                       id="billingAddress"
                                       placeholder="Billing Address"
                                       style={{ minHeight: '85px' }}
                                       isInvalid={!!errors.billingAddress}
                                       {...register("billingAddress")}
                                    />
                                    <Form.Label htmlFor="billingAddress" className="d-flex align-items-center gap-1.5">
                                       <FaBuilding size={10} className="text-secondary" />
                                       <span>Customer Billing Address (for Invoicing)</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.billingAddress?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              {/* Site Delivery Address & Symmetrical Facility Selector */}
                              <Col lg="6" md="12">
                                 <div className="address-section-header flex-wrap gap-2 mb-2 d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                       <FaMapMarkerAlt className="text-success" />
                                       <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.88rem' }}>Delivery Site / Consignee Address</h6>
                                    </div>
                                    <Button
                                       variant="link"
                                       size="sm"
                                       className="p-0 text-decoration-none small text-primary fw-semibold d-flex align-items-center gap-1"
                                       style={{ fontSize: '0.73rem' }}
                                       onClick={handleCopyBillingToDelivery}
                                       title="Copy billing address to delivery address"
                                    >
                                       <FaCopy size={11} />
                                       <span>Same as Billing</span>
                                    </Button>
                                 </div>

                                 <div className="facility-select-card active-shipping mb-2">
                                    <div className="d-flex align-items-center gap-2 text-truncate">
                                       <FaTruck className="text-success flex-shrink-0" size={13} />
                                       <span className="small text-secondary fw-semibold text-nowrap" style={{ fontSize: '0.78rem' }}>Delivery Site Branch:</span>
                                    </div>
                                    {partyBranches && partyBranches.length > 1 ? (
                                       <Form.Select
                                          size="sm"
                                          value={selectedDeliveryBranchId || selectedBranchId || ''}
                                          onChange={(e) => handleSelectDeliveryBranch(Number(e.target.value))}
                                          disabled={isLoadingBranches}
                                          className="facility-select border-success-subtle fw-semibold"
                                       >
                                          {partyBranches.map((branch) => (
                                             <option key={branch.id} value={branch.id}>
                                                {branch.branchName || branch.branchCode || 'Branch'} {branch.cityName ? `• ${branch.cityName}` : ''} {branch.isDefault ? '★ (Default)' : ''}
                                             </option>
                                          ))}
                                       </Form.Select>
                                    ) : partyBranches && partyBranches.length === 1 ? (
                                       <span className="fw-semibold text-dark small text-truncate d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                          {partyBranches[0]?.branchName || 'Primary Facility'}
                                          {partyBranches[0]?.cityName && ` (${partyBranches[0]?.cityName})`}
                                          {partyBranches[0]?.isDefault && <span className="badge bg-soft-success text-success rounded-pill px-1.5 py-0.5 ms-1" style={{ fontSize: '0.68rem' }}>Default ★</span>}
                                       </span>
                                    ) : (
                                       <span className="text-muted small fst-italic" style={{ fontSize: '0.78rem' }}>
                                          {watchedCustomerName ? 'Direct Site Delivery' : 'Select Customer'}
                                       </span>
                                    )}
                                 </div>

                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       as="textarea"
                                       id="deliveryAddress"
                                       placeholder="Site Delivery Address"
                                       style={{ minHeight: '85px' }}
                                       isInvalid={!!errors.deliveryAddress}
                                       {...register("deliveryAddress")}
                                    />
                                    <Form.Label htmlFor="deliveryAddress" className="d-flex align-items-center gap-1.5">
                                       <FaMapMarkerAlt size={10} className="text-danger" />
                                       <span>Site Delivery / Dispatch Address</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.deliveryAddress?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>
                           </Row>
                        </div>

                        {/* SECTION 3: SCOPE OF WORK (LINE ITEMS) */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge info">
                                    <FaBoxes />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Ordered Scope & Technical Deliverables</h6>
                                    <p className="section-subtitle">Scope descriptions, engineering drawings, quantities and contracted rates</p>
                                 </div>
                              </div>
                           </div>

                           <div className="invoice-items-wrapper">
                              <div className="invoice-table-scroll-container">
                                 <Table className="table-sortable align-middle mb-0" striped bordered hover>
                                    <thead>
                                       <tr className="invoice-table-header-row">
                                          <th style={{ width: '42px', minWidth: '42px' }} className="py-2 text-center">#</th>
                                          <th style={{ minWidth: '260px' }} className="py-2 text-start ps-3">
                                             Item Name / Scope Description <span className="text-danger">*</span>
                                          </th>
                                          <th style={{ width: '105px', minWidth: '95px' }} className="py-2 text-center">HSN/SAC</th>
                                          <th style={{ width: '90px', minWidth: '80px' }} className="py-2 text-end pe-2">
                                             Qty <span className="text-danger">*</span>
                                          </th>
                                          {isEditMode && (
                                             <th style={{ width: '100px', minWidth: '90px' }} className="py-2 text-center">Billed Qty</th>
                                          )}
                                          <th style={{ width: '110px', minWidth: '95px' }} className="py-2 text-center">
                                             Unit <span className="text-danger">*</span>
                                          </th>
                                          <th style={{ width: '125px', minWidth: '115px' }} className="py-2 text-end pe-2">
                                             Rate (₹) <span className="text-danger">*</span>
                                          </th>
                                          <th style={{ width: '125px', minWidth: '115px' }} className="py-2 text-end pe-2">
                                             Sub Total (₹) <span className="th-badge-auto">Auto</span>
                                          </th>
                                          <th style={{ width: '90px', minWidth: '85px' }} className="py-2 text-center">
                                             GST %
                                          </th>
                                          <th style={{ width: '135px', minWidth: '125px' }} className="py-2 text-end pe-3">
                                             Total (₹) <span className="th-badge-calc">Total</span>
                                          </th>
                                          <th style={{ width: '65px', minWidth: '65px' }} className="py-2 text-center">Actions</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {fields.map((field, idx) => (
                                          <tr key={field.id}>
                                             <td className="text-center text-muted small fw-medium">{idx + 1}</td>
                                             <td className="ps-2 pe-2">
                                                <ProductAutocompleteInput
                                                   value={watchedItems?.[idx]?.itemName || ''}
                                                   onChange={(e) => {
                                                      setValue(`items.${idx}.itemName`, e.target.value, { shouldValidate: true, shouldDirty: true });
                                                      setValue(`items.${idx}.productId`, null, { shouldDirty: true });
                                                   }}
                                                   onClear={() => {
                                                      setValue(`items.${idx}.productId`, null, { shouldDirty: true });
                                                      setValue(`items.${idx}.itemName`, '', { shouldValidate: true, shouldDirty: true });
                                                   }}
                                                   onSelectProduct={(product) => handleProductSelect(idx, product)}
                                                   placeholder="Search catalog or type custom item..."
                                                   isInvalid={!!errors.items?.[idx]?.itemName}
                                                   errorMessage={errors.items?.[idx]?.itemName?.message}
                                                />
                                                <Form.Control
                                                   type="text"
                                                   size="sm"
                                                   className="mt-1 small text-muted border-dashed"
                                                   placeholder="Drawing no / Technical specification..."
                                                   {...register(`items.${idx}.description`)}
                                                />
                                             </td>
                                             <td>
                                                <Form.Control
                                                   type="text"
                                                   size="sm"
                                                   className="text-center font-monospace"
                                                   placeholder="e.g. 7308"
                                                   {...register(`items.${idx}.hsnSacCode`)}
                                                />
                                             </td>
                                             <td>
                                                <Form.Control
                                                   type="number"
                                                   step="any"
                                                   min="0.01"
                                                   size="sm"
                                                   className="text-end font-monospace fw-bold"
                                                   isInvalid={!!errors.items?.[idx]?.qty}
                                                   {...register(`items.${idx}.qty`, {
                                                      onChange: () => handleQtyOrRateChange(idx)
                                                   })}
                                                />
                                             </td>
                                             {isEditMode && (
                                                <td className="text-center align-middle">
                                                   <div>
                                                      <span
                                                         className={`badge rounded-pill fw-semibold ${
                                                            Number(watchedItems?.[idx]?.invoicedQty) >= Number(watchedItems?.[idx]?.qty)
                                                               ? 'bg-success text-white'
                                                               : Number(watchedItems?.[idx]?.invoicedQty) > 0
                                                               ? 'bg-primary text-white'
                                                               : 'bg-light text-muted border'
                                                         }`}
                                                         style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                                                         title={`Billed: ${Number(watchedItems?.[idx]?.invoicedQty || 0).toFixed(2)} / Ordered: ${Number(watchedItems?.[idx]?.qty || 0).toFixed(2)}`}
                                                      >
                                                         {Number(watchedItems?.[idx]?.invoicedQty || 0).toFixed(2)}
                                                      </span>
                                                      {Number(watchedItems?.[idx]?.invoicedQty) > 0 && Number(watchedItems?.[idx]?.invoicedQty) < Number(watchedItems?.[idx]?.qty) && (
                                                         <div className="text-muted font-monospace" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                                                            Bal: {(Number(watchedItems?.[idx]?.qty || 0) - Number(watchedItems?.[idx]?.invoicedQty || 0)).toFixed(2)}
                                                         </div>
                                                      )}
                                                   </div>
                                                </td>
                                             )}
                                             <td>
                                                <Form.Select size="sm" className="text-center" {...register(`items.${idx}.unit`)}>
                                                   {productUnits && productUnits.length > 0 ? (
                                                      productUnits.map(u => (
                                                         <option key={u.id || u.uqc} value={u.uqc}>
                                                            {u.uqc} {u.description ? `(${u.description})` : ''}
                                                         </option>
                                                      ))
                                                   ) : (
                                                      <option value="Nos">Nos</option>
                                                   )}
                                                </Form.Select>
                                             </td>
                                             <td>
                                                <Form.Control
                                                   type="number"
                                                   step="any"
                                                   min="0"
                                                   size="sm"
                                                   className="text-end font-monospace"
                                                   placeholder="0.00"
                                                   {...register(`items.${idx}.rate`, {
                                                      onChange: () => handleQtyOrRateChange(idx)
                                                   })}
                                                />
                                             </td>
                                             <td>
                                                <Form.Control
                                                   type="number"
                                                   size="sm"
                                                   readOnly
                                                   className="text-end font-monospace bg-light"
                                                   value={watchedItems?.[idx]?.taxableAmount ?? 0}
                                                />
                                             </td>
                                             <td>
                                                <Form.Select
                                                   size="sm"
                                                   className="text-center font-monospace"
                                                   {...register(`items.${idx}.gstRate`, {
                                                      onChange: () => handleQtyOrRateChange(idx)
                                                   })}
                                                >
                                                   <option value="0">0%</option>
                                                   <option value="5">5%</option>
                                                   <option value="12">12%</option>
                                                   <option value="18">18%</option>
                                                   <option value="28">28%</option>
                                                </Form.Select>
                                             </td>
                                             <td>
                                                <Form.Control
                                                   type="number"
                                                   size="sm"
                                                   readOnly
                                                   className="text-end font-monospace fw-bold bg-light"
                                                   value={watchedItems?.[idx]?.total ?? 0}
                                                />
                                             </td>
                                             <td className="text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                   <Button
                                                      variant="link"
                                                      size="sm"
                                                      className="p-1 text-muted"
                                                      title="Duplicate row"
                                                      onClick={() => handleDuplicateRow(idx)}
                                                   >
                                                      <FaCopy size={12} />
                                                   </Button>
                                                   {fields.length > 1 && (
                                                      <Button
                                                         variant="link"
                                                         size="sm"
                                                         className="p-1 text-danger"
                                                         title="Delete row"
                                                         onClick={() => remove(idx)}
                                                      >
                                                         <FaTrash size={12} />
                                                      </Button>
                                                   )}
                                                </div>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </Table>
                              </div>

                              {/* Table Footer Action & Summary Toolbar matching InvoiceItemsTable */}
                              <div className="invoice-table-footer-toolbar">
                                 <div className="d-flex align-items-center gap-2">
                                    <button
                                       type="button"
                                       className="btn-add-line-row"
                                       onClick={handleAddItem}
                                       title="Add line item to this purchase order"
                                    >
                                       <span className="btn-icon-wrap">
                                          <FaPlus size={10} />
                                       </span>
                                       <span className="btn-text">Add Line Item</span>
                                    </button>
                                 </div>

                                 <div className="table-footer-stats">
                                    <div className="stat-pill" title="Total number of line items">
                                       <span className="stat-label">Items:</span>
                                       <span className="stat-value">{fields.length}</span>
                                    </div>
                                    <div className="stat-pill highlight" title="Sum of all ordered quantities">
                                       <span className="stat-label">Total Qty:</span>
                                       <span className="stat-value font-monospace">
                                          {Number(totalQty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* SECTION 4: COMMERCIAL TERMS & ACCOUNTING BREAKDOWN */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge warning">
                                    <FaCoins />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Commercial Terms & Accounting Summary</h6>
                                    <p className="section-subtitle">Payment milestones, advance requirements, validity, and financial totals</p>
                                 </div>
                              </div>
                           </div>

                           <Row className="g-4">
                              {/* Left Column: Commercial Milestones, Validity & Notes */}
                              <Col lg="6">
                                 <Row className="g-3">
                                    <Col lg="6" md="6">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="text"
                                             id="paymentTerms"
                                             placeholder="Payment Terms"
                                             {...register("paymentTerms")}
                                          />
                                          <Form.Label htmlFor="paymentTerms">Payment Terms (e.g. 30 Days Net)</Form.Label>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="6" md="6">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             type="number"
                                             step="any"
                                             min="0"
                                             max="100"
                                             id="advancePercentage"
                                             placeholder="Advance %"
                                             className="font-monospace"
                                             {...register("advancePercentage")}
                                          />
                                          <Form.Label htmlFor="advancePercentage">Advance Required (%)</Form.Label>
                                       </Form.Floating>
                                    </Col>

                                    <Col lg="12">
                                       <Controller
                                          name="validUntil"
                                          control={control}
                                          render={({ field, fieldState: { error } }) => (
                                             <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                                <Flatpickr
                                                   {...field}
                                                   id="validUntil"
                                                   value={field.value}
                                                   onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                                   options={DATE_PICKER_OPTIONS}
                                                   className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                   placeholder=" "
                                                />
                                                <Form.Label htmlFor="validUntil">
                                                   Validity Window (Valid Until)
                                                </Form.Label>
                                                <FaRegCalendarAlt className="floating-date-icon" />
                                                <Form.Control.Feedback type="invalid">
                                                   {error?.message}
                                                </Form.Control.Feedback>
                                             </Form.Floating>
                                          )}
                                       />
                                    </Col>

                                    <Col lg="12">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                          <Form.Control
                                             as="textarea"
                                             id="notes"
                                             placeholder="Commercial Remarks"
                                             style={{ minHeight: '80px' }}
                                             {...register("notes")}
                                          />
                                          <Form.Label htmlFor="notes">Order Notes / Terms & Conditions</Form.Label>
                                       </Form.Floating>
                                    </Col>
                                 </Row>

                                 {/* Amount in Words Card matching InvoiceForm */}
                                 <div className="amount-in-words-box mt-3">
                                    <div className="words-label d-flex align-items-center gap-1">
                                       <FaMoneyBillWave size={12} className="text-primary" /> Amount in Words
                                    </div>
                                    <div className="words-text">{amountInWords}</div>
                                 </div>
                              </Col>

                              {/* Right Column: Structured ERP Accounting Summary Card matching InvoiceForm */}
                              <Col lg="6">
                                 <div className="invoice-summary-card">
                                    <div className="summary-header">
                                       <span>Order Value Breakdown</span>
                                       <Badge bg="primary-subtle" text="primary" className="border border-primary-subtle">
                                          GST Applicable
                                       </Badge>
                                    </div>

                                    {/* Sub Total (Taxable Scope) */}
                                    <div className="summary-row">
                                       <span className="label">Taxable Scope Sub Total</span>
                                       <span className="value">
                                          ₹ {Number(subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </span>
                                    </div>

                                    {/* Taxable Amount Highlight */}
                                    <div className="summary-row highlight">
                                       <span className="label">Taxable Amount</span>
                                       <span className="value">
                                          ₹ {Number(subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </span>
                                    </div>

                                    {/* GST Total */}
                                    <div className="summary-row">
                                       <span className="label">GST Tax Total</span>
                                       <span className="value">
                                          + ₹ {Number(taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </span>
                                    </div>

                                    {/* Advance Payable if specified */}
                                    {Number(watchedAdvance || 0) > 0 && (
                                       <div className="summary-row text-primary">
                                          <span className="label">Advance Required ({watchedAdvance}%)</span>
                                          <span className="value font-monospace fw-bold">
                                             ₹ {Number(advanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                       </div>
                                    )}

                                    {/* Grand Total Banner */}
                                    <div className="grand-total-banner">
                                       <div className="total-title">Total Contract Value</div>
                                       <div className="total-amount">
                                          ₹ {Number(totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </div>
                                    </div>
                                 </div>
                              </Col>
                           </Row>
                        </div>

                        {/* SECTION 5: PHYSICAL PO ATTACHMENTS & CONTRACT COPIES */}
                        <div className="form-section-card mb-0">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge primary">
                                    <FaPaperclip />
                                 </div>
                                 <div>
                                    <h6 className="section-title">PO Documents & Contract Attachments</h6>
                                    <p className="section-subtitle">Physical copies of client signed PO, approved fabrication drawings, or amendment letters</p>
                                 </div>
                              </div>
                           </div>

                           <AttachmentManager
                              entityType="PURCHASE_ORDER"
                              entityId={poId}
                              documentTypes={PO_DOC_TYPES}
                              allowMultiple
                           />
                        </div>
                     </Card.Body>
                  </Card>
               </Col>
            </Row>
         </Form>
      </div>
   );
};

export default PurchaseOrderForm;
