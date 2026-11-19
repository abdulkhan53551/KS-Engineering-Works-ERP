import React, { useMemo, useState, useEffect, useContext, memo, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Accordion, useAccordionButton, AccordionContext } from 'react-bootstrap';
import {
    FiGrid,
    FiTrendingUp,
    FiShoppingCart,
    FiCreditCard,
    FiUsers,
    FiBriefcase,
    FiSliders,
    FiShield,
    FiPlus,
    FiChevronRight
} from 'react-icons/fi';
import { usePermission } from '../../../../hooks/usePermission';

function CustomToggle({ eventKey, icon: Icon, title, onClick }) {
    const { activeEventKey } = useContext(AccordionContext);
    const decoratedOnClick = useAccordionButton(eventKey, (active) => onClick && onClick({ state: !active, eventKey }));
    const isCurrentEventKey = activeEventKey === eventKey;

    return (
        <Link
            to="#"
            aria-expanded={isCurrentEventKey ? 'true' : 'false'}
            className="nav-link"
            role="button"
            title={title}
            onClick={(e) => {
                e.preventDefault();
                decoratedOnClick(isCurrentEventKey);
            }}
        >
            {Icon && (
                <i className="icon">
                    <Icon size={17} />
                </i>
            )}
            <span className="item-name">{title}</span>
            <i className="right-icon">
                <FiChevronRight size={14} />
            </i>
        </Link>
    );
}

