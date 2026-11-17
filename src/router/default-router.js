import React from 'react'
import Index from '../views/dashboard/index'
// import { Switch, Route } from 'react-router-dom'
// user
import UserProfile from '../views/dashboard/app/user-profile';
import UserAdd from '../views/dashboard/app/user-add';
import UserList from '../views/dashboard/app/user-list';
import Default from '../layouts/dashboard/default';
import ProtectedRoute from '../providers/ProtectedRoute';
import FirmList from '../views/firms/FirmList';
import FirmForm from '../views/firms/FirmForm';
import InvoiceChallan from '../views/invoice-challan/pages/InvoiceChallanForm';
import InvoiceForm from '../views/invoice/pages/InvoiceForm';
import InvoiceList from '../views/invoice/pages/InvoiceList';
import QuotationList from '../views/quotation/pages/QuotationList';
import QuotationForm from '../views/quotation/pages/QuotationForm';
import ProformaList from '../views/proforma-invoice/pages/ProformaList';
import ProformaForm from '../views/proforma-invoice/pages/ProformaForm';
import InvoiceChallanList from '../views/invoice-challan/pages/InvoiceChallanList';
import EwayBillForm from '../views/eway-bill/pages/EwayBillForm';
import EwayBillList from '../views/eway-bill/pages/EwayBillList';
import PurchaseOrderForm from '../views/purchase-order/pages/PurchaseOrderForm';
import PurchaseOrderList from '../views/purchase-order/pages/PurchaseOrderList';
import PartyList from '../views/party/pages/PartyList';
import PartyForm from '../views/party/pages/PartyForm';
import PartyLedgerPage from '../views/party/pages/PartyLedgerPage';
import ContactRoleList from '../views/masters/contact-roles/pages/ContactRoleList';
import PartyRoleList from '../views/masters/party-roles/pages/PartyRoleList';
import ProductList from '../views/products/pages/ProductList';
import ProductForm from '../views/products/pages/ProductForm';
import ProductView from '../views/products/pages/ProductView';
import PaymentReceiptList from '../views/payments/pages/PaymentReceiptList';
import PaymentReceiptForm from '../views/payments/pages/PaymentReceiptForm';
import PaymentReceiptDetail from '../views/payments/pages/PaymentReceiptDetail';
import VendorBillList from '../views/vendor-bills/pages/VendorBillList';
import VendorBillForm from '../views/vendor-bills/pages/VendorBillForm';
import VendorBillDetail from '../views/vendor-bills/pages/VendorBillDetail';
import VendorPaymentList from '../views/payments/pages/VendorPaymentList';
import VendorPaymentForm from '../views/payments/pages/VendorPaymentForm';
import VendorPaymentDetail from '../views/payments/pages/VendorPaymentDetail';
import RolesPermissionStudio from '../views/admin/roles-permissions/RolesPermissionStudio';

// Employee & Payroll Management
import EmployeeList from '../views/employee/directory/pages/EmployeeList';
import EmployeeForm from '../views/employee/directory/pages/EmployeeForm';
import EmployeeDetail from '../views/employee/directory/pages/EmployeeDetail';
import AttendanceSheet from '../views/employee/attendance/pages/AttendanceSheet';
import AttendanceSummary from '../views/employee/attendance/pages/AttendanceSummary';
import ShiftList from '../views/employee/shifts/pages/ShiftList';
import LeaveList from '../views/employee/leaves/pages/LeaveList';
import PayrollRun from '../views/employee/payroll/pages/PayrollRun';
import PayrollSettings from '../views/employee/payroll/pages/PayrollSettings';
import SalaryTemplates from '../views/employee/payroll/pages/SalaryTemplates';
import SalarySlipView from '../views/employee/payroll/pages/SalarySlipView';
import AdvanceList from '../views/employee/advances/pages/AdvanceList';


