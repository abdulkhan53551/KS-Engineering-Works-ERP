import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, ListGroup, InputGroup, Spinner } from 'react-bootstrap';
import { Search, CheckSquare, Square } from 'lucide-react';
import './ItemModal.css';

// ✅ Temporary local array storage (in-memory, no Supabase)
let TODO_ID = 1;
let LOCAL_TODO_STORE = [];

export function TodoListModal({ show, onHide, onSubmit }) {
  const [todos, setTodos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');

  useEffect(() => {
    if (show) {
      fetchTodosLocal();
    }
  }, [show]);

  // ✅ Fetch todos from local array (mock async)
  const fetchTodosLocal = () => {
    setLoading(true);
    setTimeout(() => {
      setTodos([...LOCAL_TODO_STORE]);
      setLoading(false);
    }, 400);
  };

  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    const q = searchQuery.toLowerCase();
    return todos.filter(
      (todo) =>
        todo.title.toLowerCase().includes(q) ||
        todo.description.toLowerCase().includes(q)
    );
  }, [todos, searchQuery]);

  const handleToggle = (id) => {
    const copy = new Set(selectedIds);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setSelectedIds(copy);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredTodos.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // ✅ Add new todo locally (no API)
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const newTodo = {
      id: TODO_ID++,
      title: newTodoTitle.trim(),
      description: newTodoDesc.trim(),
      created_at: new Date().toISOString(),
    };

    LOCAL_TODO_STORE.unshift(newTodo);
    setNewTodoTitle('');
    setNewTodoDesc('');
    fetchTodosLocal();
  };

  const handleSubmitClick = () => {
    onSubmit(Array.from(selectedIds));
    handleClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery('');
    setNewTodoTitle('');
    setNewTodoDesc('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title className="fw-bold">Select Todo Items</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <div className="p-3 border-bottom bg-light">

          {/* ✅ NEW LOCAL ADD TODO FORM */}
          <Form onSubmit={handleAddTodo} className="p-2 bg-white rounded border mb-3">
            <Form.Control
              type="text"
              placeholder="New Todo title"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="mb-2"
              size="sm"
            />
            <Form.Control
              type="text"
              placeholder="Description (optional)"
              value={newTodoDesc}
              onChange={(e) => setNewTodoDesc(e.target.value)}
              className="mb-2"
              size="sm"
            />
            <Button variant="success" size="sm" type="submit" className="w-100">
              Add Todo
            </Button>
          </Form>

          {/* ✅ SEARCH */}
          <InputGroup className="mb-3">
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-start-0 ps-0"
            />
          </InputGroup>

          {/* ✅ ACTIONS */}
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredTodos.length === 0}
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
        </div>

        {/* ✅ LIST */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <ListGroup variant="flush">
              {filteredTodos.map((todo) => (
                <ListGroup.Item key={todo.id} style={{ cursor: 'pointer' }}>
                  <div className="d-flex">
                    <div
                      className="me-3"
                      onClick={() => handleToggle(todo.id)}
                    >
                      {selectedIds.has(todo.id) ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </div>
                    <div>
                      <div className="fw-semibold">{todo.title}</div>
                      <div className="text-muted small">{todo.description}</div>
                    </div>
                    <button
                      className="ms-auto border-0 bg-transparent text-danger"
                      onClick={() => {
                        LOCAL_TODO_STORE = LOCAL_TODO_STORE.filter(t => t.id !== todo.id);
                        setTodos(todos.filter(t => t.id !== todo.id));
                        setSelectedIds(prev => {
                          const s = new Set(prev);
                          s.delete(todo.id);
                          return s;
                        });
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
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
