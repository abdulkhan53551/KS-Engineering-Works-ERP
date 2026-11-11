import React from 'react';
import { Modal, Button, Badge, Row, Col, Table, Spinner } from 'react-bootstrap';
import { FaBuilding, FaPen, FaPhone, FaMapMarkerAlt, FaUniversity, FaFileInvoice, FaCheckCircle, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useGetFirmBranches } from '../hooks/api.hooks';
import moment from 'moment';

const FirmDetailsModal = ({ show, onClose, firm }) => {
    const firmId = firm?.firmId || firm?.id;
    const { data: branches = [], isLoading: isLoadingBranches } = useGetFirmBranches(firmId);

    if (!firm) return null;

    const firmInitials = (firm.firmName || 'F')
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <Modal show={show} onHide={onClose} size="lg" centered backdrop="static">
            <Modal.Header closeButton className="py-3 px-4 border-bottom bg-light">
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm"
                        style={{
                            width: '46px',
                            height: '46px',
                            background: 'linear-gradient(135deg, #3a57e8 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            fontSize: '1.15rem'
                        }}
                    >
                        {firm.logoUrl ? (
                            <img
                                src={firm.logoUrl}
                                alt={firm.firmName}
                                className="w-100 h-100 rounded-3"
                                style={{ objectFit: 'contain', padding: '3px', background: '#fff' }}
                            />
                        ) : (
                            firmInitials
                        )}
                    </div>
                    <div>
                        <Modal.Title className="h5 fw-bold mb-0 text-dark">
                            {firm.firmName}
                        </Modal.Title>
                        <div className="text-muted small d-flex align-items-center gap-2 mt-0.5">
                            {firm.tradeName && firm.tradeName !== firm.firmName && (
                                <span>Trading as: <strong>{firm.tradeName}</strong> •</span>
                            )}
                            <Badge bg="primary" className="fw-semibold" style={{ fontSize: '0.72rem' }}>
                                {firm.firmType || 'Firm'}
                            </Badge>
                            {firm.gstin ? (
                                <Badge bg="success" className="fw-semibold" style={{ fontSize: '0.72rem' }}>
                                    GST Registered
                                </Badge>
                            ) : (
                                <Badge bg="secondary" className="fw-semibold" style={{ fontSize: '0.72rem' }}>
                                    Unregistered
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="p-4">
                {/* 1. Tax & Registration Identifiers */}
                <div className="mb-4">
                    <div className="firm-detail-section-title d-flex align-items-center gap-1.5">
                        <FaFileInvoice className="text-primary" /> Tax & Statutory Identifiers
                    </div>
                    <Row className="g-3">
                        <Col sm={4}>
                            <div className="firm-detail-label">GSTIN</div>
                            <div className="firm-detail-val font-monospace">
                                {firm.gstin || <span className="text-muted fst-italic">Not Registered</span>}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">PAN Number</div>
                            <div className="firm-detail-val font-monospace">
                                {firm.panNumber || firm.pan_number || (firm.gstin ? firm.gstin.substring(2, 12) : <span className="text-muted">—</span>)}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">CIN / Registration</div>
                            <div className="firm-detail-val font-monospace">
                                {firm.cinNumber || firm.cin_number || <span className="text-muted">—</span>}
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 2. Contact & Address */}
                <div className="mb-4">
                    <div className="firm-detail-section-title d-flex align-items-center gap-1.5">
                        <FaMapMarkerAlt className="text-danger" /> Contact & Registered Office
                    </div>
                    <Row className="g-3">
                        <Col sm={4}>
                            <div className="firm-detail-label">Official Phone</div>
                            <div className="firm-detail-val">
                                {firm.phoneNumber ? `📞 ${firm.phoneNumber}` : <span className="text-muted">—</span>}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">City & State</div>
                            <div className="firm-detail-val">
                                {firm.city && firm.state ? `${firm.city}, ${firm.state}` : (firm.city || firm.state || <span className="text-muted">—</span>)}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">Postal Pincode</div>
                            <div className="firm-detail-val">
                                {firm.pincode || <span className="text-muted">—</span>}
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 3. Banking Information */}
                <div className="mb-4">
                    <div className="firm-detail-section-title d-flex align-items-center gap-1.5">
                        <FaUniversity className="text-info" /> Primary Bank Account
                    </div>
                    <Row className="g-3">
                        <Col sm={4}>
                            <div className="firm-detail-label">Bank Name</div>
                            <div className="firm-detail-val">
                                {firm.bankName || firm.bank_name || <span className="text-muted">—</span>}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">Branch</div>
                            <div className="firm-detail-val">
                                {firm.branchName || firm.branch_name || <span className="text-muted">—</span>}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">Account Number</div>
                            <div className="firm-detail-val font-monospace">
                                {firm.accountNumber || firm.account_number || <span className="text-muted">—</span>}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">IFSC Code</div>
                            <div className="firm-detail-val font-monospace">
                                {firm.ifscCode || firm.ifsc_code || <span className="text-muted">—</span>}
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="firm-detail-label">Account Type</div>
                            <div className="firm-detail-val text-capitalize">
                                {firm.accountType || firm.account_type || <span className="text-muted">—</span>}
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 4. Branches Summary */}
                <div>
                    <div className="firm-detail-section-title d-flex align-items-center justify-content-between">
                        <span className="d-flex align-items-center gap-1.5">
                            <FaBuilding className="text-success" /> Registered Branches ({branches.length})
                        </span>
                    </div>

                    {isLoadingBranches ? (
                        <div className="text-center py-3">
                            <Spinner animation="border" size="sm" variant="primary" />
                            <span className="ms-2 small text-muted">Loading branches...</span>
                        </div>
                    ) : branches.length === 0 ? (
                        <div className="text-muted small py-2 fst-italic">
                            No branches registered for this firm.
                        </div>
                    ) : (
                        <div className="table-responsive border rounded-3 mt-2">
                            <Table className="mb-0 align-middle" size="sm" hover>
                                <thead className="table-light" style={{ fontSize: '0.75rem' }}>
                                    <tr>
                                        <th className="ps-3 py-2">Branch Name</th>
                                        <th className="py-2">Code</th>
                                        <th className="py-2">Type</th>
                                        <th className="py-2">City</th>
                                        <th className="py-2 pe-3">Phone</th>
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: '0.82rem' }}>
                                    {branches.map((b) => (
                                        <tr key={b.id}>
                                            <td className="ps-3 py-2 fw-semibold text-dark">
                                                {b.branchName}
                                            </td>
                                            <td className="py-2 font-monospace text-primary">
                                                {b.branchCode}
                                            </td>
                                            <td className="py-2">
                                                {b.isHeadOffice ? (
                                                    <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                                                        <FaStar size={9} /> Head Office
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="light" text="secondary">
                                                        Branch
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-2 text-muted">
                                                {b.cityName || b.city || '—'}
                                            </td>
                                            <td className="py-2 pe-3 text-muted">
                                                {b.phoneNumber || b.phone || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </div>
            </Modal.Body>

            <Modal.Footer className="py-2 px-4 border-top bg-light">
                <Button variant="light" onClick={onClose} size="sm" className="px-3 fw-semibold">
                    Close
                </Button>
                <Link to={`/firms/${firmId}/edit`}>
                    <Button variant="primary" size="sm" className="px-3 fw-semibold d-inline-flex align-items-center gap-1.5">
                        <FaPen size={11} /> Edit Firm
                    </Button>
                </Link>
            </Modal.Footer>
        </Modal>
    );
};

export default React.memo(FirmDetailsModal);
