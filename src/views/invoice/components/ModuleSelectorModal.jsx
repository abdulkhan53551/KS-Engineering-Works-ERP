import React, { useState, useEffect, useMemo } from 'react';
import { Spinner, Badge, Button, Modal } from 'react-bootstrap';
import {
  FaFileAlt,
  FaFileInvoice,
  FaClipboardList,
  FaShoppingCart,
  FaTruck,
  FaSearch,
  FaTimes,
  FaCheck,
  FaCheckSquare,
  FaSquare,
  FaTrashAlt,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaFolderOpen
} from 'react-icons/fa';
import moment from 'moment';

const moduleConfig = {
  challan: {
    title: 'Delivery Challans',
    singularTitle: 'Challan',
    icon: FaFileInvoice,
    badgeColor: 'primary',
    selectedClass: 'selected',
    subtitle: 'Select customer delivery challans to attach to this invoice.'
  },
  purchaseOrder: {
    title: 'Purchase Orders',
    singularTitle: 'Purchase Order',
    icon: FaShoppingCart,
    badgeColor: 'success',
    selectedClass: 'selected-po',
    subtitle: 'Link customer purchase orders and reference POs to this invoice.'
  },
  ewayBill: {
    title: 'E-Way Bills',
    singularTitle: 'E-Way Bill',
    icon: FaTruck,
    badgeColor: 'rose',
    selectedClass: 'selected-eway',
    subtitle: 'Link valid electronic waybills associated with this delivery.'
  }
};

