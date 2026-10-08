import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

/**
 * Reusable card skeleton loader for card-based views (e.g. SalaryTemplates).
 */
const CardSkeleton = ({ count = 4, lg = 6 }) => {
    return (
        <Row className="g-4">
            {Array.from({ length: count }).map((_, idx) => (
                <Col lg={lg} key={`card-skeleton-${idx}`}>
                    <Card className="border-0 shadow-sm rounded-3 h-100 p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="skeleton-line" style={{ width: '180px', height: '18px' }} />
                            <div className="skeleton-pill" style={{ width: '70px', height: '22px' }} />
                        </div>
                        <div className="skeleton-line mb-3" style={{ width: '80%', height: '12px' }} />
                        <Row className="g-2 mb-3">
                            <Col sm={6}>
                                <div className="p-3 rounded bg-light border">
                                    <div className="skeleton-line mb-2" style={{ width: '90px', height: '12px' }} />
                                    <div className="skeleton-line mb-1" style={{ width: '100%', height: '10px' }} />
                                    <div className="skeleton-line" style={{ width: '70%', height: '10px' }} />
                                </div>
                            </Col>
                            <Col sm={6}>
                                <div className="p-3 rounded bg-light border">
                                    <div className="skeleton-line mb-2" style={{ width: '90px', height: '12px' }} />
                                    <div className="skeleton-line mb-1" style={{ width: '100%', height: '10px' }} />
                                    <div className="skeleton-line" style={{ width: '70%', height: '10px' }} />
                                </div>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                            <div className="skeleton-line" style={{ width: '120px', height: '12px' }} />
                            <div className="skeleton-line" style={{ width: '60px', height: '12px' }} />
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default React.memo(CardSkeleton);
