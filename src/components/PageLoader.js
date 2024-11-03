import React, { memo } from 'react';
import { Spinner } from 'react-bootstrap';

const PageLoader = ({ loading = false }) => {
    if (!loading) return null;

    return (
        <div style={overlayStyle}>
            <Spinner animation="border" role="status" variant="secondary" style={{ width: '3rem', height: '3rem' }} />
            <span className="ms-2 fs-4 text-secondary">Loading...</span>
        </div>
    );
}

const overlayStyle = {
    //   position: 'fixed',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
    //   zIndex: 1050, // Ensure it overlays other elements
};

export default memo(PageLoader);