const SubNavItem = ({ to, label, miniLetter, createTo, createTitle, isActive }) => {
    const letter = miniLetter || label.charAt(0).toUpperCase();

    return (
        <li className="subnav-item-wrapper" title={label}>
            <Link className={`subnav-link ${isActive ? 'active' : ''}`} to={to}>
                <span className="subnav-bullet" />
                <span className="subnav-label">{label}</span>
                <span className="subnav-mini-letter">{letter}</span>
            </Link>
            {createTo && (
                <Link
                    to={createTo}
                    className="subnav-quick-add"
                    title={createTitle || `Create ${label}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <FiPlus size={12} />
                </Link>
            )}
        </li>
    );
};

const VerticalNav = memo(() => {
    const location = useLocation();
    const pathname = location.pathname;

    const { isSuperAdmin, role, can } = usePermission();
    const isAdmin = isSuperAdmin || role === 'administrator' || role === 'admin';
    const canViewEmployees = isSuperAdmin || can('employees', 'read');
    const canViewAttendance = isSuperAdmin || can('attendance', 'read');
    const canViewShifts = isSuperAdmin || can('shifts', 'read');
    const canViewLeaves = isSuperAdmin || can('leaves', 'read');
    const canViewPayroll = isSuperAdmin || can('payroll', 'read');
    const canViewSalaryTemplates = isSuperAdmin || can('salary-templates', 'read') || can('payroll', 'read');
    const canViewPayrollSettings = isSuperAdmin || can('payroll-settings', 'read') || can('payroll', 'read');
    const canViewAnyEmployeeSection =
        canViewEmployees ||
        canViewAttendance ||
        canViewShifts ||
        canViewLeaves ||
        canViewPayroll ||
        canViewSalaryTemplates ||
        canViewPayrollSettings;

    // Determine current active section from URL
    const currentSectionKey = useMemo(() => {
        if (pathname.startsWith('/sales')) return 'sidebar-sales';
        if (pathname.startsWith('/purchase')) return 'sidebar-purchase';
        if (pathname.startsWith('/payments')) return 'sidebar-payments';
        if (pathname.includes('/employee')) return 'sidebar-employees';
        if (pathname.includes('/firms') || pathname.startsWith('/parties')) return 'sidebar-organization';
        if (pathname.startsWith('/masters')) return 'sidebar-masters';
        if (pathname.includes('/user') || pathname.includes('/admin/roles-permissions')) return 'sidebar-user';
        return null;
    }, [pathname]);

    const [activeSection, setActiveSection] = useState(currentSectionKey);

    useEffect(() => {
        if (currentSectionKey) {
            setActiveSection(currentSectionKey);
        }
    }, [currentSectionKey]);

    const handleToggle = (key) => {
        setActiveSection((prev) => (prev === key ? null : key));
    };

    return (
        <Fragment>
            <Accordion as="ul" className="navbar-nav iq-main-menu" activeKey={activeSection}>
                {/* Home / Overview */}
                <li className="nav-item static-item">
                    <span className="default-icon">Home</span>
                </li>

                {/* Dashboard */}
                <li className={`${pathname === '/dashboard' ? 'active' : ''} nav-item`}>
                    <Link
                        className={`${pathname === '/dashboard' ? 'active' : ''} nav-link`}
                        to="/dashboard"
                        title="Dashboard"
                    >
                        <i className="icon">
                            <FiGrid size={17} />
                        </i>
                        <span className="item-name">Dashboard</span>
                    </Link>
                </li>

                {/* Sales Section */}
                <Accordion.Item as="li" eventKey="sidebar-sales" bsPrefix="nav-item">
                    <CustomToggle
                        eventKey="sidebar-sales"
                        icon={FiTrendingUp}
                        title="Sales"
                        onClick={() => handleToggle('sidebar-sales')}
                    />
                    <Accordion.Collapse eventKey="sidebar-sales">
                        <ul className="sub-nav">
                            <SubNavItem
                                to="/sales/quotation"
                                label="Quotation"
                                miniLetter="Q"
                                createTo="/sales/quotation/create"
                                isActive={pathname.includes('/sales/quotation')}
                            />
                            <SubNavItem
                                to="/sales/proforma-invoice"
                                label="Proforma Invoice"
                                miniLetter="P"
                                createTo="/sales/proforma-invoice/create"
                                isActive={pathname.includes('/sales/proforma-invoice')}
                            />
                            <SubNavItem
                                to="/sales/invoice"
                                label="Invoice"
                                miniLetter="I"
                                createTo="/sales/invoice/create"
                                isActive={pathname.includes('/sales/invoice')}
                            />
                            <SubNavItem
                                to="/sales/challans"
                                label="Challan"
                                miniLetter="C"
                                createTo="/sales/challans/create"
                                isActive={pathname.includes('/sales/challans')}
                            />
                            <SubNavItem
                                to="/sales/eway-bill"
                                label="E Way Bill"
                                miniLetter="E"
                                createTo="/sales/eway-bill/create"
                                isActive={pathname.includes('/sales/eway-bill')}
                            />
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>

                {/* Purchase Section */}
                <Accordion.Item as="li" eventKey="sidebar-purchase" bsPrefix="nav-item">
                    <CustomToggle
                        eventKey="sidebar-purchase"
                        icon={FiShoppingCart}
                        title="Purchase"
                        onClick={() => handleToggle('sidebar-purchase')}
                    />
                    <Accordion.Collapse eventKey="sidebar-purchase">
                        <ul className="sub-nav">
                            <SubNavItem
                                to="/purchase/purchase-order"
                                label="Purchase Order"
                                miniLetter="P"
                                createTo="/purchase/purchase-order/create"
                                isActive={pathname.includes('/purchase/purchase-order')}
                            />
                            <SubNavItem
                                to="/purchase/vendor-bills"
                                label="Vendor Bills"
                                miniLetter="V"
                                createTo="/purchase/vendor-bills/create"
                                isActive={pathname.includes('/purchase/vendor-bills')}
                            />
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>

                {/* Payments Section */}
                <Accordion.Item as="li" eventKey="sidebar-payments" bsPrefix="nav-item">
                    <CustomToggle
                        eventKey="sidebar-payments"
                        icon={FiCreditCard}
                        title="Payments"
                        onClick={() => handleToggle('sidebar-payments')}
                    />
                    <Accordion.Collapse eventKey="sidebar-payments">
                        <ul className="sub-nav">
                            <SubNavItem
                                to="/payments/receipts"
                                label="Customer Receipts"
                                miniLetter="R"
                                createTo="/payments/receipts/create"
                                isActive={pathname === '/payments' || pathname.startsWith('/payments/receipts')}
                            />
                            <SubNavItem
                                to="/payments/vendor-payments"
                                label="Vendor Payments"
                                miniLetter="P"
                                createTo="/payments/vendor-payments/create"
                                isActive={pathname.startsWith('/payments/vendor-payments')}
                            />
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>

                {/* Employees & HR Section */}
                {canViewAnyEmployeeSection && (
                    <Accordion.Item as="li" eventKey="sidebar-employees" bsPrefix="nav-item">
                        <CustomToggle
                            eventKey="sidebar-employees"
                            icon={FiUsers}
                            title="Employees & HR"
                            onClick={() => handleToggle('sidebar-employees')}
                        />
                        <Accordion.Collapse eventKey="sidebar-employees">
                            <ul className="sub-nav">
                                {canViewEmployees && (
                                    <SubNavItem
                                        to="/dashboard/employee"
                                        label="Employee Directory"
                                        miniLetter="E"
                                        createTo={(isSuperAdmin || can('employees', 'create')) ? '/dashboard/employee/create' : null}
                                        isActive={pathname === '/dashboard/employee' || pathname === '/employee'}
                                    />
                                )}
                                {canViewAttendance && (
                                    <SubNavItem
                                        to="/dashboard/employee/attendance"
                                        label="Attendance Sheet"
                                        miniLetter="A"
                                        isActive={pathname.includes('/employee/attendance') && !pathname.includes('/attendance-summary')}
                                    />
                                )}
                                {canViewAttendance && (
                                    <SubNavItem
                                        to="/dashboard/employee/attendance-summary"
                                        label="Attendance Summary"
                                        miniLetter="S"
                                        isActive={pathname.includes('/employee/attendance-summary')}
                                    />
                                )}
                                {canViewShifts && (
                                    <SubNavItem
                                        to="/dashboard/employee/shifts"
                                        label="Shifts & Rosters"
                                        miniLetter="R"
                                        isActive={pathname.includes('/employee/shifts')}
                                    />
                                )}
                                {canViewLeaves && (
                                    <SubNavItem
                                        to="/dashboard/employee/leaves"
                                        label="Leave Requests"
                                        miniLetter="L"
                                        isActive={pathname.includes('/employee/leaves')}
                                    />
                                )}
                                {canViewPayroll && (
                                    <SubNavItem
                                        to="/dashboard/employee/payroll"
                                        label="Payroll & Slips"
                                        miniLetter="P"
                                        isActive={pathname === '/dashboard/employee/payroll' || pathname === '/employee/payroll'}
                                    />
                                )}
                                {canViewPayroll && (
                                    <SubNavItem
                                        to="/dashboard/employee/advances"
                                        label="Advances & Loans"
                                        miniLetter="A"
                                        isActive={pathname.includes('/employee/advances')}
                                    />
                                )}
                                {canViewSalaryTemplates && (
                                    <SubNavItem
                                        to="/dashboard/employee/salary-templates"
                                        label="Salary Templates"
                                        miniLetter="T"
                                        isActive={pathname.includes('/employee/salary-templates')}
                                    />
                                )}
                                {canViewPayrollSettings && (
                                    <SubNavItem
                                        to="/dashboard/employee/payroll-settings"
                                        label="Payroll Settings"
                                        miniLetter="S"
                                        isActive={pathname.includes('/employee/payroll-settings')}
                                    />
                                )}
                            </ul>
                        </Accordion.Collapse>
                    </Accordion.Item>
                )}

                {/* Organization Section */}
                <Accordion.Item as="li" eventKey="sidebar-organization" bsPrefix="nav-item">
                    <CustomToggle
                        eventKey="sidebar-organization"
                        icon={FiBriefcase}
                        title="Organization"
                        onClick={() => handleToggle('sidebar-organization')}
                    />
                    <Accordion.Collapse eventKey="sidebar-organization">
                        <ul className="sub-nav">
                            <SubNavItem
                                to="/firms"
                                label="Firms & Branches"
                                miniLetter="F"
                                createTo="/firms/create"
                                isActive={pathname.startsWith('/firms')}
                            />
                            <SubNavItem
                                to="/parties"
                                label="Parties & Customers"
                                miniLetter="P"
                                createTo="/parties/create"
                                isActive={pathname === '/parties' || (pathname.startsWith('/parties') && !pathname.includes('party-roles'))}
                            />
                            <SubNavItem
                                to="/parties/party-roles"
                                label="Party Roles"
                                miniLetter="R"
                                isActive={pathname.includes('party-roles')}
                            />
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>

                {/* Masters Section */}
                <Accordion.Item as="li" eventKey="sidebar-masters" bsPrefix="nav-item">
                    <CustomToggle
                        eventKey="sidebar-masters"
                        icon={FiSliders}
                        title="Masters"
                        onClick={() => handleToggle('sidebar-masters')}
                    />
                    <Accordion.Collapse eventKey="sidebar-masters">
                        <ul className="sub-nav">
                            <SubNavItem
                                to="/masters/products"
                                label="Product Catalog"
                                miniLetter="P"
                                createTo="/masters/products/create"
                                isActive={pathname.startsWith('/masters/products')}
                            />
                            <SubNavItem
                                to="/masters/contact-roles"
                                label="Contact Roles"
                                miniLetter="C"
                                isActive={pathname.includes('/masters/contact-roles')}
                            />
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>

                {/* Users & Access Section */}
                <Accordion.Item as="li" eventKey="sidebar-user" bsPrefix="nav-item">
                    <CustomToggle
                        eventKey="sidebar-user"
                        icon={FiShield}
                        title="Users"
                        onClick={() => handleToggle('sidebar-user')}
                    />
                    <Accordion.Collapse eventKey="sidebar-user">
                        <ul className="sub-nav">
                            <SubNavItem
                                to="/dashboard/app/user-list"
                                label="User List"
                                miniLetter="U"
                                isActive={pathname === '/dashboard/app/user-list'}
                            />
                            {isAdmin && (
                                <SubNavItem
                                    to="/dashboard/admin/roles-permissions"
                                    label="Roles & Permissions"
                                    miniLetter="R"
                                    isActive={pathname === '/admin/roles-permissions' || pathname === '/dashboard/admin/roles-permissions'}
                                />
                            )}
                            <SubNavItem
                                to="/dashboard/app/user-profile"
                                label="User Profile"
                                miniLetter="P"
                                isActive={pathname === '/dashboard/app/user-profile'}
                            />
                        </ul>
                    </Accordion.Collapse>
                </Accordion.Item>
            </Accordion>
        </Fragment>
    );
});

export default VerticalNav;
