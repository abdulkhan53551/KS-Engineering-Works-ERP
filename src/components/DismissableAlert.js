import React, { useState, useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';

function DismissibleAlert({ message }) {
    const [showAlert, setShowAlert] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAlert(false);
        }, 3000); // Adjust the time as needed (3000 milliseconds = 3 seconds)

        return () => clearTimeout(timer); // Clear the timer when the component unmounts
    }, []);

    return (
        <div>
            {showAlert && (
                <Alert
                    variant="info" 
                    onClose={() => setShowAlert(false)} dismissible>
                    {message}
                </Alert>
            )}
        </div>
    );
}

export default DismissibleAlert;