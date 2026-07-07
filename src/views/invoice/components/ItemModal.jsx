import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, ListGroup, InputGroup, Spinner } from 'react-bootstrap';
import { Search, CheckSquare, Square, Trash2 } from 'lucide-react';
import './ItemModal.css';

// Temporary local storage array
const LOCAL_ITEM_STORE = {
  challan: [],
  purchase_order: [],
  eway_bill: [],
};

let ID_COUNTER = 1;

export const MODULE_LABELS = {
  challan: 'Challan',
  purchase_order: 'Purchase Order',
  eway_bill: 'Eway Bill',
};

export function ItemModal({ show, moduleType, onHide, onSubmit }) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (show) {
      fetchItemsLocal();
    }
  }, [show, moduleType]);

  const fetchItemsLocal = async () => {
    setLoading(true);
    setTimeout(() => {
      setItems([...LOCAL_ITEM_STORE[moduleType]]);
      setLoading(false);
    }, 400);
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const handleToggle = (id) => {
    const newSelected = new Set(selectedIds);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem = {
      id: ID_COUNTER++,
      module_type: moduleType,
      title: newItemTitle,
      description: newItemDesc || '',
      created_at: new Date().toISOString(),
    };

    LOCAL_ITEM_STORE[moduleType].unshift(newItem);
    setNewItemTitle('');
    setNewItemDesc('');
    fetchItemsLocal();
  };

  const handleDeleteItem = (id) => {
    setDeletingId(id);
    setTimeout(() => {
      LOCAL_ITEM_STORE[moduleType] = LOCAL_ITEM_STORE[moduleType].filter(
        (item) => item.id !== id
      );
      setItems(items.filter((item) => item.id !== id));

      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      setDeletingId(null);
    }, 500);
  };

  const handleSubmitClick = () => {
    onSubmit(Array.from(selectedIds));
    handleClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery('');
    setNewItemTitle('');
    setNewItemDesc('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title className="fw-bold">
          {MODULE_LABELS[moduleType]} Items
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <div className="p-3 border-bottom bg-light">
          <InputGroup className="mb-3">
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-start-0 ps-0"
            />
          </InputGroup>

          <div className="d-flex gap-2 mb-3">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredItems.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleDeselectAll}
              disabled={selectedIds.size === 0}
            >
              Deselect All
            </Button>
            <div className="ms-auto text-muted small">
              {selectedIds.size} selected
            </div>
          </div>

          <Form onSubmit={handleAddItem} className="p-3 bg-white rounded border">
            <Form.Control
              type="text"
              placeholder="Item title"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="mb-2"
              size="sm"
            />
            <Form.Control
              type="text"
              placeholder="Description (optional)"
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              className="mb-2"
              size="sm"
            />
            <Button variant="success" size="sm" type="submit" className="w-100">
              Add Item
            </Button>
          </Form>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <ListGroup variant="flush">
              {filteredItems.map((item) => (
                <ListGroup.Item
                  key={item.id}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <div className="d-flex align-items-start">
                    <div onClick={() => handleToggle(item.id)} className="me-3">
                      {selectedIds.has(item.id) ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </div>

                    <div className="flex-grow-1">
                      <div className="fw-semibold">{item.title}</div>
                      <div className="text-muted small">{item.description}</div>
                    </div>

                    {hoveredItemId === item.id && (
                      deletingId === item.id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <button
                          className="border-0 bg-transparent text-danger"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      )
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmitClick} disabled={selectedIds.size === 0}>
          Submit ({selectedIds.size})
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
