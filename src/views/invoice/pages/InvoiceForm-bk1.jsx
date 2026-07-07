import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Trash2, CheckCircle, ListChecks, Search } from 'lucide-react';
import './invoice.scss' // --- IGNORE ---
import { ModuleSelectorModal } from '../components/ModuleSelectorModal';

// --- Reusable Modal Component ---
// function ModuleSelectorModal({ moduleKey, show, onClose, moduleData, updateModuleData, onSubmit }) {
//   const [localTasks, setLocalTasks] = useState(moduleData);
//   const [newTodo, setNewTodo] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [submittedData, setSubmittedData] = useState(null);

//   // Sync local tasks when module data changes (i.e., when modal opens for a new module)
//   useEffect(() => {
//     setLocalTasks(moduleData);
//     setSubmittedData(null);
//     setSearchTerm('');
//   }, [moduleData]);

//   const filteredTasks = localTasks.filter(task =>
//     task.text.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleAddTodo = (e) => {
//     e.preventDefault();
//     if (!newTodo.trim()) return;

//     const newItem = {
//       // Use moduleKey + current time for better ID separation across modules
//       id: `${moduleKey}-${Date.now()}`, 
//       text: newTodo.trim(),
//       selected: false,
//     };

//     const newTasks = [...localTasks, newItem];
//     setLocalTasks(newTasks);
//     updateModuleData(moduleKey, newTasks); // Update global state immediately
//     setNewTodo('');
//   };

//   const toggleSelection = (id) => {
//     const newTasks = localTasks.map(task => 
//       task.id === id ? { ...task, selected: !task.selected } : task
//     );
//     setLocalTasks(newTasks);
//     updateModuleData(moduleKey, newTasks); // Update global state
//     if (submittedData) setSubmittedData(null);
//   };

//   const allFilteredSelected = filteredTasks.length > 0 && filteredTasks.every(t => t.selected);

//   const toggleAll = () => {
//     const filteredIds = filteredTasks.map(t => t.id);

//     const newTasks = localTasks.map(task => {
//         if (filteredIds.includes(task.id)) {
//             // Toggle based on the state of all filtered items
//             return { ...task, selected: !allFilteredSelected };
//         }
//         return task;
//     });

//     setLocalTasks(newTasks);
//     updateModuleData(moduleKey, newTasks); // Update global state
//   };

//   const deleteTodo = (id) => {
//     const newTasks = localTasks.filter(t => t.id !== id);
//     setLocalTasks(newTasks);
//     updateModuleData(moduleKey, newTasks); // Update global state
//   };

//   const handleSubmit = () => {
//     const selectedIds = localTasks.filter(t => t.selected).map(t => t.id);
//     setSubmittedData({
//       timestamp: new Date().toLocaleTimeString(),
//       ids: selectedIds,
//       count: selectedIds.length
//     });
//     onSubmit(moduleKey, selectedIds); // Call external submit handler
//   };

//   // If the modal is not visible, return null
//   if (!show) return null;

//   const totalSelected = localTasks.filter(t => t.selected).length;
//   const modalTitle = `${moduleKey} Task Selector`;

//   return (
//     <>
//       {/* Backdrop */}
//       <div 
//         className="modal-backdrop fade show" 
//         style={{ zIndex: 1040 }}
//         onClick={onClose}
//       ></div>

//       {/* Modal Container */}
//       <div 
//         className="modal fade show d-block" 
//         tabIndex="-1" 
//         style={{ zIndex: 1050, overflowY: 'auto' }}
//         role="dialog"
//         aria-modal="true"
//       >
//         <div className="modal-dialog modal-dialog-centered modal-lg"> 
//           <div className="modal-content shadow-lg border-0">

//             {/* Modal Header (Fixed) */}
//             <div className="modal-header bg-white border-bottom-0 pb-0">
//               <h5 className="modal-title d-flex align-items-center gap-2 fw-bold text-primary text-capitalize">
//                 <ListChecks size={24} />
//                 {modalTitle}
//               </h5>
//               <button 
//                 type="button" 
//                 className="btn-close" 
//                 onClick={onClose}
//                 aria-label="Close"
//               ></button>
//             </div>

//             {/* Modal Body */}
//             <div className="modal-body p-4">

//               {/* Search Input (Fixed) */}
//               <div className="input-group mb-3">
//                 <span className="input-group-text bg-light text-muted"><Search size={18} /></span>
//                 <input
//                   type="text"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   placeholder={`Search ${moduleKey} tasks...`}
//                   className="form-control"
//                 />
//               </div>

