import { Button, Spinner } from "react-bootstrap";

const SubmitButton = ({ isLoading, isEditMode }) => {
    const label = isEditMode
        ? (isLoading ? 'Updating...' : 'Update')
        : (isLoading ? 'Adding...' : 'Add');

    return (
        <Button type="submit" variant="primary" disabled={isLoading}>
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