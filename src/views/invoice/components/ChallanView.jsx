import { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { FileText } from 'lucide-react';
import { ItemModal } from './ItemModal';

export function ChallanView() {
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleSubmit = (ids) => {
    setSelectedItems(ids);
    setShowModal(false);
    console.log('Selected Challan IDs:', ids);
  };

  return (
    <div>
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Card.Title className="mb-0 d-flex align-items-center gap-2">
            <FileText size={24} className="text-primary" />
            Challan Module
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            Manage and view challan documents. Select challan items to perform operations.
          </p>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            View & Select Challans
          </Button>

          {selectedItems.length > 0 && (
            <Alert variant="info" className="mt-3 mb-0">
              <Alert.Heading className="h6 mb-2">Selected Items</Alert.Heading>
              <div className="small">
                <strong>{selectedItems.length}</strong> challan(s) selected
              </div>
              <div className="small text-muted mt-2" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                IDs: {selectedItems.join(', ')}
              </div>
            </Alert>
          )}
        </Card.Body>
      </Card>

      <ItemModal
        show={showModal}
        moduleType="challan"
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