//               {/* Add New & Controls (Fixed) */}
//               <div className="mb-4">
//                  <div className="row g-2">
//                     <div className="col-md-9">
//                       <form onSubmit={handleAddTodo} className="d-flex gap-2">
//                         <input
//                           type="text"
//                           value={newTodo}
//                           onChange={(e) => setNewTodo(e.target.value)}
//                           placeholder={`Add new ${moduleKey} task...`}
//                           className="form-control"
//                         />
//                         <button 
//                           type="submit"
//                           className="btn btn-primary d-flex align-items-center gap-2 btn-shadow"
//                         >
//                           <Plus size={18} />
//                           Add
//                         </button>
//                       </form>
//                     </div>
//                     <div className="col-md-3">
//                        <button 
//                         onClick={toggleAll}
//                         // Conditional button styling based on selection state
//                         className={`btn ${allFilteredSelected ? 'btn-secondary' : 'btn-success'} w-100 btn-shadow`}
//                         disabled={filteredTasks.length === 0}
//                       >
//                         {allFilteredSelected ? 'Deselect Visible' : 'Select All Visible'}
//                       </button>
//                     </div>
//                  </div>
//               </div>

//               {/* Todo List Container (SCROLLABLE AREA with scroll shadow) */}
//               <div className="todo-list-scroll mb-4">
//                 <ul className="list-group list-group-flush">
//                   {filteredTasks.length === 0 ? (
//                     <li className="list-group-item p-4 text-center text-muted">
//                       <p className="mb-0">No tasks found matching "{searchTerm}" in {moduleKey}.</p>
//                     </li>
//                   ) : (
//                     filteredTasks.map((task) => (
//                       <li 
//                         key={task.id} 
//                         // Using custom class for compact height
//                         className={`list-group-item compact-list-item d-flex justify-content-between align-items-center ${task.selected ? 'selected' : ''}`}
//                         onClick={() => toggleSelection(task.id)}
//                       >
//                         <div className="d-flex align-items-center gap-3">
//                           <div className={task.selected ? "text-primary" : "text-secondary"}>
//                             {/* Reduced icon size for a tighter fit */}
//                             {task.selected ? <CheckSquare size={18} /> : <Square size={18} />}
//                           </div>
//                           <div>
//                             <span className={`fw-medium ${task.selected ? 'text-primary' : 'text-dark'}`}>
//                               {task.text}
//                             </span>
//                             {/* <div className="small text-muted">ID: {task.id}</div> */}
//                           </div>
//                         </div>

//                         {/* Delete Button */}
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             deleteTodo(task.id);
//                           }}
//                           className="btn btn-danger btn-sm delete-btn border-0"
//                           title="Delete"
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </li>
//                     ))
//                   )}
//                 </ul>
//               </div>

//               {/* Submission Results (Fixed) */}
//               {submittedData && (
//                 <div className="alert alert-dark border-0 btn-shadow mb-0">
//                   <div className="d-flex justify-content-between align-items-center mb-2">
//                     <strong className="text-success d-flex align-items-center gap-2 text-capitalize">
//                        <CheckCircle size={16} /> {moduleKey} Submission Successful
//                     </strong>
//                     <span className="badge bg-secondary">{submittedData.timestamp}</span>
//                   </div>
//                   <div className="bg-black p-3 rounded text-info font-monospace small overflow-auto">
//                     {JSON.stringify({ module: moduleKey, selectedIds: submittedData.ids }, null, 2)}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Modal Footer (Fixed) */}
//             <div className="modal-footer bg-light">
//               <div className="me-auto text-muted small text-capitalize">
//                  {totalSelected} {moduleKey} items selected
//               </div>
//               <button 
//                 type="button" 
//                 className="btn btn-secondary btn-shadow" 
//                 onClick={onClose}
//               >
//                 Close
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={totalSelected === 0}
//                 className="btn btn-success d-flex align-items-center gap-2 btn-shadow"
//               >
//                 <CheckCircle size={18} />
//                 Submit Selected
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }


