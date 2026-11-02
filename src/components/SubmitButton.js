import { Button, Spinner } from "react-bootstrap";

const SubmitButton = ({ isLoading, isEditMode, disabled = false, label: customLabel, loadingLabel: customLoadingLabel }) => {
    const label = isLoading
        ? (customLoadingLabel || (isEditMode ? 'Updating...' : 'Adding...'))
        : (customLabel || (isEditMode ? 'Update' : 'Add'));

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