export const DefaultRouter = [
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: '/',
                element: <Default />,
                children: [
                    { path: 'dashboard', element: <Index /> },

                    /* Organization */
                    // Firm Routes
                    { path: 'firms', element: <FirmList /> },
                    { path: 'firms/create', element: <FirmForm mode="create" /> },
                    { path: 'firms/:id/edit', element: <FirmForm mode="edit" /> },

                    // Party Routes
                    { path: 'parties', element: <PartyList /> },
                    { path: 'parties/create', element: <PartyForm mode="create" /> },
                    { path: 'parties/:id/edit', element: <PartyForm mode="edit" /> },
                    { path: 'parties/:id/ledger', element: <PartyLedgerPage /> },
                    { path: 'parties/party-roles', element: <PartyRoleList /> },
                    { path: 'organization/party-roles', element: <PartyRoleList /> },

                    /* Masters */
                    { path: 'masters/products', element: <ProductList /> },
                    { path: 'masters/products/create', element: <ProductForm mode="create" /> },
                    { path: 'masters/products/:id/edit', element: <ProductForm mode="edit" /> },
                    { path: 'masters/products/:id', element: <ProductView /> },
                    { path: 'masters/contact-roles', element: <ContactRoleList /> },

                    /* Sales */
                    // Quotation Routes
                    { path: 'sales/quotation', element: <QuotationList /> },
                    { path: 'sales/quotation/create', element: <QuotationForm mode="create" /> },
                    { path: 'sales/quotation/:id/edit', element: <QuotationForm mode="edit" /> },
                    { path: 'sales/quotation/:id/duplicate', element: <QuotationForm mode="duplicate" /> },

                    // Proforma Invoice Routes
                    { path: 'sales/proforma-invoice', element: <ProformaList /> },
                    { path: 'sales/proforma-invoice/create', element: <ProformaForm mode="create" /> },
                    { path: 'sales/proforma-invoice/:id/edit', element: <ProformaForm mode="edit" /> },
                    { path: 'sales/proforma-invoice/:id/duplicate', element: <ProformaForm mode="duplicate" /> },

                    // Invoice Routes
                    { path: 'sales/invoice', element: <InvoiceList /> },
                    { path: 'sales/invoice/create', element: <InvoiceForm mode="create" /> },
                    { path: 'sales/invoice/:id/edit', element: <InvoiceForm mode="edit" /> },
                    { path: 'sales/invoice/:id/duplicate', element: <InvoiceForm mode="duplicate" /> },

                    // Challan Routes
                    { path: 'sales/challans', element: <InvoiceChallanList /> },
                    { path: 'sales/challans/create', element: <InvoiceChallan mode="create" /> },
                    { path: 'sales/challans/:id/edit', element: <InvoiceChallan mode="edit" /> },

                    // Eway bill Routes
                    { path: 'sales/eway-bill', element: <EwayBillList /> },
                    { path: 'sales/eway-bill/create', element: <EwayBillForm mode="create" /> },
                    { path: 'sales/eway-bill/:id/edit', element: <EwayBillForm mode="edit" /> },

                    /* Purchase */
                    // Purchase order Routes
                    { path: 'purchase/purchase-order', element: <PurchaseOrderList /> },
                    { path: 'purchase/purchase-order/create', element: <PurchaseOrderForm mode="create" /> },
                    { path: 'purchase/purchase-order/:id/edit', element: <PurchaseOrderForm mode="edit" /> },

                    // Vendor Bills (Accounts Payable) Routes
                    { path: 'purchase/vendor-bills', element: <VendorBillList /> },
                    { path: 'purchase/vendor-bills/create', element: <VendorBillForm mode="create" /> },
                    { path: 'purchase/vendor-bills/:id', element: <VendorBillDetail /> },
                    { path: 'purchase/vendor-bills/:id/edit', element: <VendorBillForm mode="edit" /> },

                    /* Payments */
                    // Customer Receipts (Inward)
                    { path: 'payments', element: <PaymentReceiptList /> },
                    { path: 'payments/receipts', element: <PaymentReceiptList /> },
                    { path: 'payments/receipts/create', element: <PaymentReceiptForm /> },
                    { path: 'payments/receipts/:id', element: <PaymentReceiptDetail /> },

                    // Vendor Payments (Outward)
                    { path: 'payments/vendor-payments', element: <VendorPaymentList /> },
                    { path: 'payments/vendor-payments/create', element: <VendorPaymentForm /> },
                    { path: 'payments/vendor-payments/:id', element: <VendorPaymentDetail /> },

                    /* Employee & Payroll Management */
                    { path: 'employee', element: <ProtectedRoute module="employees" action="read"><EmployeeList /></ProtectedRoute> },
                    { path: 'employee/create', element: <ProtectedRoute module="employees" action="create"><EmployeeForm mode="create" /></ProtectedRoute> },
                    { path: 'employee/:id/edit', element: <ProtectedRoute module="employees" action="update"><EmployeeForm mode="edit" /></ProtectedRoute> },
                    { path: 'employee/:id', element: <ProtectedRoute module="employees" action="read"><EmployeeDetail /></ProtectedRoute> },
                    { path: 'employee/attendance', element: <ProtectedRoute module="attendance" action="read"><AttendanceSheet /></ProtectedRoute> },
                    { path: 'employee/attendance-summary', element: <ProtectedRoute module="attendance" action="read"><AttendanceSummary /></ProtectedRoute> },
                    { path: 'employee/shifts', element: <ProtectedRoute module="shifts" action="read"><ShiftList /></ProtectedRoute> },
                    { path: 'employee/leaves', element: <ProtectedRoute module="leaves" action="read"><LeaveList /></ProtectedRoute> },
                    { path: 'employee/payroll', element: <ProtectedRoute module="payroll" action="read"><PayrollRun /></ProtectedRoute> },
                    { path: 'employee/payroll-settings', element: <ProtectedRoute module="payroll-settings" action="read"><PayrollSettings /></ProtectedRoute> },
                    { path: 'employee/salary-templates', element: <ProtectedRoute module="salary-templates" action="read"><SalaryTemplates /></ProtectedRoute> },
                    { path: 'employee/salary-slip/:id', element: <ProtectedRoute module="payroll" action="read"><SalarySlipView /></ProtectedRoute> },
                    { path: 'employee/advances', element: <ProtectedRoute module="payroll" action="read"><AdvanceList /></ProtectedRoute> },

                    // Also support /dashboard/employee/* paths
                    { path: 'dashboard/employee', element: <ProtectedRoute module="employees" action="read"><EmployeeList /></ProtectedRoute> },
                    { path: 'dashboard/employee/create', element: <ProtectedRoute module="employees" action="create"><EmployeeForm mode="create" /></ProtectedRoute> },
                    { path: 'dashboard/employee/:id/edit', element: <ProtectedRoute module="employees" action="update"><EmployeeForm mode="edit" /></ProtectedRoute> },
                    { path: 'dashboard/employee/:id', element: <ProtectedRoute module="employees" action="read"><EmployeeDetail /></ProtectedRoute> },
                    { path: 'dashboard/employee/attendance', element: <ProtectedRoute module="attendance" action="read"><AttendanceSheet /></ProtectedRoute> },
                    { path: 'dashboard/employee/attendance-summary', element: <ProtectedRoute module="attendance" action="read"><AttendanceSummary /></ProtectedRoute> },
                    { path: 'dashboard/employee/shifts', element: <ProtectedRoute module="shifts" action="read"><ShiftList /></ProtectedRoute> },
                    { path: 'dashboard/employee/leaves', element: <ProtectedRoute module="leaves" action="read"><LeaveList /></ProtectedRoute> },
                    { path: 'dashboard/employee/payroll', element: <ProtectedRoute module="payroll" action="read"><PayrollRun /></ProtectedRoute> },
                    { path: 'dashboard/employee/payroll-settings', element: <ProtectedRoute module="payroll-settings" action="read"><PayrollSettings /></ProtectedRoute> },
                    { path: 'dashboard/employee/salary-templates', element: <ProtectedRoute module="salary-templates" action="read"><SalaryTemplates /></ProtectedRoute> },
                    { path: 'dashboard/employee/salary-slip/:id', element: <ProtectedRoute module="payroll" action="read"><SalarySlipView /></ProtectedRoute> },
                    { path: 'dashboard/employee/advances', element: <ProtectedRoute module="payroll" action="read"><AdvanceList /></ProtectedRoute> },
                    // User Management & Security
                    {
                        path: 'dashboard/app/user-profile',
                        element: <ProtectedRoute><UserProfile /></ProtectedRoute>
                    },
                    {
                        path: 'dashboard/app/user-add',
                        element: <ProtectedRoute module="users" action="create"><UserAdd /></ProtectedRoute>
                    },
                    {
                        path: 'dashboard/app/user-list',
                        element: <ProtectedRoute module="users" action="read"><UserList /></ProtectedRoute>
                    },
                    {
                        path: 'dashboard/admin/roles-permissions',
                        element: <ProtectedRoute module="users" action="read"><RolesPermissionStudio /></ProtectedRoute>
                    },
                    {
                        path: 'admin/roles-permissions',
                        element: <ProtectedRoute module="users" action="read"><RolesPermissionStudio /></ProtectedRoute>
                    }
                ]
            }
        ]
    }
];