// --- Main Application Component ---
export default function App() {
  const initialModuleData = {
    challan: [
      { id: 'C-101', text: 'Verify Challan C-101 against invoice', selected: false },
      { id: 'C-102', text: 'Export Challan report for Q3', selected: false },
      { id: 'C-103', text: 'Challan C-103 needs re-authorization', selected: true },
      { id: 'C-104', text: 'Archive old Challan documents', selected: false },
      { id: 'C-105', text: 'Follow up on payment for Challan C-105', selected: false },
      { id: 'C-106', text: 'Update Challan template for new region', selected: false },
      { id: 'C-107', text: 'Review Challan C-107 status', selected: false },
      { id: 'C-108', text: 'Send reminder for Challan C-108', selected: false },
      { id: 'C-109', text: 'Final sign-off for Challan C-109', selected: false },
      { id: 'C-110', text: 'Issue refund for Challan C-110', selected: false },
      { id: 'C-111', text: 'Check customs clearance for C-111', selected: false },
      { id: 'C-112', text: 'Audit trail review for Challan C-112', selected: false },
    ],
    purchaseOrder: [
      { id: 'PO-201', text: 'Approve Purchase Order PO-201', selected: false },
      { id: 'PO-202', text: 'Draft new PO for supplier X', selected: false },
      { id: 'PO-203', text: 'Review PO-203 budget alignment', selected: false },
      { id: 'PO-204', text: 'Send PO-204 confirmation to vendor', selected: true },
    ],
    ewayBill: [
      { id: 'EB-301', text: 'Generate Eway Bill for shipment #99', selected: false },
      { id: 'EB-302', text: 'Check bill status for EB-302', selected: false },
      { id: 'EB-303', text: 'Update vehicle number for Eway Bill EB-303', selected: false },
    ],
  };

  const [moduleData, setModuleData] = useState(initialModuleData);
  const [activeModule, setActiveModule] = useState(null); // 'challan', 'purchaseOrder', or 'ewayBill'

  // Handler to open the modal for a specific module
  const handleViewModule = (moduleKey) => {
    setActiveModule(moduleKey);
  };

  // Handler to close the modal
  const handleCloseModal = () => {
    setActiveModule(null);
  };

  // Handler passed to the modal to permanently update the tasks for a module
  const updateModuleData = (moduleKey, newTasks) => {
    setModuleData(prev => ({
      ...prev,
      [moduleKey]: newTasks
    }));
  };

  // Handler for submission (optional: log or save submission results globally)
  const handleModuleSubmit = (moduleKey, selectedIds) => {
    console.log(`Submitted IDs for ${moduleKey}:`, selectedIds);
    // In a real application, you would send this data to an API endpoint here.
  };

  const currentModuleData = activeModule ? moduleData[activeModule] : [];

  // Array defining the modules to display buttons for
  const modules = [
    { key: 'challan', label: 'Challan', icon: 'FileText', color: 'primary' },
    { key: 'purchaseOrder', label: 'Purchase Order', icon: 'ShoppingCart', color: 'info' },
    { key: 'ewayBill', label: 'Eway Bill', icon: 'Truck', color: 'warning' },
  ];

  // Function to dynamically render Lucide icons based on string name
  const getIconComponent = (key) => {
    const icons = {
      FileText: ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
      ShoppingCart: ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58L23 6H6"></path></svg>,
      Truck: ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-5"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>,
    };
    return icons[key] || ListChecks;
  };


  return (
    <>
      {/* Inject Bootstrap 5 via CDN */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
        rel="stylesheet"
        crossOrigin="anonymous"
      />

      <style>{`
        /* Delete Button Hover Effect */
        .delete-btn { 
          opacity: 0; 
          border-radius: 50%;
          padding: 0.5rem; 
          background-color: transparent;
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out, background-color 0.2s ease-in-out, color 0.2s ease-in-out; 
          transform: scale(0.85); 
          line-height: 1; 
          color: #999; 
        }
        .delete-btn:hover {
          background-color: var(--bs-danger-bg-subtle, rgba(220, 53, 69, 0.15)); 
          transform: scale(1.05); 
        }
      `}</style>

      {/* Main Page Content (Module Selector Buttons) */}
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-5">
        <div className="text-center fade-in-up mb-5">
          <div className="mb-4 bg-white p-4 rounded-circle shadow-sm d-inline-block">
            <ListChecks size={64} className="text-dark" />
          </div>
          <h1 className="display-4 fw-bold text-dark mb-3">Module Task Selector</h1>
          <p className="lead text-muted mb-4">Select a module to view and manage its associated tasks.</p>
        </div>

        <div className="d-flex flex-wrap justify-content-center gap-4">
          {modules.map(moduleInfo => {
            const Icon = getIconComponent(moduleInfo.icon);
            return (
              <button
                key={moduleInfo.key}
                onClick={() => handleViewModule(moduleInfo.key)}
                className={`btn btn-${moduleInfo.color} btn-lg px-5 py-3 rounded-pill btn-shadow fw-semibold d-inline-flex align-items-center gap-2`}
              >
                <Icon size={24} />
                {moduleInfo.label} View
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional Modal Rendering */}
      <ModuleSelectorModal
        moduleKey={activeModule}
        show={!!activeModule} // Only show if activeModule is set
        onClose={handleCloseModal}
        moduleData={currentModuleData}
        updateModuleData={updateModuleData}
        onSubmit={handleModuleSubmit}
      />
    </>
  );
}