export function ModuleSelectorModal({
  moduleKey = 'challan',
  invoiceId,
  show,
  onClose,
  selectedIds = [],
  fetchModuleFun,
  onSubmit
}) {
  const [localItems, setLocalItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'selected' | 'unselected'
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const config = moduleConfig[moduleKey] || moduleConfig.challan;
  const ModuleIcon = config.icon;

  const { fetchDocument, deleteDocument } = fetchModuleFun ? fetchModuleFun(moduleKey) : { fetchDocument: () => ({}), deleteDocument: () => ({}) };
  const { data = [], isLoading, isFetching, refetch } = fetchDocument();
  const { mutate: deleteDocumentItem, isSuccess: isDeletedSuccessfully } = deleteDocument();

  useEffect(() => {
    if (show && refetch) {
      refetch();
    }
  }, [show]);

  // Format initial list
  const formattedData = useMemo(() => {
    return (data || []).map(item => {
      const isSelectedInForm = Array.isArray(selectedIds) && selectedIds.includes(item.documentId);
      return {
        id: item.documentId,
        documentNo: item.documentNo || `Doc #${item.documentId}`,
        customerName: item.customerName || 'N/A',
        documentDate: item.documentDate,
        validUpto: item.validUpto,
        selected: isSelectedInForm || Boolean(item?.isInvoiced)
      };
    });
  }, [data, selectedIds]);

  useEffect(() => {
    setLocalItems(formattedData);
    setSearchTerm('');
    setFilterTab('all');
    setConfirmDeleteId(null);
  }, [formattedData, moduleKey, isFetching, isDeletedSuccessfully]);

  // Search & Tab filtering
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return localItems.filter(item => {
      // Tab filter
      if (filterTab === 'selected' && !item.selected) return false;
      if (filterTab === 'unselected' && item.selected) return false;

      // Search term
      if (!term) return true;
      const numMatch = (item.documentNo || '').toLowerCase().includes(term);
      const customerMatch = (item.customerName || '').toLowerCase().includes(term);
      const dateMatch = item.documentDate ? moment(item.documentDate).format('DD/MM/YYYY').includes(term) : false;
      return numMatch || customerMatch || dateMatch;
    });
  }, [localItems, searchTerm, filterTab]);

  const totalSelected = useMemo(() => localItems.filter(i => i.selected).length, [localItems]);
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(i => i.selected);

  // Toggle single item
  const toggleSelection = (id) => {
    setLocalItems(prev => prev.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  // Toggle all visible filtered items
  const toggleAll = () => {
    const filteredIds = new Set(filteredItems.map(i => i.id));
    const nextState = !allFilteredSelected;
    setLocalItems(prev => prev.map(item =>
      filteredIds.has(item.id) ? { ...item, selected: nextState } : item
    ));
  };

  // Clear all selections
  const handleClearAll = () => {
    setLocalItems(prev => prev.map(item => ({ ...item, selected: false })));
  };

  // Handle Delete
  const handleDeleteItem = (id) => {
    setDeletingId(id);
    deleteDocumentItem(
      { id, invoiceId, type: "invoiceChallanPopup" },
      {
        onSettled: () => {
          setDeletingId(null);
          setConfirmDeleteId(null);
        }
      }
    );
  };

  // Handle Submit
  const handleApply = () => {
    const selectedItems = localItems.filter(i => i.selected);
    const selectedIds = selectedItems.map(i => i.id);
    if (onSubmit) {
      onSubmit(moduleKey, selectedIds, selectedItems);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow border-0 rounded-4 overflow-hidden">

            {/* Modal Header */}
            <div className="modal-header bg-white border-bottom px-4 py-3 align-items-center justify-content-between">
              <div>
                <h5 className={`modal-title d-flex align-items-center gap-2 fw-bold text-${config.badgeColor} text-capitalize mb-1`}>
                  <ModuleIcon size={22} />
                  Select {config.title}
                </h5>
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {config.subtitle}
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* Modal Body */}
            <div className="modal-body p-4 bg-light bg-opacity-25">
              {/* Search & Action Controls Bar */}
              <div className="row g-2 align-items-center mb-3">
                <div className="col-md-7">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                      <FaSearch size={13} />
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={`Search by document no, customer, date...`}
                      className="form-control bg-white border-start-0 py-2"
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-outline-secondary border-start-0 bg-white"
                        type="button"
                        onClick={() => setSearchTerm('')}
                      >
                        <FaTimes size={11} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-md-5 d-flex justify-content-end gap-2">
                  <Button
                    variant={allFilteredSelected ? "outline-secondary" : "outline-primary"}
                    size="sm"
                    className="fw-medium px-3 text-nowrap"
                    onClick={toggleAll}
                    disabled={filteredItems.length === 0}
                  >
                    {allFilteredSelected ? "Deselect All" : "Select All"}
                  </Button>
                  {totalSelected > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger text-decoration-none small text-nowrap p-0"
                      onClick={handleClearAll}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="d-flex align-items-center gap-2 mb-3">
                <span
                  className={`filter-tab-pill ${filterTab === 'all' ? 'bg-primary text-white' : 'bg-white text-secondary border'}`}
                  onClick={() => setFilterTab('all')}
                >
                  All ({localItems.length})
                </span>
                <span
                  className={`filter-tab-pill ${filterTab === 'selected' ? 'bg-primary text-white' : 'bg-white text-secondary border'}`}
                  onClick={() => setFilterTab('selected')}
                >
                  Selected ({totalSelected})
                </span>
                <span
                  className={`filter-tab-pill ${filterTab === 'unselected' ? 'bg-primary text-white' : 'bg-white text-secondary border'}`}
                  onClick={() => setFilterTab('unselected')}
                >
                  Available ({localItems.length - totalSelected})
                </span>
              </div>

              {/* Scrollable Document List */}
              <div className="doc-modal-list pt-1">
                {isLoading || isFetching ? (
                  <div className="p-5 text-center bg-white rounded-3 border">
                    <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                    <span className="text-muted fw-medium small">Loading documents...</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-5 text-center bg-white rounded-3 border">
                    <FaFolderOpen size={36} className="text-muted mb-2 opacity-50" />
                    <h6 className="fw-bold text-secondary mb-1">No {config.title} Found</h6>
                    <p className="text-muted small mb-0">
                      {searchTerm
                        ? `No records match "${searchTerm}". Try clearing your search.`
                        : `No available unmapped ${config.title.toLowerCase()} were found.`}
                    </p>
                    {searchTerm && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="mt-3 px-3"
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = item.selected;
                    const isConfirmingDelete = confirmDeleteId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`doc-modal-item d-flex align-items-center justify-content-between ${isSelected ? config.selectedClass : ''}`}
                        onClick={() => toggleSelection(item.id)}
                      >
                        {/* Checkbox & Document Details */}
                        <div className="d-flex align-items-center gap-3">
                          <div className={isSelected ? `text-${config.badgeColor}` : "text-muted"}>
                            {isSelected ? <FaCheckSquare size={19} /> : <FaSquare size={19} className="opacity-50" />}
                          </div>

                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className={`badge ${isSelected ? `bg-${config.badgeColor}` : 'bg-light text-dark border'} doc-num-badge`}>
                                {item.documentNo}
                              </span>

                              {item.documentDate && (
                                <span className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                  <FaCalendarAlt size={10} className="text-secondary" />
                                  {moment(item.documentDate).format('DD MMM YYYY')}
                                </span>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-2 text-secondary small" style={{ fontSize: '0.78rem' }}>
                              <span className="d-flex align-items-center gap-1">
                                <FaUser size={10} className="text-muted" />
                                <span className="fw-medium text-dark">{item.customerName}</span>
                              </span>

                              {item.validUpto && (
                                <span className="d-flex align-items-center gap-1 text-rose">
                                  <FaClock size={10} /> Valid: {moment(item.validUpto).format('DD MMM YYYY')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions (Delete with Confirmation Safeguard) */}
                        <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {isConfirmingDelete ? (
                            <div className="d-flex align-items-center gap-1 bg-danger bg-opacity-10 p-1 rounded border border-danger">
                              <span className="text-danger small fw-semibold px-1" style={{ fontSize: '0.72rem' }}>Delete?</span>
                              <Button
                                variant="danger"
                                size="sm"
                                className="py-0 px-2 small"
                                style={{ fontSize: '0.7rem' }}
                                disabled={deletingId === item.id}
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                {deletingId === item.id ? <Spinner size="sm" animation="border" /> : "Yes"}
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="py-0 px-1 border"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-muted p-1 hover-scale"
                              title="Delete record"
                              onClick={() => setConfirmDeleteId(item.id)}
                            >
                              <FaTrashAlt size={13} className="text-secondary hover-text-danger" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                <span className="fw-bold text-dark">{totalSelected}</span> of {localItems.length} {config.title.toLowerCase()} selected
              </div>

              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="px-3 py-1 fw-medium"
                  onClick={onClose}
                >
                  Cancel
                </Button>

                <Button
                  variant={config.badgeColor}
                  size="sm"
                  className="px-4 py-1 fw-semibold d-flex align-items-center gap-2 text-white"
                  onClick={handleApply}
                >
                  <FaCheck size={12} />
                  {totalSelected > 0
                    ? `Attach ${totalSelected} ${totalSelected === 1 ? config.singularTitle : config.title}`
                    : `Attach ${config.title}`}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default ModuleSelectorModal;