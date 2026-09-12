import React from 'react'
import Index from '../views/dashboard/index'
// import { Switch, Route } from 'react-router-dom'
// user
import UserProfile from '../views/dashboard/app/user-profile';
import UserAdd from '../views/dashboard/app/user-add';
import UserList from '../views/dashboard/app/user-list';

// Customer
import CustomerAdd from '../views/dashboard/customer/customer-add';
import CustomerList from '../views/dashboard/customer/customer-list';

// import userProfileEdit from '../views/dashboard/app/user-privacy-setting';
// widget
import Widgetbasic from '../views/dashboard/widget/widgetbasic';
import Widgetcard from '../views/dashboard/widget/widgetcard';
import Widgetchart from '../views/dashboard/widget/widgetchart';
// icon
import Solid from '../views/dashboard/icons/solid';
import Outline from '../views/dashboard/icons/outline';
import DualTone from '../views/dashboard/icons/dual-tone';
// Form
import FormElement from '../views/dashboard/from/form-element';
import FormValidation from '../views/dashboard/from/form-validation';
import FormWizard from '../views/dashboard/from/form-wizard';
// table
import BootstrapTable from '../views/dashboard/table/bootstrap-table';
import TableData from '../views/dashboard/table/table-data';

// map
import Vector from '../views/dashboard/maps/vector';
import Google from '../views/dashboard/maps/google';

//extra
// import PrivacyPolicy from '../views/dashboard/extra/privacy-policy';
// import TermsofService from '../views/dashboard/extra/terms-of-service';

//TransitionGroup
// import { TransitionGroup, CSSTransition } from "react-transition-group";
//Special Pages
import Billing from '../views/dashboard/special-pages/billing';
import Kanban from '../views/dashboard/special-pages/kanban';
import Pricing from '../views/dashboard/special-pages/pricing';
import Timeline from '../views/dashboard/special-pages/timeline';
import Calender from '../views/dashboard/special-pages/calender';
import RtlSupport from '../views/dashboard/special-pages/RtlSupport'

//admin
import Admin from '../views/dashboard/admin/admin';
import Default from '../layouts/dashboard/default';

// Testing
import Test from '../views/test/form-validation';
import AddRow from '../views/test/form-add-row';
import ProtectedRoute from '../providers/ProtectedRoute';
import FirmList from '../views/firms/FirmList';
import FirmForm from '../views/firms/FirmForm';
import InvoiceChallan from '../views/invoice-challan/pages/InvoiceChallanForm';
import InvoiceForm from '../views/invoice/pages/InvoiceForm';
import InvoiceList from '../views/invoice/pages/InvoiceList';
import InvoiceChallanList from '../views/invoice-challan/pages/InvoiceChallanList';
import EwayBillForm from '../views/eway-bill/pages/EwayBillForm';
import EwayBillList from '../views/eway-bill/pages/EwayBillList';
import PurchaseOrderForm from '../views/purchase-order/pages/PurchaseOrderForm';
import PurchaseOrderList from '../views/purchase-order/pages/PurchaseOrderList';
import PartyList from '../views/party/pages/PartyList';
import PartyForm from '../views/party/pages/PartyForm';
import ContactRoleList from '../views/masters/contact-roles/pages/ContactRoleList';
import PartyRoleList from '../views/masters/party-roles/pages/PartyRoleList';
import ProductList from '../views/products/pages/ProductList';
import ProductForm from '../views/products/pages/ProductForm';
import ProductView from '../views/products/pages/ProductView';


