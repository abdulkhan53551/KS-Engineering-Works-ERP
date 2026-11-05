import React, { useMemo } from 'react';
import { Row, Col, Form, Card, Button, Table } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Flatpickr from "react-flatpickr";
import { Controller, useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { useQueryClient } from '@tanstack/react-query';
import { useGetInvoiceChallanById } from '../hooks/useApi';
import useHandleSubmit from '../hooks/useHandleSubmit';
import useFormInit from '../hooks/useFormInit';
import useChallanPartySync from '../hooks/useChallanPartySync';
import useChallanItems from '../hooks/useChallanItems';
import { getPreviewNextChallanNumber } from '../utils/challanNumbering';
import { createInvoiceChallanValidationSchema, updateInvoiceChallanValidationSchema } from '../../../validation/invoiceChallan.validation';
import SubmitButton from '../../../components/SubmitButton';
import { 
   FaRegCalendarAlt, 
   FaTruck, 
   FaBoxes, 
   FaPlus, 
   FaTrash, 
   FaBuilding, 
   FaArrowLeft,
   FaCopy,
   FaMapMarkerAlt,
   FaStickyNote,
   FaPaperclip,
   FaInfoCircle,
   FaLock
} from 'react-icons/fa';
import AttachmentManager from '../../../components/attachments/AttachmentManager';
import PartyAutocompleteInput from '../../invoice/components/PartyAutocompleteInput';
import ProductAutocompleteInput from '../../products/components/ProductAutocompleteInput';

// Import unified invoice styling system
import '../../invoice/pages/invoice.scss';
import '../../invoice/pages/invoice-list-modern.scss';

const CHALLAN_DOC_TYPES = [
   { value: 'SIGNED_CHALLAN', label: 'Signed Delivery Challan / Gate Pass' },
   { value: 'WEIGHBRIDGE_SLIP', label: 'Weighbridge / Scale Slip' },
   { value: 'LR_COPY', label: 'Lorry Receipt (LR / Bilty) Copy' },
   { value: 'OTHER', label: 'General / Other Document' }
];

const DISPATCH_REASONS = [
   { value: 'Supply on Delivery', label: 'Supply on Delivery (Standard Sales)' },
   { value: 'Job Work / Processing', label: 'Goods for Job Work / Processing' },
   { value: 'Supply on Approval', label: 'Supply on Approval / Returnable' },
   { value: 'Exhibition / Demo', label: 'Exhibition / Site Demonstration' },
   { value: 'Replacement / Repair', label: 'Replacement / Warranty Repair' },
   { value: 'Other', label: 'Other' }
];

const TRANSPORT_MODES = [
   'Road',
   'Tempo / Mini Truck',
   'Heavy Truck / Trailer',
   'Courier / Cargo',
   'Rail',
   'Hand Delivery / By Hand'
];

const DATE_PICKER_OPTIONS = {
   dateFormat: "d/m/Y",
   defaultDate: ["today"],
};

// Static default form state defined at module level to guarantee stable object reference across renders
const defaultFormValue = {
   challanNo: '',
   challanDate: new Date(),
   customerName: '',
   partyId: null,
   partyBranchId: null,
   deliveryAddress: '',
   transportMode: 'Road',
   vehicleNo: '',
   transporterName: '',
   lrNo: '',
   dispatchReason: 'Supply on Delivery',
   status: 'DISPATCHED',
   notes: '',
   items: [
      { itemName: '', description: '', hsnSacCode: '', qty: 1, unit: 'Nos', rate: 0, total: 0 }
   ]
};

const InvoiceChallan = ({ mode }) => {
   const { id: challanId } = useParams();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const isEditMode = Boolean(mode === 'edit');

   // Calculate preview challan number synchronously from React Query cache for instant 0-lag initial state
   const initialPreviewChallanNo = useMemo(() => {
      return !isEditMode ? getPreviewNextChallanNumber(queryClient) : '';
   }, [isEditMode, queryClient]);

   const {
      register, handleSubmit, setValue, getValues, reset, control, formState: { errors }
   } = useForm({
      resolver: joiResolver(isEditMode ? updateInvoiceChallanValidationSchema : createInvoiceChallanValidationSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
         invoiceId: null,
         ...defaultFormValue,
         challanNo: initialPreviewChallanNo
      }
   });

   const watchedStatus = useWatch({ control, name: "status" });
   const watchedCustomerName = useWatch({ control, name: "customerName" });

   // 1. API Queries & Initial Form Hydration
   const { data: invoiceChallan = {} } = useGetInvoiceChallanById(challanId);
   const { onSubmit, onError, createInvoiceChallanIsPending, updateInvoiceChallanIsPending } = useHandleSubmit({ challanId, isEditMode });
   useFormInit({ invoiceChallan, isEditMode, reset });

   // 2. Business Logic Hook: Party Selection & Multi-Branch Delivery Address Sync
   const {
      selectedParty,
      partyBranches,
      selectedBranchId,
      isLoadingBranches,
      handleSelectBranch,
      handlePartySelect,
      handleClearParty,
      handleDetachParty
   } = useChallanPartySync({
      setValue,
      getValues,
      initialPartyId: invoiceChallan.partyId,
      initialPartyBranchId: invoiceChallan.partyBranchId,
      isEditMode
   });

   // 3. Business Logic Hook: Line Items, Calculations & Product Units Master
   const {
      fields,
      productUnits,
      watchedItems,
      totalQty,
      totalApproxVal,
      handleQtyOrRateChange,
      handleDuplicateRow,
      handleAddItem,
      handleProductSelect,
      remove
   } = useChallanItems({ control, setValue, getValues });

   const handleBack = () => {
      if (window.history.length > 1) {
         navigate(-1);
      } else {
         navigate('/sales/challans');
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
                                    {isEditMode ? `Delivery Challan: ${invoiceChallan.challanNo || ''}` : 'New Delivery Challan'}
                                 </h4>
                                 <span className="readonly-pill-tag primary" style={{ fontSize: '0.68rem' }}>
                                    {isEditMode ? 'EDIT MODE' : 'CREATE'}
                                 </span>
                                 {invoiceChallan.invoiceId && (
                                    <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.70rem', padding: '3px 8px' }}>
                                       ✓ Invoiced (#{invoiceChallan.invoiceNo})
                                    </span>
                                 )}
                              </div>
                              <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                                 Goods dispatch note & gate pass under Rule 55 of CGST Rules
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
                              isLoading={createInvoiceChallanIsPending || updateInvoiceChallanIsPending}
                              isEditMode={isEditMode}
                              label={isEditMode ? "Save Changes" : "Create Challan"}
                           />
                        </div>
                     </Card.Header>

                     <Card.Body className="p-4" style={{ backgroundColor: '#fafbfc' }}>
                        {/* SECTION 1: CHALLAN METADATA & PARTICULARS */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge primary">
                                    <FaBoxes />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Challan Metadata & Reason</h6>
                                    <p className="section-subtitle">Challan numbering, dispatch date, and statutory purpose</p>
                                 </div>
                              </div>
                              <div>
                                 <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.72rem', padding: '3px 9px' }}>
                                    Status: <strong className="text-uppercase">{watchedStatus || 'DISPATCHED'}</strong>
                                 </span>
                              </div>
                           </div>

                           <Row className="g-3">
                              {/* Challan No (Auto-Incremented, Non-Editable) */}
                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       type="text"
                                       id="challanNo"
                                       placeholder="Challan No"
                                       readOnly
                                       style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#1e293b' }}
                                       isInvalid={!!errors.challanNo}
                                       className="font-monospace fw-bold"
                                       {...register("challanNo")}
                                    />
                                    <Form.Label htmlFor="challanNo" className="d-flex align-items-center justify-content-between pe-2 w-100">
                                       <span>Challan No</span>
                                       <span className="badge bg-soft-primary text-primary px-1.5 py-0.5 rounded-pill" style={{ fontSize: '0.66rem' }}>
                                          <FaLock size={8} className="me-1" /> {isEditMode ? 'LOCKED' : 'AUTO-ASSIGNED'}
                                       </span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.challanNo?.message}</Form.Control.Feedback>
                                 </Form.Floating>
                              </Col>

                              {/* Challan Date */}
                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <div className="input-group">
                                       <span className="input-group-text bg-light text-muted">
                                          <FaRegCalendarAlt size={12} />
                                       </span>
                                       <Controller
                                          name="challanDate"
                                          control={control}
                                          defaultValue={new Date()}
                                          render={({ field, fieldState: { error } }) => (
                                             <Flatpickr
                                                {...field}
                                                value={field.value}
                                                onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                                options={DATE_PICKER_OPTIONS}
                                                className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                placeholder="Select Date..."
                                             />
                                          )}
                                       />
                                    </div>
                                    {errors.challanDate && (
                                       <span className="text-danger small">{errors.challanDate.message}</span>
                                    )}
                                 </Form.Floating>
                              </Col>

                              {/* Dispatch Reason */}
                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Select id="dispatchReason" {...register("dispatchReason")}>
                                       {DISPATCH_REASONS.map(r => (
                                          <option key={r.value} value={r.value}>{r.label}</option>
                                       ))}
                                    </Form.Select>
                                    <Form.Label htmlFor="dispatchReason">Dispatch Reason</Form.Label>
                                 </Form.Floating>
                              </Col>

                              {/* Status */}
                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Select id="status" {...register("status")}>
                                       <option value="DISPATCHED">Dispatched (Unbilled)</option>
                                       <option value="DRAFT">Draft</option>
                                       <option value="BILLED">Billed (Invoiced)</option>
                                       <option value="CANCELLED">Cancelled</option>
                                    </Form.Select>
                                    <Form.Label htmlFor="status">Challan Status</Form.Label>
                                 </Form.Floating>
                              </Col>
                           </Row>
                        </div>

                        {/* SECTION 2: CONSIGNEE & DESTINATION */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge success">
                                    <FaBuilding />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Consignee & Site Destination</h6>
                                    <p className="section-subtitle">Customer identity, destination branch facility, and site delivery address</p>
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
                              <Col lg="6" md="12">
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
                                    placeholder="Search party by name or code..."
                                    label="Customer / Consignee Name"
                                    required
                                 />
                              </Col>

                              {/* Multi-Branch Facility Picker */}
                              <Col lg="6" md="12">
                                 {isLoadingBranches ? (
                                    <div className="p-2.5 rounded border bg-light h-100 d-flex align-items-center justify-content-center gap-2 text-muted small" style={{ fontSize: '0.80rem' }}>
                                       <span className="spinner-border spinner-border-sm text-primary" role="status" />
                                       <span>Loading customer branches...</span>
                                    </div>
                                 ) : partyBranches && partyBranches.length > 1 ? (
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                       <Form.Select
                                          id="partyBranchId"
                                          value={selectedBranchId || ''}
                                          onChange={(e) => handleSelectBranch(Number(e.target.value))}
                                          className="fw-semibold text-primary"
                                       >
                                          {partyBranches.map((branch) => (
                                             <option key={branch.id} value={branch.id}>
                                                {branch.branchName || branch.branchCode || 'Branch'} {branch.cityName ? `• ${branch.cityName}` : ''} {branch.isDefault ? '★ (Default)' : branch.isHeadOffice ? '• Head Office' : ''}
                                             </option>
                                          ))}
                                       </Form.Select>
                                       <Form.Label htmlFor="partyBranchId" className="d-flex align-items-center gap-1.5 text-primary fw-semibold">
                                          <FaBuilding size={11} />
                                          <span>Delivery Facility / Branch ({partyBranches.length} locations)</span>
                                       </Form.Label>
                                    </Form.Floating>
                                 ) : partyBranches && partyBranches.length === 1 ? (
                                    <div className="p-2.5 rounded border bg-light h-100 d-flex flex-column justify-content-center">
                                       <div className="d-flex align-items-center justify-content-between mb-0.5">
                                          <span className="small text-muted fw-semibold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                             Delivery Location
                                          </span>
                                          {partyBranches[0].isDefault && (
                                             <span className="badge bg-soft-primary text-primary rounded-pill px-1.5 py-0.5" style={{ fontSize: '0.66rem' }}>
                                                Default ★
                                             </span>
                                          )}
                                       </div>
                                       <div className="fw-bold text-dark small text-truncate d-flex align-items-center gap-1.5" style={{ fontSize: '0.82rem' }}>
                                          <FaBuilding className="text-primary" size={11} />
                                          <span>{partyBranches[0].branchName || 'Head Office'}</span>
                                          {partyBranches[0].cityName && <span className="text-muted fw-normal">({partyBranches[0].cityName})</span>}
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="p-2.5 rounded border bg-light h-100 d-flex align-items-center text-muted small" style={{ fontSize: '0.80rem' }}>
                                       <FaInfoCircle size={13} className="me-2 text-secondary flex-shrink-0" />
                                       <span>
                                          {watchedCustomerName ? 'Ad-hoc consignee / Direct site delivery' : 'Select a customer to view registered delivery branches'}
                                       </span>
                                    </div>
                                 )}
                              </Col>

                              {/* Delivery Site Address */}
                              <Col lg="12">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       as="textarea"
                                       id="deliveryAddress"
                                       placeholder="Site Address"
                                       style={{ minHeight: '75px' }}
                                       {...register("deliveryAddress")}
                                    />
                                    <Form.Label htmlFor="deliveryAddress" className="d-flex align-items-center justify-content-between w-100 pe-3">
                                       <span className="d-flex align-items-center gap-1.5">
                                          <FaMapMarkerAlt size={10} className="text-danger" />
                                          <span>Delivery Site Address (Place of Unloading / Supply)</span>
                                       </span>
                                       {selectedBranchId && (
                                          <span className="text-success fw-normal small" style={{ fontSize: '0.72rem' }}>
                                             ✓ Auto-synced with selected branch (editable for gate / bay details)
                                          </span>
                                       )}
                                    </Form.Label>
                                 </Form.Floating>
                              </Col>
                           </Row>
                        </div>

                        {/* SECTION 3: TRANSPORT & VEHICLE LOGISTICS */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge indigo">
                                    <FaTruck />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Transport & Vehicle Details</h6>
                                    <p className="section-subtitle">Logistics vehicle registration, transport agency, and LR details</p>
                                 </div>
                              </div>
                           </div>

                           <Row className="g-3">
                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Select id="transportMode" {...register("transportMode")}>
                                       {TRANSPORT_MODES.map(m => (
                                          <option key={m} value={m}>{m}</option>
                                       ))}
                                    </Form.Select>
                                    <Form.Label htmlFor="transportMode">Transport Mode</Form.Label>
                                 </Form.Floating>
                              </Col>

                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       type="text"
                                       id="vehicleNo"
                                       placeholder="Vehicle No"
                                       className="font-monospace text-uppercase fw-bold"
                                       {...register("vehicleNo")}
                                    />
                                    <Form.Label htmlFor="vehicleNo">Vehicle Reg. Number</Form.Label>
                                 </Form.Floating>
                              </Col>

                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       type="text"
                                       id="transporterName"
                                       placeholder="Transporter Name"
                                       {...register("transporterName")}
                                    />
                                    <Form.Label htmlFor="transporterName">Transporter Name / Agency</Form.Label>
                                 </Form.Floating>
                              </Col>

                              <Col lg="3" md="6">
                                 <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                       type="text"
                                       id="lrNo"
                                       placeholder="LR No"
                                       className="font-monospace"
                                       {...register("lrNo")}
                                    />
                                    <Form.Label htmlFor="lrNo">LR / Bilty Number</Form.Label>
                                 </Form.Floating>
                              </Col>
                           </Row>
                        </div>

                        {/* SECTION 4: PARTICULARS OF GOODS DISPATCHED (LINE ITEMS) */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge primary">
                                    <FaBoxes />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Particulars of Goods Dispatched</h6>
                                    <p className="section-subtitle">Fabricated items, quantities, drawing references, and notional rate</p>
                                 </div>
                              </div>
                              <Button
                                 variant="outline-primary"
                                 size="sm"
                                 className="d-flex align-items-center gap-1.5 rounded-pill px-3 shadow-none fw-semibold"
                                 style={{ fontSize: '0.80rem' }}
                                 onClick={handleAddItem}
                              >
                                 <FaPlus size={10} /> Add Item Row
                              </Button>
                           </div>

                           <div className="invoice-items-wrapper">
                              <div className="invoice-table-scroll-container">
                                 <Table className="table-sortable align-middle mb-0" striped bordered hover>
                                    <thead>
                                       <tr className="invoice-table-header-row">
                                          <th style={{ width: '42px', minWidth: '42px' }} className="py-2 text-center">#</th>
                                          <th style={{ minWidth: '280px' }} className="py-2 text-start ps-3">
                                             Item Name / Description <span className="text-danger">*</span>
                                          </th>
                                          <th style={{ width: '120px', minWidth: '100px' }} className="py-2 text-center">HSN Code</th>
                                          <th style={{ width: '110px', minWidth: '95px' }} className="py-2 text-end pe-2">
                                             Qty <span className="text-danger">*</span>
                                          </th>
                                          <th style={{ width: '130px', minWidth: '110px' }} className="py-2 text-center">Unit</th>
                                          <th style={{ width: '135px', minWidth: '120px' }} className="py-2 text-end pe-2">Approx Rate (₹)</th>
                                          <th style={{ width: '135px', minWidth: '125px' }} className="py-2 text-end pe-2">
                                             Approx Total (₹) <span className="th-badge-auto">Auto</span>
                                          </th>
                                          <th style={{ width: '70px', minWidth: '70px' }} className="py-2 text-center">Actions</th>
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
                                                   placeholder="Enter or search item / fabricated product..."
                                                   isInvalid={!!errors.items?.[idx]?.itemName}
                                                   errorMessage={errors.items?.[idx]?.itemName?.message}
                                                />
                                                <Form.Control
                                                   type="text"
                                                   size="sm"
                                                   className="mt-1 small text-muted border-dashed"
                                                   placeholder="Drawing no / Specification remark (optional)..."
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
                                                   step="any"
                                                   size="sm"
                                                   readOnly
                                                   className="bg-light font-monospace text-end fw-bold text-dark"
                                                   placeholder="0.00"
                                                   {...register(`items.${idx}.total`)}
                                                />
                                             </td>
                                             <td className="text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                   <Button
                                                      variant="link"
                                                      className="p-1 text-secondary"
                                                      onClick={() => handleDuplicateRow(idx)}
                                                      title="Duplicate row"
                                                   >
                                                      <FaCopy size={12} />
                                                   </Button>
                                                   {fields.length > 1 && (
                                                      <Button
                                                         variant="link"
                                                         className="p-1 text-danger"
                                                         onClick={() => remove(idx)}
                                                         title="Delete row"
                                                      >
                                                         <FaTrash size={12} />
                                                      </Button>
                                                   )}
                                                </div>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                    <tfoot className="table-light">
                                       <tr className="fw-bold" style={{ fontSize: '0.82rem' }}>
                                          <td colSpan={3} className="text-end text-secondary">
                                             Total Dispatched Packages / Qty:
                                          </td>
                                          <td className="text-end text-primary font-monospace pe-2">
                                             {totalQty.toFixed(2)}
                                          </td>
                                          <td></td>
                                          <td className="text-end text-secondary pe-2">Approx Transit Value:</td>
                                          <td className="font-monospace text-end text-dark pe-2">
                                             ₹ {totalApproxVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td></td>
                                       </tr>
                                    </tfoot>
                                 </Table>
                              </div>
                           </div>
                        </div>

                        {/* SECTION 5: SPECIAL NOTES & INSTRUCTIONS */}
                        <div className="form-section-card">
                           <div className="form-section-header">
                              <div className="section-title-wrap">
                                 <div className="section-icon-badge primary">
                                    <FaStickyNote />
                                 </div>
                                 <div>
                                    <h6 className="section-title">Gate Pass Remarks & Special Notes</h6>
                                    <p className="section-subtitle">Receiver instructions, driver notes, or job-work terms</p>
                                 </div>
                              </div>
                           </div>

                           <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                              <Form.Control
                                 as="textarea"
                                 id="notes"
                                 placeholder="Notes"
                                 style={{ minHeight: '68px' }}
                                 {...register("notes")}
                              />
                              <Form.Label htmlFor="notes">Remarks / Dispatch Instructions</Form.Label>
                           </Form.Floating>
                        </div>

                        {/* SECTION 6: PHYSICAL PROOFS & GATE PASS DOCUMENTS (IN EDIT MODE) */}
                        {isEditMode && challanId && (
                           <div className="form-section-card">
                              <div className="form-section-header">
                                 <div className="section-title-wrap">
                                    <div className="section-icon-badge success">
                                       <FaPaperclip />
                                    </div>
                                    <div>
                                       <h6 className="section-title">Receiver Proof & Physical Signed Documents</h6>
                                       <p className="section-subtitle">Upload receiver-stamped delivery notes, weighbridge slips, or gate passes</p>
                                    </div>
                                 </div>
                                 <span className="readonly-pill-tag">
                                    ENTITY: CHALLAN #{challanId}
                                 </span>
                              </div>

                              <AttachmentManager
                                 entityType="CHALLAN"
                                 entityId={challanId}
                                 docTypeOptions={CHALLAN_DOC_TYPES}
                                 folder="ks-erp/challans/documents"
                              />
                           </div>
                        )}

                        {/* Bottom Action Footer */}
                        <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
                           <Button
                              variant="light"
                              onClick={handleBack}
                              className="px-4"
                           >
                              Cancel
                           </Button>
                           <SubmitButton
                              isLoading={createInvoiceChallanIsPending || updateInvoiceChallanIsPending}
                              isEditMode={isEditMode}
                              label={isEditMode ? "Save Changes" : "Create & Dispatch Challan"}
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

export default InvoiceChallan;
