import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CheckSquare, Square, Trash2, CheckCircle, ListChecks, Search } from 'lucide-react';
import { usePaymentMode, usePaymentStatus } from '../../dashboard/hooks/api.hooks';
import { Spinner } from 'react-bootstrap';
import { useDeleteInvoiceChallan } from '../../invoice-challan/hooks/useApi';
import { useUnmappedInvoiceChallanByInvoiceId } from '../hooks/useApi';
import { set } from 'lodash';

const moduleTitles = {
  challan: 'Challan',
  purchaseOrder: 'Purchase Order',
  ewayBill: 'E-Way Bill',
}

// --- Reusable Modal Component ---
export function ModuleSelectorModal({ moduleKey, invoiceId, show, onClose, moduleData, selectedIds = [], fetchModuleFun, updateModuleData, onSubmit }) {
  const [localTasks, setLocalTasks] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const totalSelected = useMemo(() => localTasks.filter(t => t.selected).length, [localTasks]);
  const modalTitle = `Select ${moduleTitles[moduleKey]}`;

  const { fetchDocument, deleteDocument } = fetchModuleFun(moduleKey)
  const { data, isLoading, isFetching, refetch } = fetchDocument()
  const { mutate: deleteDocumentItem, isSuccess: isDeletedSuccessfully } = deleteDocument()

  useEffect(() => {
    if (show) {
      refetch();
    }
  }, [show])

  const newData = useMemo(() => {
    const formatted = data?.map(item => {
      const isSelectedInForm = Array.isArray(selectedIds) && selectedIds.includes(item.documentId);
      return {
        id: item.documentId,
        text: `${item.documentNo} - (${item.customerName})`,
        selected: isSelectedInForm || Boolean(item?.isInvoiced)
      };
    }) ?? [];

    return formatted;
  }, [data, selectedIds]);

  useEffect(() => {
    setLocalTasks(newData);
    setSubmittedData(null);
    setSearchTerm('');
  }, [newData, moduleKey, isFetching, isDeletedSuccessfully]);

  // const filteredTasks = localTasks.filter(task =>
  //   task.text.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const filteredTasks = useMemo(() => {
    return localTasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localTasks, searchTerm]);

  // const handleAddTodo = (e) => {
  //   e.preventDefault();
  //   if (!newTodo.trim()) return;

  //   const newItem = {
  //     // Use moduleKey + current time for better ID separation across modules
  //     id: `${moduleKey}-${Date.now()}`,
  //     text: newTodo.trim(),
  //     selected: false,
  //   };

  //   const newTasks = [...localTasks, newItem];
  //   setLocalTasks(newTasks);
  //   updateModuleData(moduleKey, newTasks); // Update global state immediately
  //   setNewTodo('');
  // };

  const toggleSelection = (id) => {
    const newTasks = localTasks.map(task =>
      task.id === id ? { ...task, selected: !task.selected } : task
    );

    setLocalTasks(newTasks);
    updateModuleData(moduleKey, newTasks); // Update global state
    if (submittedData) setSubmittedData(null);
  };

  const allFilteredSelected = filteredTasks.length > 0 && filteredTasks.every(t => t.selected);

  const toggleAll = () => {
    const filteredIds = filteredTasks.map(t => t.id);

    const newTasks = localTasks.map(task => {
      if (filteredIds.includes(task.id)) {
        // Toggle based on the state of all filtered items
        return { ...task, selected: !allFilteredSelected };
      }
      return task;
    });

    setLocalTasks(newTasks);
    updateModuleData(moduleKey, newTasks); // Update global state
  };

  const deleteTodo = (id) => {
    // const newTasks = localTasks.filter(t => t.id !== id);
    // setLocalTasks(newTasks);
    // updateModuleData(moduleKey, newTasks); // Update global state

    setDeletingId(id);

    deleteDocumentItem(
      { id, invoiceId, type: "invoiceChallanPopup" },
      { onSettled: () => setDeletingId(null) }
    );

    // switch (moduleKey) {
    //   case 'challan':
    //     // deleteInvoiceChallan(id);
    //     deleteInvoiceChallan(
    //       {id, invoiceId, type: "invoiceChallanPopup"},
    //       {onSettled: () => setDeletingId(null)}
    //     );
    //     break;
    //   case 'purchaseOrder':

    //     break;
    //   case 'ewayBill':

    //     break;

    //   default:
    //     break;
    // }
  };

  const handleSubmit = () => {
    const selectedIds = localTasks.filter(t => t.selected).map(t => t.id);
    setSubmittedData({
      timestamp: new Date().toLocaleTimeString(),
      ids: selectedIds,
      count: selectedIds.length
    });
    onSubmit(moduleKey, selectedIds); // Call external submit handler
  };

  // If the modal is not visible, return null
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050, overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow-lg border-0">

            {/* Modal Header (Fixed) */}
            <div className="modal-header bg-white border-bottom-0 pb-0">
              <h5 className="modal-title d-flex align-items-center gap-2 fw-bold text-primary text-capitalize">
                <ListChecks size={24} />
                {modalTitle}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body p-4">

              {/* Search Input (Fixed) */}
              <div className="input-group mb-3">
                <span className="input-group-text bg-light text-muted"><Search size={18} /></span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${moduleTitles[moduleKey]}...`}
                  className="form-control"
                />
              </div>

              {/* Add New & Controls (Fixed) */}
              <div className="mb-4">
                <div className="row g-2">
                  <div className="col-md-9">
                    {/* <form onSubmit={handleAddTodo} className="d-flex gap-2">
                      <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder={`Add new ${moduleTitles[moduleKey]} task...`}
                        className="form-control"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary d-flex align-items-center gap-2 btn-shadow"
                      >
                        <Plus size={18} />
                        Add
                      </button>
                    </form> */}
                  </div>
                  <div className="col-md-3">
                    <button
                      onClick={toggleAll}
                      // Conditional button styling based on selection state
                      className={`btn ${allFilteredSelected ? 'btn-secondary' : 'btn-success'} w-100 btn-shadow`}
                      disabled={filteredTasks.length === 0}
                    >
                      {allFilteredSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Todo List Container (SCROLLABLE AREA with scroll shadow) */}
              <div className="todo-list-scroll mb-4">
                <ul className="list-group list-group-flush">
                  {isLoading ? (
                    <li className="list-group-item p-4 text-center text-muted">
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Loading...
                    </li>
                  ) : filteredTasks.length === 0 ? (
                    <li className="list-group-item p-4 text-center text-muted">
                      <p className="mb-0">{`No data found ${searchTerm?.trim() ? `matching "${searchTerm}"` : ""} in ${moduleTitles[moduleKey]}.`}</p>
                    </li>
                  ) : (
                    filteredTasks.map((task) => (
                      <li
                        key={task.id}
                        // Using custom class for compact height
                        className={`list-group-item compact-list-item d-flex justify-content-between align-items-center ${task.selected ? 'selected' : ''}`}
                        onClick={() => toggleSelection(task.id)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className={task.selected ? "text-primary" : "text-secondary"}>
                            {/* Reduced icon size for a tighter fit */}
                            {task.selected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                          <div>
                            <span className={`fw-medium ${task.selected ? 'text-primary' : 'text-dark'}`}>
                              {task.text}
                            </span>
                            {/* <div className="small text-muted">ID: {task.id}</div> */}
                          </div>
                        </div>

                        {/* Delete Button */}
                        {deletingId === task.id ? (
                          <Spinner
                            variant='light'
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTodo(task.id);
                            }}
                            className="btn btn-danger btn-sm delete-btn border-0"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Submission Results (Fixed) */}
              {submittedData && (
                <div className="alert alert-dark border-0 btn-shadow mb-0">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-success d-flex align-items-center gap-2 text-capitalize">
                      <CheckCircle size={16} /> {moduleKey} Submission Successful
                    </strong>
                    <span className="badge bg-secondary">{submittedData.timestamp}</span>
                  </div>
                  <div className="bg-black p-3 rounded text-info font-monospace small overflow-auto">
                    {JSON.stringify({ module: moduleKey, selectedIds: submittedData.ids }, null, 2)}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="modal-footer bg-light">
              <div className="me-auto text-muted small text-capitalize">
                {totalSelected} {moduleTitles[moduleKey]} selected
              </div>
              <button
                onClick={handleSubmit}
                disabled={totalSelected === 0}
                className="btn btn-success d-flex align-items-center gap-2 btn-shadow"
              >
                <CheckCircle size={18} />
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}