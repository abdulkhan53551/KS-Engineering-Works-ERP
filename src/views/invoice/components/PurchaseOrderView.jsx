import { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { ShoppingCart } from 'lucide-react';
import { ItemModal } from './ItemModal';

export function PurchaseOrderView() {
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleSubmit = (ids) => {
    setSelectedItems(ids);
    setShowModal(false);
    console.log('Selected Purchase Order IDs:', ids);
  };

  return (
    <div>
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Card.Title className="mb-0 d-flex align-items-center gap-2">
            <ShoppingCart size={24} className="text-success" />
            Purchase Order Module
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            Manage and view purchase orders. Select purchase orders to perform operations.
          </p>
          <Button variant="success" onClick={() => setShowModal(true)}>
            View & Select Purchase Orders
          </Button>

          {selectedItems.length > 0 && (
            <Alert variant="info" className="mt-3 mb-0">
              <Alert.Heading className="h6 mb-2">Selected Items</Alert.Heading>
              <div className="small">
                <strong>{selectedItems.length}</strong> purchase order(s) selected
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
        moduleType="purchase_order"
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
