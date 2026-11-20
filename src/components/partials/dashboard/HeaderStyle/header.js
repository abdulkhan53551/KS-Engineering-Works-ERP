import React, { useEffect, Fragment, memo } from 'react';
import { Navbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FiSearch,
    FiBell,
    FiUser,
    FiLogOut,
    FiChevronDown,
    FiChevronRight,
    FiCheckCircle,
    FiShield,
    FiMenu
} from 'react-icons/fi';
import CustomToggle from '../../../dropdowns';
import Logo from '../../components/logo';

// Redux Selector / Action
import { useSelector } from 'react-redux';
import * as SettingSelector from '../../../../store/setting/selectors';
import { useLogout } from '../../../../views/auth/hooks/api.hooks';
import EntitySwitcher from './EntitySwitcher';

const Header = memo((props) => {
    const navbarHide = useSelector(SettingSelector.navbar_show); // array
    const headerNavbar = useSelector(SettingSelector.header_navbar);
    const { mutate: logoutApi } = useLogout();
    const currentUser = useSelector((state) => state.authReducer?.user);
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const brandTitle = activeFirm?.trade_name || activeFirm?.firm_name || 'K.S. Engineering';

    const displayName = currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : (currentUser?.userName || 'User');
    const displayRole = currentUser?.roleName || currentUser?.role || 'Administrator';

    const isAdmin = currentUser?.isSuperAdmin ||
                    currentUser?.role === 'administrator' ||
                    currentUser?.role === 'admin' ||
                    currentUser?.roleSlug === 'super-admin' ||
                    currentUser?.dataScope === 'GLOBAL';

    // Generate dynamic user initials (e.g. "Sabir Khan" -> "SK")
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };
    const userInitials = getInitials(displayName);

    useEffect(() => {
        if (headerNavbar === 'navs-sticky' || headerNavbar === 'nav-glass') {
            const handleScroll = () => {
                const nav = document.getElementsByTagName('nav')[0];
                if (nav) {
                    if (document.documentElement.scrollTop > 50) {
                        nav.classList.add('menu-sticky');
                    } else {
                        nav.classList.remove('menu-sticky');
                    }
                }
            };
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [headerNavbar]);

    const minisidebar = () => {
        const aside = document.getElementsByTagName('ASIDE')[0];
        if (aside) {
            aside.classList.toggle('sidebar-mini');
        }
    };

    return (
        <Fragment>
            <Navbar
                expand="lg"
                variant="light"
                className={`nav iq-navbar ${headerNavbar} ${navbarHide.join(' ')}`}
            >
                <Container fluid className="navbar-inner px-2 px-sm-3">
                    {/* Top-Left: Sidebar Toggle Arrow (Visible ONLY on small screens < 1200px to avoid duplicate on desktop) */}
                    <div className="d-flex align-items-center flex-shrink-0">
                        <div
                            className="sidebar-toggle-arrow me-2 d-xl-none"
                            onClick={minisidebar}
                            role="button"
                            title="Toggle Sidebar"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4.25 12.2744L19.25 12.2744"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M10.2998 18.2988L4.2498 12.2748L10.2998 6.24976"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        <Link to="/dashboard" className="navbar-brand d-flex align-items-center py-0 me-2 text-decoration-none">
                            <Logo color={true} />
                            <span className="logo-title ms-2 mb-0 font-size-13 fw-bold text-dark d-none d-sm-inline">
                                {brandTitle}
                            </span>
                        </Link>
                    </div>

                    {/* Top-Right for Small Screens (< 992px): Notification Bell + 3-Line Menu */}
                    <div className="d-flex align-items-center gap-1.5 d-lg-none">
                        {/* Notification Bell */}
                        <Dropdown className="notification-dropdown">
                            <Dropdown.Toggle
                                as={CustomToggle}
                                variant="p-0 border-0 bg-transparent"
                                role="button"
                                title="System Notifications"
                            >
                                <div className="header-icon-btn">
                                    <FiBell size={15} />
                                    <span className="notification-dot" />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="p-0 dropdown-menu-end notification-dropdown-menu shadow-lg border-0">
                                <div className="py-2 px-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                                    <h6 className="mb-0 fw-bold font-size-12 text-dark">Notifications</h6>
                                    <span className="badge bg-soft-primary text-primary font-size-10">0 Unread</span>
                                </div>
                                <div className="py-3 px-3 text-center text-muted">
                                    <FiCheckCircle size={20} className="text-success mb-1 opacity-75" />
                                    <p className="mb-0 fw-semibold font-size-12 text-dark">All caught up!</p>
                                    <small className="font-size-11 text-muted">No pending alerts.</small>
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>

                        {/* 3 Horizontal Lines Toggle Button */}
                        <Navbar.Toggle aria-controls="navbarSupportedContent" className="mobile-nav-toggle p-0 border-0 shadow-none" title="Menu">
                            <FiMenu size={18} className="menu-icon" />
                        </Navbar.Toggle>
                    </div>

                    {/* Collapsible Area (Desktop: Inline Bar; Mobile: Floating Card Popover) */}
                    <Navbar.Collapse id="navbarSupportedContent">
                        {/* Desktop-Only Center Utilities (>= 992px) */}
                        <div className="d-none d-lg-flex align-items-center gap-2 me-auto">
                            {/* Search */}
                            <div className="header-search-wrapper">
                                <FiSearch className="search-icon" size={13} />
                                <input
                                    type="search"
                                    className="form-control header-search-input"
                                    placeholder="Quick search..."
                                />
                                <span className="search-shortcut d-none d-xl-inline-block">⌘K</span>
                            </div>

                            {/* Entity Switcher */}
                            <div className="entity-switcher-wrap">
                                <EntitySwitcher idPrefix="desktop" />
                            </div>
                        </div>

                        {/* Desktop-Only Right Utilities (>= 992px) */}
                        <Nav as="ul" className="ms-auto navbar-list align-items-center mb-0 flex-row gap-2 d-none d-lg-flex">
                            {/* Desktop Notification Bell */}
                            <Dropdown as="li" className="nav-item notification-dropdown">
                                <Dropdown.Toggle
                                    as={CustomToggle}
                                    variant="nav-link p-0 d-flex align-items-center"
                                    role="button"
                                    title="System Notifications"
                                >
                                    <div className="header-icon-btn">
                                        <FiBell size={15} />
                                        <span className="notification-dot" />
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="p-0 dropdown-menu-end notification-dropdown-menu shadow-lg border-0">
                                    <div className="py-2 px-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                                        <h6 className="mb-0 fw-bold font-size-12 text-dark">Notifications</h6>
                                        <span className="badge bg-soft-primary text-primary font-size-10">0 Unread</span>
                                    </div>
                                    <div className="py-3 px-3 text-center text-muted">
                                        <FiCheckCircle size={20} className="text-success mb-1 opacity-75" />
                                        <p className="mb-0 fw-semibold font-size-12 text-dark">All caught up!</p>
                                        <small className="font-size-11 text-muted">No pending alerts.</small>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Desktop User Profile Pill */}
                            <Dropdown as="li" className="nav-item user-profile-dropdown">
                                <Dropdown.Toggle
                                    as={CustomToggle}
                                    variant="nav-link p-0 d-flex align-items-center user-toggle-btn"
                                    role="button"
                                    id="userProfileDropdown"
                                >
                                    <div className="user-avatar-badge" title={displayName}>
                                        {userInitials}
                                        <span className="online-indicator" />
                                    </div>
                                    <div className="caption ms-2 d-none d-md-block text-start">
                                        <h6 className="mb-0 caption-title">{displayName}</h6>
                                        <p className="mb-0 caption-sub-title text-capitalize">{displayRole}</p>
                                    </div>
                                    <FiChevronDown size={13} className="ms-1.5 text-muted user-chevron d-none d-md-inline-block" />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-end user-dropdown-menu shadow-lg border-0 py-1" style={{ minWidth: '200px' }}>
                                    <div className="px-3 py-1.5 border-bottom">
                                        <div className="fw-bold text-dark font-size-12">{displayName}</div>
                                        <small className="text-muted text-truncate d-block font-size-11">
                                            {currentUser?.email || displayRole}
                                        </small>
                                    </div>
                                    <Dropdown.Item as={Link} to="/dashboard/app/user-profile" className="d-flex align-items-center gap-2 py-1.5 font-size-12">
                                        <FiUser size={13} className="text-primary" />
                                        <span>My Profile</span>
                                    </Dropdown.Item>
                                    {isAdmin && (
                                        <Dropdown.Item as={Link} to="/dashboard/admin/roles-permissions" className="d-flex align-items-center gap-2 py-1.5 font-size-12">
                                            <FiShield size={13} className="text-secondary" />
                                            <span>Roles & Permissions</span>
                                        </Dropdown.Item>
                                    )}
                                    <Dropdown.Divider className="my-1" />
                                    <Dropdown.Item onClick={logoutApi} className="d-flex align-items-center gap-2 py-1.5 text-danger font-size-12">
                                        <FiLogOut size={13} />
                                        <span>Sign Out</span>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>

                        {/* Mobile-Only Drawer Popover Content (< 992px) */}
                        <div className="mobile-drawer-content d-lg-none">
                            {/* 1. Quick Search */}
                            <div className="mobile-search-box mb-2">
                                <FiSearch className="mobile-search-icon" size={13} />
                                <input
                                    type="search"
                                    className="form-control mobile-search-input"
                                    placeholder="Quick search..."
                                />
                            </div>

                            {/* 2. Side-by-Side Firm & Branch Switcher */}
                            <div className="mobile-entity-row mb-2">
                                <EntitySwitcher idPrefix="mobile" />
                            </div>

                            <div className="mobile-drawer-divider" />

                            {/* 3. User Identity Strip */}
                            <div className="mobile-user-card d-flex align-items-center justify-content-between p-2 mb-2 rounded-2">
                                <div className="d-flex align-items-center gap-2 min-w-0">
                                    <div className="user-avatar-badge flex-shrink-0">
                                        {userInitials}
                                        <span className="online-indicator" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="fw-semibold text-dark font-size-12 text-truncate">{displayName}</div>
                                        <small className="text-muted font-size-10 text-truncate d-block">{currentUser?.email || displayRole}</small>
                                    </div>
                                </div>
                                <span className="badge bg-soft-primary text-primary font-size-10 px-2 py-1 flex-shrink-0">
                                    {displayRole}
                                </span>
                            </div>

                            {/* 4. Action Links: Sleek SaaS clickable items */}
                            <div className="mobile-action-links d-flex flex-column gap-1">
                                <Link
                                    to="/dashboard/app/user-profile"
                                    className="mobile-action-item d-flex align-items-center justify-content-between text-decoration-none px-2 py-1.5 rounded-2"
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <FiUser size={13} className="text-primary" />
                                        <span className="font-size-12 fw-medium text-dark">My Profile</span>
                                    </div>
                                    <FiChevronRight size={13} className="text-muted" />
                                </Link>

                                {isAdmin && (
                                    <Link
                                        to="/dashboard/admin/roles-permissions"
                                        className="mobile-action-item d-flex align-items-center justify-content-between text-decoration-none px-2 py-1.5 rounded-2"
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <FiShield size={13} className="text-secondary" />
                                            <span className="font-size-12 fw-medium text-dark">Roles & Permissions</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-1.5">
                                            <span className="badge bg-soft-info text-info font-size-9 px-1.5 py-0.5">Admin</span>
                                            <FiChevronRight size={13} className="text-muted" />
                                        </div>
                                    </Link>
                                )}

                                <button
                                    onClick={logoutApi}
                                    type="button"
                                    className="mobile-action-item mobile-logout-item d-flex align-items-center justify-content-between text-decoration-none px-2 py-1.5 rounded-2 border-0 bg-transparent w-100 text-start"
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <FiLogOut size={13} className="text-danger" />
                                        <span className="font-size-12 fw-medium text-danger">Sign Out</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </Fragment>
    );
});

export default Header;
