import { Button, Spinner } from "react-bootstrap";

const SubmitButton = ({ isLoading, isEditMode, disabled = false }) => {
    const label = isEditMode
        ? (isLoading ? 'Updating...' : 'Update')
        : (isLoading ? 'Adding...' : 'Add');

    return (
        <Button type="submit" variant="primary" disabled={isLoading || disabled}>
            {isLoading && (
                <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                />
            )}
            {label}
        </Button>
    );
};

export default SubmitButton;