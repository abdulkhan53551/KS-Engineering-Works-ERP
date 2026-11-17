import React, { useState, useContext, memo, Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Accordion, useAccordionButton, AccordionContext, Button } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { FaPen } from 'react-icons/fa';
import { CgAddR } from "react-icons/cg";
import { MdAddBox } from "react-icons/md";
import { usePermission } from '../../../../hooks/usePermission';

function CustomToggle({ children, eventKey, onClick }) {

    const { activeEventKey } = useContext(AccordionContext);

    const decoratedOnClick = useAccordionButton(eventKey, (active) => onClick({ state: !active, eventKey: eventKey }));

    const isCurrentEventKey = activeEventKey === eventKey;

    return (
        <Link to="#" aria-expanded={isCurrentEventKey ? 'true' : 'false'} className="nav-link" role="button" onClick={(e) => {
            decoratedOnClick(isCurrentEventKey)
        }}>
            {children}
        </Link>
    );
}

const VerticalNav = memo((props) => {
    const [activeMenu, setActiveMenu] = useState(false)
    const [active, setActive] = useState('')
    //location
    let location = useLocation();
    const { user, isSuperAdmin, role, can } = usePermission();
    const isAdmin = isSuperAdmin || role === 'administrator' || role === 'admin';
    const canViewEmployees = isSuperAdmin || can('employees', 'read');
    const canViewAttendance = isSuperAdmin || can('attendance', 'read');
    const canViewShifts = isSuperAdmin || can('shifts', 'read');
    const canViewLeaves = isSuperAdmin || can('leaves', 'read');
    const canViewPayroll = isSuperAdmin || can('payroll', 'read');
    const canViewSalaryTemplates = isSuperAdmin || can('salary-templates', 'read') || can('payroll', 'read');
    const canViewPayrollSettings = isSuperAdmin || can('payroll-settings', 'read') || can('payroll', 'read');
    const canViewAnyEmployeeSection = canViewEmployees || canViewAttendance || canViewShifts || canViewLeaves || canViewPayroll || canViewSalaryTemplates || canViewPayrollSettings;
    return (
        <Fragment>
            <Accordion as="ul" className="navbar-nav iq-main-menu">
                <li className="nav-item static-item">
                    <Link className="nav-link static-item disabled" to="#" tabIndex="-1">
                        <span className="default-icon">Home</span>
                        <span className="mini-icon">-</span>
                    </Link>
                </li>
                <li className={`${location.pathname === '/dashboard' ? 'active' : ''} nav-item `}>
                    <Link className={`${location.pathname === '/dashboard' ? 'active' : ''} nav-link `} aria-current="page" to="/dashboard" onClick={() => { }}>
                        <i className="icon">
                            <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.4" d="M16.0756 2H19.4616C20.8639 2 22.0001 3.14585 22.0001 4.55996V7.97452C22.0001 9.38864 20.8639 10.5345 19.4616 10.5345H16.0756C14.6734 10.5345 13.5371 9.38864 13.5371 7.97452V4.55996C13.5371 3.14585 14.6734 2 16.0756 2Z" fill="currentColor"></path>
                                <path fillRule="evenodd" clipRule="evenodd" d="M4.53852 2H7.92449C9.32676 2 10.463 3.14585 10.463 4.55996V7.97452C10.463 9.38864 9.32676 10.5345 7.92449 10.5345H4.53852C3.13626 10.5345 2 9.38864 2 7.97452V4.55996C2 3.14585 3.13626 2 4.53852 2ZM4.53852 13.4655H7.92449C9.32676 13.4655 10.463 14.6114 10.463 16.0255V19.44C10.463 20.8532 9.32676 22 7.92449 22H4.53852C3.13626 22 2 20.8532 2 19.44V16.0255C2 14.6114 3.13626 13.4655 4.53852 13.4655ZM19.4615 13.4655H16.0755C14.6732 13.4655 13.537 14.6114 13.537 16.0255V19.44C13.537 20.8532 14.6732 22 16.0755 22H19.4615C20.8637 22 22 20.8532 22 19.44V16.0255C22 14.6114 20.8637 13.4655 19.4615 13.4655Z" fill="currentColor"></path>
                            </svg>
                        </i>
                        <span className="item-name">Dashboard</span>
                    </Link>
                </li>
                <Accordion.Item as="li" eventKey="sidebar-sales" bsPrefix={`nav-item ${active === 'sales' ? 'active' : ''} `} onClick={() => setActive('sales')}>
                    <CustomToggle eventKey="sidebar-sales" onClick={(activeKey) => setActiveMenu(activeKey)}>
                        <i className="icon">
                            <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.9488 14.54C8.49884 14.54 5.58789 15.1038 5.58789 17.2795C5.58789 19.4562 8.51765 20.0001 11.9488 20.0001C15.3988 20.0001 18.3098 19.4364 18.3098 17.2606C18.3098 15.084 15.38 14.54 11.9488 14.54Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M11.949 12.467C14.2851 12.467 16.1583 10.5831 16.1583 8.23351C16.1583 5.88306 14.2851 4 11.949 4C9.61293 4 7.73975 5.88306 7.73975 8.23351C7.73975 10.5831 9.61293 12.467 11.949 12.467Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M21.0881 9.21923C21.6925 6.84176 19.9205 4.70654 17.664 4.70654C17.4187 4.70654 17.1841 4.73356 16.9549 4.77949C16.9244 4.78669 16.8904 4.802 16.8725 4.82902C16.8519 4.86324 16.8671 4.90917 16.8895 4.93889C17.5673 5.89528 17.9568 7.0597 17.9568 8.30967C17.9568 9.50741 17.5996 10.6241 16.9728 11.5508C16.9083 11.6462 16.9656 11.775 17.0793 11.7948C17.2369 11.8227 17.3981 11.8371 17.5629 11.8416C19.2059 11.8849 20.6807 10.8213 21.0881 9.21923Z" fill="currentColor"></path>
                                <path d="M22.8094 14.817C22.5086 14.1722 21.7824 13.73 20.6783 13.513C20.1572 13.3851 18.747 13.205 17.4352 13.2293C17.4155 13.232 17.4048 13.2455 17.403 13.2545C17.4003 13.2671 17.4057 13.2887 17.4316 13.3022C18.0378 13.6039 20.3811 14.916 20.0865 17.6834C20.074 17.8032 20.1698 17.9068 20.2888 17.8888C20.8655 17.8059 22.3492 17.4853 22.8094 16.4866C23.0637 15.9589 23.0637 15.3456 22.8094 14.817Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M7.04459 4.77973C6.81626 4.7329 6.58077 4.70679 6.33543 4.70679C4.07901 4.70679 2.30701 6.84201 2.9123 9.21947C3.31882 10.8216 4.79355 11.8851 6.43661 11.8419C6.60136 11.8374 6.76343 11.8221 6.92013 11.7951C7.03384 11.7753 7.09115 11.6465 7.02668 11.551C6.3999 10.6234 6.04263 9.50765 6.04263 8.30991C6.04263 7.05904 6.43303 5.89462 7.11085 4.93913C7.13234 4.90941 7.14845 4.86348 7.12696 4.82926C7.10906 4.80135 7.07593 4.78694 7.04459 4.77973Z" fill="currentColor"></path>
                                <path d="M3.32156 13.5127C2.21752 13.7297 1.49225 14.1719 1.19139 14.8167C0.936203 15.3453 0.936203 15.9586 1.19139 16.4872C1.65163 17.4851 3.13531 17.8066 3.71195 17.8885C3.83104 17.9065 3.92595 17.8038 3.91342 17.6832C3.61883 14.9167 5.9621 13.6046 6.56918 13.3029C6.59425 13.2885 6.59962 13.2677 6.59694 13.2542C6.59515 13.2452 6.5853 13.2317 6.5656 13.2299C5.25294 13.2047 3.84358 13.3848 3.32156 13.5127Z" fill="currentColor"></path>
                            </svg>
                        </i>
                        <span className="item-name">Sales</span>
                        <i className="right-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </i>
                    </CustomToggle>
                    <Accordion.Collapse eventKey="sidebar-sales">
                        <ul className="sub-nav">
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/sales/quotation') ? 'active' : ''} nav-link`} to="/sales/quotation">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Quotation</span>
                                    <Link className="me-2" to={`/sales/quotation/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                                <Link className={`${location.pathname.includes('/sales/proforma-invoice') ? 'active' : ''} nav-link`} to="/sales/proforma-invoice">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Proforma Invoice</span>
                                    <Link className="me-2" to={`/sales/proforma-invoice/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                                <Link className={`${location.pathname.includes('/sales/invoice') ? 'active' : ''} nav-link`} to="/sales/invoice">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Invoice</span>
                                    <Link className="me-2" to={`/sales/invoice/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                                <Link className={`${location.pathname.includes('/sales/challans') ? 'active' : ''} nav-link`} to="/sales/challans">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Challan</span>
                                    <Link className="me-2" to={`/sales/challans/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                                <Link className={`${location.pathname.includes('/sales/eway-bill') ? 'active' : ''} nav-link`} to="/sales/eway-bill">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">E way bill</span>
                                    <Link className="me-2" to={`/sales/eway-bill/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>
                <Accordion.Item as="li" eventKey="sidebar-purchase" bsPrefix={`nav-item ${active === 'purchase' ? 'active' : ''} `} onClick={() => setActive('purchase')}>
                    <CustomToggle eventKey="sidebar-purchase" onClick={(activeKey) => setActiveMenu(activeKey)}>
                        <i className="icon">
                            <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.9488 14.54C8.49884 14.54 5.58789 15.1038 5.58789 17.2795C5.58789 19.4562 8.51765 20.0001 11.9488 20.0001C15.3988 20.0001 18.3098 19.4364 18.3098 17.2606C18.3098 15.084 15.38 14.54 11.9488 14.54Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M11.949 12.467C14.2851 12.467 16.1583 10.5831 16.1583 8.23351C16.1583 5.88306 14.2851 4 11.949 4C9.61293 4 7.73975 5.88306 7.73975 8.23351C7.73975 10.5831 9.61293 12.467 11.949 12.467Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M21.0881 9.21923C21.6925 6.84176 19.9205 4.70654 17.664 4.70654C17.4187 4.70654 17.1841 4.73356 16.9549 4.77949C16.9244 4.78669 16.8904 4.802 16.8725 4.82902C16.8519 4.86324 16.8671 4.90917 16.8895 4.93889C17.5673 5.89528 17.9568 7.0597 17.9568 8.30967C17.9568 9.50741 17.5996 10.6241 16.9728 11.5508C16.9083 11.6462 16.9656 11.775 17.0793 11.7948C17.2369 11.8227 17.3981 11.8371 17.5629 11.8416C19.2059 11.8849 20.6807 10.8213 21.0881 9.21923Z" fill="currentColor"></path>
                                <path d="M22.8094 14.817C22.5086 14.1722 21.7824 13.73 20.6783 13.513C20.1572 13.3851 18.747 13.205 17.4352 13.2293C17.4155 13.232 17.4048 13.2455 17.403 13.2545C17.4003 13.2671 17.4057 13.2887 17.4316 13.3022C18.0378 13.6039 20.3811 14.916 20.0865 17.6834C20.074 17.8032 20.1698 17.9068 20.2888 17.8888C20.8655 17.8059 22.3492 17.4853 22.8094 16.4866C23.0637 15.9589 23.0637 15.3456 22.8094 14.817Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M7.04459 4.77973C6.81626 4.7329 6.58077 4.70679 6.33543 4.70679C4.07901 4.70679 2.30701 6.84201 2.9123 9.21947C3.31882 10.8216 4.79355 11.8851 6.43661 11.8419C6.60136 11.8374 6.76343 11.8221 6.92013 11.7951C7.03384 11.7753 7.09115 11.6465 7.02668 11.551C6.3999 10.6234 6.04263 9.50765 6.04263 8.30991C6.04263 7.05904 6.43303 5.89462 7.11085 4.93913C7.13234 4.90941 7.14845 4.86348 7.12696 4.82926C7.10906 4.80135 7.07593 4.78694 7.04459 4.77973Z" fill="currentColor"></path>
                                <path d="M3.32156 13.5127C2.21752 13.7297 1.49225 14.1719 1.19139 14.8167C0.936203 15.3453 0.936203 15.9586 1.19139 16.4872C1.65163 17.4851 3.13531 17.8066 3.71195 17.8885C3.83104 17.9065 3.92595 17.8038 3.91342 17.6832C3.61883 14.9167 5.9621 13.6046 6.56918 13.3029C6.59425 13.2885 6.59962 13.2677 6.59694 13.2542C6.59515 13.2452 6.5853 13.2317 6.5656 13.2299C5.25294 13.2047 3.84358 13.3848 3.32156 13.5127Z" fill="currentColor"></path>
                            </svg>
                        </i>
                        <span className="item-name">Purchase</span>
                        <i className="right-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </i>
                    </CustomToggle>
                    <Accordion.Collapse eventKey="sidebar-purchase">
                        <ul className="sub-nav">
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/purchase/purchase-order') ? 'active' : ''} nav-link`} to="/purchase/purchase-order">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Purchase Order</span>
                                    <Link className="me-2" to={`/purchase/purchase-order/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/purchase/vendor-bills') ? 'active' : ''} nav-link`} to="/purchase/vendor-bills">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Vendor Bills</span>
                                    <Link className="me-2" to="/purchase/vendor-bills/create">
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>
                <Accordion.Item as="li" eventKey="sidebar-payments" bsPrefix={`nav-item ${active === 'payments' ? 'active' : ''} `} onClick={() => setActive('payments')}>
                    <CustomToggle eventKey="sidebar-payments" onClick={(activeKey) => setActiveMenu(activeKey)}>
                        <i className="icon">
                            <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.4" d="M19.4616 4H4.53852C3.13626 4 2 5.14585 2 6.55996V17.44C2 18.8532 3.13626 20 4.53852 20H19.4616C20.8639 20 22 18.8532 22 17.44V6.55996C22 5.14585 20.8639 4 19.4616 4Z" fill="currentColor"></path>
                                <path d="M2 9.5H22V12.5H2V9.5Z" fill="currentColor"></path>
                                <circle cx="6.5" cy="16" r="1.5" fill="currentColor"></circle>
                            </svg>
                        </i>
                        <span className="item-name">Payments</span>
                        <i className="right-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </i>
                    </CustomToggle>
                    <Accordion.Collapse eventKey="sidebar-payments">
                        <ul className="sub-nav">
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/payments') ? 'active' : ''} nav-link`} to="/payments/receipts">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Customer Receipts</span>
                                    <Link className="me-2" to="/payments/receipts/create">
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/payments/vendor-payments') ? 'active' : ''} nav-link`} to="/payments/vendor-payments">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Vendor Payments</span>
                                    <Link className="me-2" to="/payments/vendor-payments/create">
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>
                {canViewAnyEmployeeSection && (
                    <Accordion.Item as="li" eventKey="sidebar-employees" bsPrefix={`nav-item ${active === 'employee' || location.pathname.includes('/employee') ? 'active' : ''} `} onClick={() => setActive('employee')}>
                        <CustomToggle eventKey="sidebar-employees" onClick={(activeKey) => setActiveMenu(activeKey)}>
                            <i className="icon">
                                <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 14.54C8.55 14.54 5.64 15.1 5.64 17.28C5.64 19.46 8.57 20 12 20C15.45 20 18.36 19.44 18.36 17.26C18.36 15.08 15.43 14.54 12 14.54Z" fill="currentColor"></path>
                                    <path opacity="0.4" d="M12 12.47C14.34 12.47 16.21 10.59 16.21 8.24C16.21 5.89 14.34 4.01 12 4.01C9.66 4.01 7.79 5.89 7.79 8.24C7.79 10.59 9.66 12.47 12 12.47Z" fill="currentColor"></path>
                                    <path opacity="0.4" d="M21.0881 9.21923C21.6925 6.84176 19.9205 4.70654 17.664 4.70654C17.4187 4.70654 17.1841 4.73356 16.9549 4.77949C16.8904 4.802 16.8725 4.82902 16.8519 4.86324C16.8671 4.90917 16.8895 4.93889C17.5673 5.89528 17.9568 7.0597 17.9568 8.30967C17.9568 9.50741 17.5996 10.6241 16.9728 11.5508C17.2369 11.8227 17.3981 11.8371 17.5629 11.8416C19.2059 11.8849 20.6807 10.8213 21.0881 9.21923Z" fill="currentColor"></path>
                                    <path d="M22.8094 14.817C22.5086 14.1722 21.7824 13.73 20.6783 13.513C20.1572 13.3851 18.747 13.205 17.4352 13.2293C18.0378 13.6039 20.3811 14.916 20.0865 17.6834C20.8655 17.8059 22.3492 17.4853 22.8094 16.4866C23.0637 15.9589 23.0637 15.3456 22.8094 14.817Z" fill="currentColor"></path>
                                </svg>
                            </i>
                            <span className="item-name">Employees & HR</span>
                            <i className="right-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </i>
                        </CustomToggle>
                        <Accordion.Collapse eventKey="sidebar-employees">
                            <ul className="sub-nav">
                                {canViewEmployees && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname === '/dashboard/employee' || location.pathname === '/employee' ? 'active' : ''} nav-link`} to="/dashboard/employee">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Employee Directory</span>
                                            {(isSuperAdmin || can('employees', 'create')) && (
                                                <Link className="me-2" to="/dashboard/employee/create">
                                                    <Button
                                                        className="d-flex align-items-center justify-content-center p-1 rounded"
                                                        style={{ transition: 'all 0.2s ease' }}
                                                    >
                                                        <MdAddBox size={20} color="white" className="transition-colors" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </Link>
                                    </li>
                                )}
                                {canViewAttendance && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname.includes('/employee/attendance') && !location.pathname.includes('/attendance-summary') ? 'active' : ''} nav-link`} to="/dashboard/employee/attendance">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Attendance Sheet</span>
                                        </Link>
                                    </li>
                                )}
                                {canViewAttendance && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname.includes('/employee/attendance-summary') ? 'active' : ''} nav-link`} to="/dashboard/employee/attendance-summary">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Attendance Summary</span>
                                        </Link>
                                    </li>
                                )}
                                {canViewShifts && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname.includes('/employee/shifts') ? 'active' : ''} nav-link`} to="/dashboard/employee/shifts">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Shifts & Rosters</span>
                                        </Link>
                                    </li>
                                )}
                                {canViewLeaves && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname.includes('/employee/leaves') ? 'active' : ''} nav-link`} to="/dashboard/employee/leaves">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Leave Requests</span>
                                        </Link>
                                    </li>
                                )}
                                {canViewPayroll && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname === '/dashboard/employee/payroll' || location.pathname === '/employee/payroll' ? 'active' : ''} nav-link`} to="/dashboard/employee/payroll">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Payroll & Slips</span>
                                        </Link>
                                    </li>
                                )}
                                {canViewPayroll && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname.includes('/employee/advances') ? 'active' : ''} nav-link`} to="/dashboard/employee/advances">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Advances & Loans</span>
                                        </Link>
                                    </li>
                                )}
                                {canViewSalaryTemplates && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname.includes('/employee/salary-templates') ? 'active' : ''} nav-link`} to="/dashboard/employee/salary-templates">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Salary Templates</span>
                                        </Link>
                                    </li>
                                )}
                                {canViewPayrollSettings && (
                                    <li className="nav-item">
                                        <Link className={`${location.pathname.includes('/employee/payroll-settings') ? 'active' : ''} nav-link`} to="/dashboard/employee/payroll-settings">
                                            <i className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                    <g><circle cx="12" cy="12" r="8" fill="currentColor"></circle></g>
                                                </svg>
                                            </i>
                                            <span className="item-name">Payroll Settings</span>
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </Accordion.Collapse>
                    </Accordion.Item>
                )}
                <Accordion.Item as="li" eventKey="sidebar-organization" bsPrefix={`nav-item ${active === 'organization' ? 'active' : ''} `} onClick={() => setActive('organization')}>
                    <CustomToggle eventKey="sidebar-organization" onClick={(activeKey) => setActiveMenu(activeKey)}>
                        <i className="icon">
                            <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.9488 14.54C8.49884 14.54 5.58789 15.1038 5.58789 17.2795C5.58789 19.4562 8.51765 20.0001 11.9488 20.0001C15.3988 20.0001 18.3098 19.4364 18.3098 17.2606C18.3098 15.084 15.38 14.54 11.9488 14.54Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M11.949 12.467C14.2851 12.467 16.1583 10.5831 16.1583 8.23351C16.1583 5.88306 14.2851 4 11.949 4C9.61293 4 7.73975 5.88306 7.73975 8.23351C7.73975 10.5831 9.61293 12.467 11.949 12.467Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M21.0881 9.21923C21.6925 6.84176 19.9205 4.70654 17.664 4.70654C17.4187 4.70654 17.1841 4.73356 16.9549 4.77949C16.9244 4.78669 16.8904 4.802 16.8725 4.82902C16.8519 4.86324 16.8671 4.90917 16.8895 4.93889C17.5673 5.89528 17.9568 7.0597 17.9568 8.30967C17.9568 9.50741 17.5996 10.6241 16.9728 11.5508C16.9083 11.6462 16.9656 11.775 17.0793 11.7948C17.2369 11.8227 17.3981 11.8371 17.5629 11.8416C19.2059 11.8849 20.6807 10.8213 21.0881 9.21923Z" fill="currentColor"></path>
                                <path d="M22.8094 14.817C22.5086 14.1722 21.7824 13.73 20.6783 13.513C20.1572 13.3851 18.747 13.205 17.4352 13.2293C17.4155 13.232 17.4048 13.2455 17.403 13.2545C17.4003 13.2671 17.4057 13.2887 17.4316 13.3022C18.0378 13.6039 20.3811 14.916 20.0865 17.6834C20.074 17.8032 20.1698 17.9068 20.2888 17.8888C20.8655 17.8059 22.3492 17.4853 22.8094 16.4866C23.0637 15.9589 23.0637 15.3456 22.8094 14.817Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M7.04459 4.77973C6.81626 4.7329 6.58077 4.70679 6.33543 4.70679C4.07901 4.70679 2.30701 6.84201 2.9123 9.21947C3.31882 10.8216 4.79355 11.8851 6.43661 11.8419C6.60136 11.8374 6.76343 11.8221 6.92013 11.7951C7.03384 11.7753 7.09115 11.6465 7.02668 11.551C6.3999 10.6234 6.04263 9.50765 6.04263 8.30991C6.04263 7.05904 6.43303 5.89462 7.11085 4.93913C7.13234 4.90941 7.14845 4.86348 7.12696 4.82926C7.10906 4.80135 7.07593 4.78694 7.04459 4.77973Z" fill="currentColor"></path>
                                <path d="M3.32156 13.5127C2.21752 13.7297 1.49225 14.1719 1.19139 14.8167C0.936203 15.3453 0.936203 15.9586 1.19139 16.4872C1.65163 17.4851 3.13531 17.8066 3.71195 17.8885C3.83104 17.9065 3.92595 17.8038 3.91342 17.6832C3.61883 14.9167 5.9621 13.6046 6.56918 13.3029C6.59425 13.2885 6.59962 13.2677 6.59694 13.2542C6.59515 13.2452 6.5853 13.2317 6.5656 13.2299C5.25294 13.2047 3.84358 13.3848 3.32156 13.5127Z" fill="currentColor"></path>
                            </svg>
                        </i>
                        <span className="item-name">Organization</span>
                        <i className="right-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </i>
                    </CustomToggle>
                    <Accordion.Collapse eventKey="sidebar-organization">
                        <ul className="sub-nav">
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/firms') ? 'active' : ''} nav-link`} to="/firms">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Firms</span>
                                    <Link className="me-2" to={`/firms/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`${location.pathname === '/parties' || (location.pathname.startsWith('/parties') && !location.pathname.includes('/party-roles')) ? 'active' : ''} nav-link`} to="/parties">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Parties</span>
                                    <Link className="me-2" to={`/parties/create`}>
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/party-roles') ? 'active' : ''} nav-link`} to="/parties/party-roles">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Party Roles</span>
                                    <Link className="me-2" to="/parties/party-roles?action=create">
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>
                <Accordion.Item as="li" eventKey="sidebar-masters" bsPrefix={`nav-item ${active === 'masters' ? 'active' : ''} `} onClick={() => setActive('masters')}>
                    <CustomToggle eventKey="sidebar-masters" onClick={(activeKey) => setActiveMenu(activeKey)}>
                        <i className="icon">
                            <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.4" d="M19.4616 2H16.0756C14.6734 2 13.5371 3.14585 13.5371 4.55996V7.97452C13.5371 9.38864 14.6734 10.5345 16.0756 10.5345H19.4616C20.8639 10.5345 22.0001 9.38864 22.0001 7.97452V4.55996C22.0001 3.14585 20.8639 2 19.4616 2Z" fill="currentColor"></path>
                                <path fillRule="evenodd" clipRule="evenodd" d="M4.53852 2H7.92449C9.32676 2 10.463 3.14585 10.463 4.55996V7.97452C10.463 9.38864 9.32676 10.5345 7.92449 10.5345H4.53852C3.13626 10.5345 2 9.38864 2 7.97452V4.55996C2 3.14585 3.13626 2 4.53852 2ZM4.53852 13.4655H7.92449C9.32676 13.4655 10.463 14.6114 10.463 16.0255V19.44C10.463 20.8532 9.32676 22 7.92449 22H4.53852C3.13626 22 2 20.8532 2 19.44V16.0255C2 14.6114 3.13626 13.4655 4.53852 13.4655ZM19.4615 13.4655H16.0755C14.6732 13.4655 13.537 14.6114 13.537 16.0255V19.44C13.537 20.8532 14.6732 22 16.0755 22H19.4615C20.8637 22 22 20.8532 22 19.44V16.0255C22 14.6114 20.8637 13.4655 19.4615 13.4655Z" fill="currentColor"></path>
                            </svg>
                        </i>
                        <span className="item-name">Masters</span>
                        <i className="right-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </i>
                    </CustomToggle>
                    <Accordion.Collapse eventKey="sidebar-masters">
                        <ul className="sub-nav">
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/masters/products') ? 'active' : ''} nav-link`} to="/masters/products">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Products</span>
                                    <Link className="me-2" to="/masters/products/create">
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`${location.pathname.includes('/masters/contact-roles') ? 'active' : ''} nav-link`} to="/masters/contact-roles">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <span className="item-name">Contact Roles</span>
                                    <Link className="me-2" to="/masters/contact-roles?action=create">
                                        <Button
                                            className="d-flex align-items-center justify-content-center p-1 rounded"
                                            style={{ transition: 'all 0.2s ease' }}
                                        >
                                            <MdAddBox
                                                size={20}
                                                color="white"
                                                className="transition-colors"
                                            />
                                        </Button>
                                    </Link>
                                </Link>
                            </li>
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>
                <li><hr className="hr-horizontal" /></li>
                <Accordion.Item as="li" eventKey="sidebar-user" bsPrefix={`nav-item ${active === 'user' ? 'active' : ''} `} onClick={() => setActive('user')}>
                    <CustomToggle eventKey="sidebar-user" onClick={(activeKey) => setActiveMenu(activeKey)}>
                        <i className="icon">
                            <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.9488 14.54C8.49884 14.54 5.58789 15.1038 5.58789 17.2795C5.58789 19.4562 8.51765 20.0001 11.9488 20.0001C15.3988 20.0001 18.3098 19.4364 18.3098 17.2606C18.3098 15.084 15.38 14.54 11.9488 14.54Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M11.949 12.467C14.2851 12.467 16.1583 10.5831 16.1583 8.23351C16.1583 5.88306 14.2851 4 11.949 4C9.61293 4 7.73975 5.88306 7.73975 8.23351C7.73975 10.5831 9.61293 12.467 11.949 12.467Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M21.0881 9.21923C21.6925 6.84176 19.9205 4.70654 17.664 4.70654C17.4187 4.70654 17.1841 4.73356 16.9549 4.77949C16.9244 4.78669 16.8904 4.802 16.8725 4.82902C16.8519 4.86324 16.8671 4.90917 16.8895 4.93889C17.5673 5.89528 17.9568 7.0597 17.9568 8.30967C17.9568 9.50741 17.5996 10.6241 16.9728 11.5508C16.9083 11.6462 16.9656 11.775 17.0793 11.7948C17.2369 11.8227 17.3981 11.8371 17.5629 11.8416C19.2059 11.8849 20.6807 10.8213 21.0881 9.21923Z" fill="currentColor"></path>
                                <path d="M22.8094 14.817C22.5086 14.1722 21.7824 13.73 20.6783 13.513C20.1572 13.3851 18.747 13.205 17.4352 13.2293C17.4155 13.232 17.4048 13.2455 17.403 13.2545C17.4003 13.2671 17.4057 13.2887 17.4316 13.3022C18.0378 13.6039 20.3811 14.916 20.0865 17.6834C20.074 17.8032 20.1698 17.9068 20.2888 17.8888C20.8655 17.8059 22.3492 17.4853 22.8094 16.4866C23.0637 15.9589 23.0637 15.3456 22.8094 14.817Z" fill="currentColor"></path>
                                <path opacity="0.4" d="M7.04459 4.77973C6.81626 4.7329 6.58077 4.70679 6.33543 4.70679C4.07901 4.70679 2.30701 6.84201 2.9123 9.21947C3.31882 10.8216 4.79355 11.8851 6.43661 11.8419C6.60136 11.8374 6.76343 11.8221 6.92013 11.7951C7.03384 11.7753 7.09115 11.6465 7.02668 11.551C6.3999 10.6234 6.04263 9.50765 6.04263 8.30991C6.04263 7.05904 6.43303 5.89462 7.11085 4.93913C7.13234 4.90941 7.14845 4.86348 7.12696 4.82926C7.10906 4.80135 7.07593 4.78694 7.04459 4.77973Z" fill="currentColor"></path>
                                <path d="M3.32156 13.5127C2.21752 13.7297 1.49225 14.1719 1.19139 14.8167C0.936203 15.3453 0.936203 15.9586 1.19139 16.4872C1.65163 17.4851 3.13531 17.8066 3.71195 17.8885C3.83104 17.9065 3.92595 17.8038 3.91342 17.6832C3.61883 14.9167 5.9621 13.6046 6.56918 13.3029C6.59425 13.2885 6.59962 13.2677 6.59694 13.2542C6.59515 13.2452 6.5853 13.2317 6.5656 13.2299C5.25294 13.2047 3.84358 13.3848 3.32156 13.5127Z" fill="currentColor"></path>
                            </svg>
                        </i>
                        <span className="item-name">Users</span>
                        <i className="right-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </i>
                    </CustomToggle>
                    <Accordion.Collapse eventKey="sidebar-user">
                        <ul className="sub-nav">
                            <li className="nav-item">
                                <Link className={`${location.pathname === '/dashboard/app/user-list' ? 'active' : ''} nav-link`} to="/dashboard/app/user-list">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <i className="sidenav-mini-icon"> U </i>
                                    <span className="item-name">User List</span>
                                </Link>
                            </li>
                            {isAdmin && (
                                <li className="nav-item">
                                    <Link className={`${location.pathname === '/admin/roles-permissions' || location.pathname === '/dashboard/admin/roles-permissions' ? 'active' : ''} nav-link`} to="/dashboard/admin/roles-permissions">
                                        <i className="icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                                <g>
                                                    <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                                </g>
                                            </svg>
                                        </i>
                                        <i className="sidenav-mini-icon"> R </i>
                                        <span className="item-name">Roles & Permissions</span>
                                    </Link>
                                </li>
                            )}
                            <li className="nav-item">
                                <Link className={`${location.pathname === '/dashboard/app/user-profile' ? 'active' : ''} nav-link`} to="/dashboard/app/user-profile">
                                    <i className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" viewBox="0 0 24 24" fill="currentColor">
                                            <g>
                                                <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                                            </g>
                                        </svg>
                                    </i>
                                    <i className="sidenav-mini-icon"> P </i>
                                    <span className="item-name">User Profile</span>
                                </Link>
                            </li>
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>
            </Accordion>
        </Fragment>
    )
})

export default VerticalNav