export const DefaultRouter = [
    {
        path: '/',
        element: <Default />,
        children: [
            // {
            //     path: 'dashboard',
            //     element: <Index />
            // },
            {
                element: <ProtectedRoute allowedRoles={["user", "admin"]} />,
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
                    { path: 'parties/party-roles', element: <PartyRoleList /> },
                    { path: 'organization/party-roles', element: <PartyRoleList /> },

                    /* Masters */
                    { path: 'masters/products', element: <ProductList /> },
                    { path: 'masters/products/create', element: <ProductForm mode="create" /> },
                    { path: 'masters/products/:id/edit', element: <ProductForm mode="edit" /> },
                    { path: 'masters/products/:id', element: <ProductView /> },
                    { path: 'masters/contact-roles', element: <ContactRoleList /> },

                    /* Sales */
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
                ]
            },
            {
                path: 'dashboard/special-pages/billing',
                element: <Billing />
            },
            {
                path: 'dashboard/special-pages/calender',
                element: <Calender />
            },
            {
                path: 'dashboard/special-pages/kanban',
                element: <Kanban />
            },
            {
                path: 'dashboard/special-pages/pricing',
                element: <Pricing />
            },
            {
                path: 'dashboard/special-pages/timeline',
                element: <Timeline />
            },
            {
                path: 'dashboard/special-pages/rtl-support',
                element: <RtlSupport />,
            },
            {
                path: 'dashboard/app/user-profile',
                element: <UserProfile />
            },
            {
                path: 'dashboard/app/user-add',
                element: <UserAdd />
            },
            {
                path: 'dashboard/app/user-list',
                element: <UserList />
            },
            {
                path: 'dashboard/customer-add',
                element: <CustomerAdd />
            },
            {
                path: 'dashboard/customer-edit/:id',
                element: <CustomerAdd />
            },
            {
                path: 'dashboard/customer-list',
                element: <CustomerList />
            },
            {
                path: 'dashboard/admin/admin',
                element: <Admin />
            },
            // Widget
            {
                path: 'dashboard/widget/widgetbasic',
                element: <Widgetbasic />
            },
            {
                path: 'dashboard/widget/widgetchart',
                element: <Widgetchart />
            },
            {
                path: 'dashboard/widget/widgetcard',
                element: <Widgetcard />
            },
            // Map
            {
                path: 'dashboard/map/google',
                element: <Google />
            },
            {
                path: 'dashboard/map/vector',
                element: <Vector />
            },
            // Form
            {
                path: 'dashboard/form/form-element',
                element: <FormElement />
            },
            {
                path: 'dashboard/form/form-wizard',
                element: <FormWizard />
            },
            {
                path: 'dashboard/form/form-validation',
                element: <FormValidation />
            },
            // Table
            {
                path: 'dashboard/table/bootstrap-table',
                element: <BootstrapTable />
            },
            {
                path: 'dashboard/table/table-data',
                element: <TableData />
            },
            // Icon
            {
                path: 'dashboard/icon/solid',
                element: <Solid />
            },
            {
                path: 'dashboard/icon/outline',
                element: <Outline />
            },
            {
                path: 'dashboard/icon/dual-tone',
                element: <DualTone />
            },
            {
                path: 'test/form-validation',
                element: <Test />
            },
            {
                path: 'test/form-add-row',
                element: <AddRow />
            }
        ]
    }
]
// const DefaultRouter = () => {
//     return (
//         <TransitionGroup>
//             <CSSTransition classNames="fadein" timeout={300}>
//                 <Switch>
//                     <Route path="/dashboard" exact component={Index} />
//                     {/* user */}
//                     <Route path="/dashboard/app/user-profile"     exact component={UserProfile} />
//                     <Route path="/dashboard/app/user-add"         exact component={UserAdd}/>
//                     <Route path="/dashboard/app/user-list"        exact component={UserList}/>
//                     <Route path="/dashboard/app/user-privacy-setting" exact component={userProfileEdit}/>
//                      {/* widget */}
//                      <Route path="/dashboard/widget/widgetbasic"   exact component={Widgetbasic}/>
//                      <Route path="/dashboard/widget/widgetcard"    exact component={Widgetcard}/>
//                      <Route path="/dashboard/widget/widgetchart"   exact component={Widgetchart}/>
//                      {/* icon */}
//                      <Route path="/dashboard/icon/solid"           exact component={Solid}/>
//                      <Route path="/dashboard/icon/outline"         exact component={Outline}/>
//                      <Route path="/dashboard/icon/dual-tone"       exact component={DualTone}/>
//                      {/* From */}
//                      <Route path="/dashboard/form/form-element"    exact component={FormElement}/>
//                      <Route path="/dashboard/form/form-validation" exact component={FormValidation}/>
//                      <Route path="/dashboard/form/form-wizard"     exact component={FormWizard}/>
//                      {/* table */}
//                      <Route path="/dashboard/table/bootstrap-table" exact component={BootstrapTable}/>
//                      <Route path="/dashboard/table/table-data"      exact component={TableData}/>
//                      {/*special pages */}
//                      <Route path="/dashboard/special-pages/billing" exact component={Billing}/>
//                      <Route path="/dashboard/special-pages/kanban" exact component={Kanban}/>
//                      <Route path="/dashboard/special-pages/pricing" exact component={Pricing}/>
//                      <Route path="/dashboard/special-pages/timeline" exact component={Timeline}/>
//                      <Route path="/dashboard/special-pages/calender" exact component={Calender}/>
//                      {/* map */}
//                      <Route path="/dashboard/map/vector" exact component={Vector}/>
//                      <Route path="/dashboard/map/google" exact component={Google}/>
//                      {/* extra */}
//                      <Route path="/dashboard/extra/privacy-policy" exact component={PrivacyPolicy}/>
//                      <Route path="/dashboard/extra/terms-of-service" exact component={TermsofService}/>
//                      {/*admin*/}
//                      <Route path="/dashboard/admin/admin" exact component={Admin}/>
//                 </Switch>
//             </CSSTransition>
//         </TransitionGroup>
//     )
// }

// export default DefaultRouter
