import React, { useState, useMemo } from 'react';
import { Modal, Button, Form, Tab, Nav, Badge, Alert, Spinner } from 'react-bootstrap';
import {
    FaWhatsapp,
    FaEnvelope,
    FaExternalLinkAlt,
    FaCopy,
    FaCheck,
    FaEye,
    FaEyeSlash,
    FaKey,
    FaClock,
    FaShieldAlt,
    FaMagic,
    FaPaperPlane
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAdminDirectResetPassword } from '../../users/hooks/useUserApi';

/**
 * High-Aesthetic, User-Integrative Password Reset & Delivery Modal
 * 
 * Supports:
 * 1. Dynamic Frontend URL Resolution (always matches current window origin)
 * 2. 1-Click WhatsApp Share with pre-composed professional message
 * 3. 1-Click Email Share (mailto: with subject and body)
 * 4. 1-Click "Open in New Tab" (for in-person or live-call password reset)
 * 5. 1-Click Formatted Message Copy (for Teams, Slack, SMS)
 * 6. 1-Click Clean URL Copy
 * 7. Direct Admin Password Set (Instant Super Admin override with auto-generated strong passwords)
 */
const PasswordResetDeliveryModal = ({
    show,
    onHide,
    user,
    resetData, // { token, resetToken, resetLink, expiresAt }
    title = 'Password Reset Prepared'
}) => {
    const [activeTab, setActiveTab] = useState('share');
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedMsg, setCopiedMsg] = useState(false);
    const [copiedCredentials, setCopiedCredentials] = useState(false);

    // Direct password reset state
    const [directPassword, setDirectPassword] = useState('');
    const [showDirectPassword, setShowDirectPassword] = useState(false);
    const [directResetSuccess, setDirectResetSuccess] = useState(false);

    const { mutate: doDirectReset, isPending: isDirectResetting } = useAdminDirectResetPassword();

    // Helper functions for user identity
    const getFullName = (u) => {
        if (!u) return 'User';
        const first = u.firstName || u.first_name || '';
        const last = u.lastName || u.last_name || '';
        const full = `${first} ${last}`.trim();
        return full || u.userName || u.user_name || u.email || 'User';
    };

    const getUserEmail = (u) => u?.email || '';
    const getUserName = (u) => u?.userName || u?.user_name || '';
    const getUserRole = (u) => u?.role?.name || u?.role_name || u?.role || 'User';

    const getInitial = (u) => {
        const name = u?.firstName || u?.first_name || u?.userName || u?.user_name || 'U';
        return (name[0] || 'U').toUpperCase();
    };

    // Calculate guaranteed Frontend Reset URL
    const finalResetUrl = useMemo(() => {
        const token = resetData?.token || resetData?.resetToken;
        const origin = window.location.origin;

        if (token) {
            return `${origin}/auth/reset-password?token=${token}`;
        }
        if (resetData?.resetLink) {
            // Replace backend port 3000 if present with frontend origin
            return resetData.resetLink.replace(/^https?:\/\/[^/]+(?::\d+)?/, origin);
        }
        return '';
    }, [resetData]);

    // Format Expiry Time (default 1 hour from now)
    const formattedExpiryTime = useMemo(() => {
        const d = resetData?.expiresAt ? new Date(resetData.expiresAt) : new Date(Date.now() + 60 * 60 * 1000);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [resetData]);

    // Pre-composed polite communication message
    const formattedMessage = useMemo(() => {
        const name = getFullName(user);
        return (
`Hello ${name},

Your password reset request for KS Engineering Works ERP has been approved.

Please click the link below to set your new password:
${finalResetUrl}

⏱ Note: This is a single-use link and expires in 1 hour (at ${formattedExpiryTime}).
If you did not request this, please notify your administrator.`
        );
    }, [user, finalResetUrl, formattedExpiryTime]);

    // Handlers
    const handleCopyUrl = () => {
        if (!finalResetUrl) return;
        navigator.clipboard.writeText(finalResetUrl);
        setCopiedUrl(true);
        toast.success('Reset link copied to clipboard!');
        setTimeout(() => setCopiedUrl(false), 2500);
    };

    const handleCopyMessage = () => {
        if (!formattedMessage) return;
        navigator.clipboard.writeText(formattedMessage);
        setCopiedMsg(true);
        toast.success('Full message template copied to clipboard!');
        setTimeout(() => setCopiedMsg(false), 2500);
    };

    const handleShareWhatsApp = () => {
        if (!finalResetUrl) return;
        const encoded = encodeURIComponent(formattedMessage);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    };

    const handleShareEmail = () => {
        const email = getUserEmail(user);
        const subject = encodeURIComponent('Password Reset Link - KS Engineering Works ERP');
        const body = encodeURIComponent(formattedMessage);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

    const handleOpenInNewTab = () => {
        if (!finalResetUrl) return;
        window.open(finalResetUrl, '_blank');
    };

    // Password Generator
    const handleGenerateStrongPassword = () => {
        const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
        let generated = 'Ks@';
        for (let i = 0; i < 7; i++) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setDirectPassword(generated);
    };

    const handleDirectResetSubmit = (e) => {
        e.preventDefault();
        if (!directPassword || directPassword.trim().length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        doDirectReset(
            { id: user.id, newPassword: directPassword.trim() },
            {
                onSuccess: () => {
                    setDirectResetSuccess(true);
                }
            }
        );
    };

    const handleCopyCredentials = () => {
        const text = `KS Engineering Works ERP Login Credentials:\nUsername/Email: ${getUserEmail(user) || getUserName(user)}\nPassword: ${directPassword}\nLogin URL: ${window.location.origin}/sign-in`;
        navigator.clipboard.writeText(text);
        setCopiedCredentials(true);
        toast.success('New credentials copied to clipboard!');
        setTimeout(() => setCopiedCredentials(false), 2500);
    };

    const handleClose = () => {
        setActiveTab('share');
        setDirectPassword('');
        setDirectResetSuccess(false);
        setCopiedUrl(false);
        setCopiedMsg(false);
        setCopiedCredentials(false);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered className="password-reset-modal">
            <Modal.Header closeButton className="border-bottom pb-3">
                <div className="d-flex align-items-center gap-2">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center bg-soft-primary text-primary"
                        style={{ width: '40px', height: '40px', fontSize: '18px' }}
                    >
                        <FaKey />
                    </div>
                    <div>
                        <Modal.Title as="h5" className="mb-0 fw-bold">{title}</Modal.Title>
                        <small className="text-muted">Multi-channel delivery and direct management</small>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="p-4">
                {/* Recipient User Badge Card */}
                {user && (
                    <div className="p-3 mb-4 rounded-3 border bg-light d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold shadow-sm"
                                style={{ width: '46px', height: '46px', fontSize: '18px' }}
                            >
                                {getInitial(user)}
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">{getFullName(user)}</h6>
                                <div className="d-flex flex-wrap align-items-center gap-2 text-muted small mt-1">
                                    <span>{getUserEmail(user)}</span>
                                    {getUserName(user) && (
                                        <>
                                            <span>•</span>
                                            <span>@{getUserName(user)}</span>
                                        </>
                                    )}
                                    <span>•</span>
                                    <Badge bg="soft-primary" className="text-primary text-uppercase px-2">
                                        {getUserRole(user)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Badge bg="warning" className="text-dark d-flex align-items-center gap-1 py-2 px-3 fw-normal">
                                <FaClock />
                                <span>Expires in 1 hr ({formattedExpiryTime})</span>
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs */}
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Nav variant="pills" className="nav-fill mb-4 bg-soft-light p-1 rounded border">
                        <Nav.Item>
                            <Nav.Link eventKey="share" className="d-flex align-items-center justify-content-center gap-2 py-2">
                                <FaPaperPlane />
                                <span className="fw-semibold">1. Share Reset Link</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="direct" className="d-flex align-items-center justify-content-center gap-2 py-2">
                                <FaShieldAlt />
                                <span className="fw-semibold">2. Direct Admin Reset</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        {/* TAB 1: SHARE RESET LINK */}
                        <Tab.Pane eventKey="share">
                            {/* URL Input Box */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small text-secondary text-uppercase mb-1">
                                    Secure Web Application URL
                                </Form.Label>
                                <div className="input-group">
                                    <Form.Control
                                        type="text"
                                        readOnly
                                        value={finalResetUrl}
                                        className="font-monospace text-dark bg-white"
                                        style={{ fontSize: '0.85rem' }}
                                        onClick={(e) => e.target.select()}
                                    />
                                    <Button
                                        variant={copiedUrl ? 'success' : 'primary'}
                                        onClick={handleCopyUrl}
                                        className="d-flex align-items-center gap-1 px-3"
                                    >
                                        {copiedUrl ? <FaCheck /> : <FaCopy />}
                                        <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
                                    </Button>
                                </div>
                            </Form.Group>

                            {/* Multi-Channel Delivery Buttons Grid */}
                            <div className="mb-4">
                                <label className="fw-bold small text-secondary text-uppercase mb-2 d-block">
                                    Instant Delivery & Integration Channels
                                </label>
                                <div className="row g-2">
                                    {/* WhatsApp */}
                                    <div className="col-12 col-md-4">
                                        <Button
                                            variant="outline-success"
                                            className="w-100 d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm"
                                            style={{ borderColor: '#25D366', color: '#128C7E' }}
                                            onClick={handleShareWhatsApp}
                                        >
                                            <FaWhatsapp size={18} color="#25D366" />
                                            <span className="fw-semibold">Share on WhatsApp</span>
                                        </Button>
                                    </div>

                                    {/* Email */}
                                    <div className="col-12 col-md-4">
                                        <Button
                                            variant="outline-primary"
                                            className="w-100 d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm"
                                            onClick={handleShareEmail}
                                        >
                                            <FaEnvelope size={16} />
                                            <span className="fw-semibold">Send via Email</span>
                                        </Button>
                                    </div>

                                    {/* Open in New Tab */}
                                    <div className="col-12 col-md-4">
                                        <Button
                                            variant="outline-dark"
                                            className="w-100 d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm"
                                            onClick={handleOpenInNewTab}
                                        >
                                            <FaExternalLinkAlt size={14} />
                                            <span className="fw-semibold">Open Page Now</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Message Preview & Full Template Copy */}
                            <div className="p-3 rounded border bg-soft-light mb-3">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span className="small fw-bold text-muted text-uppercase">
                                        Prepared Message Template (Ready to send)
                                    </span>
                                    <Button
                                        variant={copiedMsg ? 'success' : 'outline-secondary'}
                                        size="sm"
                                        className="py-1 px-2 d-flex align-items-center gap-1"
                                        onClick={handleCopyMessage}
                                    >
                                        {copiedMsg ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                        <span style={{ fontSize: '0.78rem' }}>{copiedMsg ? 'Message Copied' : 'Copy Message'}</span>
                                    </Button>
                                </div>
                                <pre
                                    className="p-2 mb-0 rounded bg-white text-muted border font-monospace"
                                    style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}
                                >
                                    {formattedMessage}
                                </pre>
                            </div>

                            <Alert variant="info" className="small d-flex align-items-center gap-2 mb-0 py-2">
                                <FaShieldAlt className="text-primary flex-shrink-0" />
                                <div>
                                    <strong>End-User Security Notice:</strong> This single-use link allows the user to securely set a new password without knowing the previous one. Once used or expired, it automatically invalidates.
                                </div>
                            </Alert>
                        </Tab.Pane>

                        {/* TAB 2: DIRECT ADMIN RESET */}
                        <Tab.Pane eventKey="direct">
                            {directResetSuccess ? (
                                <div className="text-center py-4">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center bg-soft-success text-success mx-auto mb-3"
                                        style={{ width: '60px', height: '60px', fontSize: '28px' }}
                                    >
                                        <FaCheck />
                                    </div>
                                    <h5 className="text-success fw-bold">Password Updated Successfully!</h5>
                                    <p className="text-muted small mb-4">
                                        The password for <strong>{getFullName(user)}</strong> has been set directly. All previous sessions have been signed out.
                                    </p>

                                    <div className="p-3 bg-light border rounded mb-4 text-start font-monospace small">
                                        <div><strong>Account:</strong> {getUserEmail(user) || getUserName(user)}</div>
                                        <div className="mt-1"><strong>New Password:</strong> <span className="text-primary fw-bold">{directPassword}</span></div>
                                    </div>

                                    <div className="d-flex justify-content-center gap-2">
                                        <Button
                                            variant={copiedCredentials ? 'success' : 'primary'}
                                            onClick={handleCopyCredentials}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            {copiedCredentials ? <FaCheck /> : <FaCopy />}
                                            <span>{copiedCredentials ? 'Credentials Copied!' : 'Copy Credentials'}</span>
                                        </Button>
                                        <Button
                                            variant="outline-success"
                                            onClick={() => {
                                                const text = encodeURIComponent(`Hello ${getFullName(user)},\nYour password for KS Engineering Works ERP has been set to: *${directPassword}*\nPlease log in at: ${window.location.origin}/sign-in`);
                                                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                                            }}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <FaWhatsapp />
                                            <span>Send via WhatsApp</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Form onSubmit={handleDirectResetSubmit}>
                                    <p className="text-muted small mb-3">
                                        As Super Admin, you can directly override and set a temporary or permanent password for <strong>{getFullName(user)}</strong> without sending an email or reset link.
                                    </p>

                                    <Form.Group className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Form.Label className="fw-bold small text-secondary text-uppercase mb-0">
                                                New Password <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-decoration-none d-flex align-items-center gap-1 text-primary"
                                                onClick={handleGenerateStrongPassword}
                                            >
                                                <FaMagic size={12} />
                                                <span>Generate Strong Password</span>
                                            </Button>
                                        </div>
                                        <div className="input-group">
                                            <Form.Control
                                                type={showDirectPassword ? 'text' : 'password'}
                                                placeholder="Enter new password (min. 6 characters)"
                                                value={directPassword}
                                                onChange={(e) => setDirectPassword(e.target.value)}
                                                autoComplete="new-password"
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setShowDirectPassword(!showDirectPassword)}
                                            >
                                                {showDirectPassword ? <FaEyeSlash /> : <FaEye />}
                                            </Button>
                                        </div>
                                        <Form.Text className="text-muted">
                                            Choose a password with at least 6 characters.
                                        </Form.Text>
                                    </Form.Group>

                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <Button variant="outline-secondary" onClick={handleClose}>
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isDirectResetting || directPassword.length < 6}
                                            className="d-flex align-items-center gap-2"
                                        >
                                            {isDirectResetting ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" />
                                                    <span>Updating Password...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaKey />
                                                    <span>Set Password Immediately</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>

            <Modal.Footer className="border-top pt-3">
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PasswordResetDeliveryModal;
