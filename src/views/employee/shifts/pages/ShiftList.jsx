import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Table, Button, Badge, Spinner, InputGroup, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import {
    Clock,
    Plus,
    Users,
    Edit3,
    Trash2,
    Search,
    RefreshCw,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import useDebounce from '../../../../hooks/useDebounce';
import { useShifts, useDeleteShift, useShiftAssignments } from '../../common/hooks/useEmployeeApi';
import ShiftModal from '../components/ShiftModal';
import ShiftAssignModal from '../components/ShiftAssignModal';
import PaginationBar from '../../../../components/PaginationBar';
import TableSkeleton from '../../common/components/TableSkeleton';
import usePermission from '../../../../hooks/usePermission';
import '../../employee.css';

const ShiftList = () => {
    const { can, isSuperAdmin } = usePermission();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    // Shift search, sort & pagination
    const [shiftSearch, setShiftSearch] = useState('');
    const debouncedShiftSearch = useDebounce(shiftSearch, 400);
    const [shiftSortBy, setShiftSortBy] = useState('is_default');
    const [shiftSortOrder, setShiftSortOrder] = useState('desc');
    const [shiftPage, setShiftPage] = useState(1);
    const [shiftPageSize, setShiftPageSize] = useState(10);

    // Assignment search & pagination
    const [assignSearch, setAssignSearch] = useState('');
    const debouncedAssignSearch = useDebounce(assignSearch, 400);
    const [assignPage, setAssignPage] = useState(1);
    const [assignPageSize, setAssignPageSize] = useState(10);

    const [showShiftModal, setShowShiftModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // API Queries
    const {
        data: shiftsRaw,
        isLoading: loadingShifts,
        refetch: refetchShifts
    } = useShifts({
        firmId,
        search: debouncedShiftSearch,
        sortBy: shiftSortBy,
        sortOrder: shiftSortOrder
    });

    const {
        data: assignmentsRaw,
        isLoading: loadingAssignments,
        refetch: refetchAssignments
    } = useShiftAssignments({
        firmId,
        search: debouncedAssignSearch
    });

    const deleteMutation = useDeleteShift();

    const allShifts = useMemo(() => {
        if (!shiftsRaw) return [];
        return Array.isArray(shiftsRaw) ? shiftsRaw : (Array.isArray(shiftsRaw?.data) ? shiftsRaw.data : []);
    }, [shiftsRaw]);

    const allAssignments = useMemo(() => {
        if (!assignmentsRaw) return [];
        return Array.isArray(assignmentsRaw) ? assignmentsRaw : (Array.isArray(assignmentsRaw?.data) ? assignmentsRaw.data : []);
    }, [assignmentsRaw]);

    // Paginated shifts
    const paginatedShifts = useMemo(() => {
        const start = (shiftPage - 1) * shiftPageSize;
        return allShifts.slice(start, start + shiftPageSize);
    }, [allShifts, shiftPage, shiftPageSize]);

    const shiftPagination = {
        page: shiftPage,
        pageSize: shiftPageSize,
        total: allShifts.length,
        totalPages: Math.ceil(allShifts.length / shiftPageSize) || 1
    };

    // Paginated assignments
    const paginatedAssignments = useMemo(() => {
        const start = (assignPage - 1) * assignPageSize;
        return allAssignments.slice(start, start + assignPageSize);
    }, [allAssignments, assignPage, assignPageSize]);

    const assignPagination = {
        page: assignPage,
        pageSize: assignPageSize,
        total: allAssignments.length,
        totalPages: Math.ceil(allAssignments.length / assignPageSize) || 1
    };

    const handleShiftSort = (col) => {
        if (shiftSortBy === col) {
            setShiftSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setShiftSortBy(col);
            setShiftSortOrder('asc');
        }
        setShiftPage(1);
    };

    const ShiftSortIcon = ({ column }) => {
        if (shiftSortBy !== column) return <ArrowUpDown size={12} className="ms-1 text-muted opacity-50" />;
        return shiftSortOrder === 'asc'
            ? <ArrowUp size={12} className="ms-1 text-primary" />
            : <ArrowDown size={12} className="ms-1 text-primary" />;
    };

    const handleCreate = () => {
        setSelectedShift(null);
        setShowShiftModal(true);
    };

    const handleEdit = (shift) => {
        setSelectedShift(shift);
        setShowShiftModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this shift?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    return (
        <div className="container-fluid p-3">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Shifts & Rosters</h4>
                    <span className="text-muted small">
                        Configure company working shifts, break timings, and employee roster assignments.
                    </span>
                </div>
                <div className="d-flex gap-2">
                    {(isSuperAdmin || can('shifts', 'update')) && (
                        <Button variant="outline-primary" size="sm" onClick={() => setShowAssignModal(true)}>
                            <Users size={16} className="me-1" /> Assign Shift to Staff
                        </Button>
                    )}
                    {(isSuperAdmin || can('shifts', 'create')) && (
                        <Button variant="primary" size="sm" onClick={handleCreate}>
                            <Plus size={16} className="me-1" /> Create Shift
                        </Button>
                    )}
                </div>
            </div>

            <Row className="g-4">
                {/* Defined Shifts Card */}
                <Col md={12}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                    <Clock size={18} /> Configured Shifts
                                    <Badge bg="primary-subtle" className="text-primary border border-primary-subtle ms-1">
                                        {allShifts.length}
                                    </Badge>
                                </h6>
                                <div className="d-flex align-items-center gap-2">
                                    <InputGroup size="sm" style={{ width: '220px' }}>
                                        <InputGroup.Text className="bg-light border-end-0">
                                            <Search size={13} className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search shifts..."
                                            className="border-start-0 ps-0"
                                            value={shiftSearch}
                                            onChange={(e) => { setShiftSearch(e.target.value); setShiftPage(1); }}
                                        />
                                        {shiftSearch && (
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="border-start-0"
                                                onClick={() => { setShiftSearch(''); setShiftPage(1); }}
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </InputGroup>
                                    <Button variant="outline-secondary" size="sm" onClick={() => refetchShifts()} title="Refresh">
                                        <RefreshCw size={14} />
                                    </Button>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ cursor: 'pointer' }} onClick={() => handleShiftSort('shift_name')}>
                                                Shift Name <ShiftSortIcon column="shift_name" />
                                            </th>
                                            <th style={{ cursor: 'pointer' }} onClick={() => handleShiftSort('shift_code')}>
                                                Code <ShiftSortIcon column="shift_code" />
                                            </th>
                                            <th style={{ cursor: 'pointer' }} onClick={() => handleShiftSort('start_time')}>
                                                Timings <ShiftSortIcon column="start_time" />
                                            </th>
                                            <th style={{ cursor: 'pointer' }} onClick={() => handleShiftSort('break_minutes')}>
                                                Break Minutes <ShiftSortIcon column="break_minutes" />
                                            </th>
                                            <th style={{ cursor: 'pointer' }} onClick={() => handleShiftSort('is_default')}>
                                                Default <ShiftSortIcon column="is_default" />
                                            </th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingShifts ? (
                                            <TableSkeleton rows={4} cols={6} hasCheckbox={false} hasAvatar={false} />
                                        ) : paginatedShifts.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    {shiftSearch ? 'No shifts match your search.' : 'No shifts defined yet. Click Create Shift above.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedShifts.map(s => (
                                                <tr key={s.id}>
                                                    <td className="fw-semibold text-dark">{s.shiftName}</td>
                                                    <td>
                                                        <Badge bg="primary" className="font-monospace">{s.shiftCode}</Badge>
                                                    </td>
                                                    <td>
                                                        <span className="shift-time-badge">
                                                            <Clock size={13} /> {s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}
                                                        </span>
                                                    </td>
                                                    <td>{s.breakMinutes} mins</td>
                                                    <td>
                                                        {s.isDefault ? (
                                                            <Badge bg="success">Default</Badge>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        {(isSuperAdmin || can('shifts', 'update')) && (
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="p-1 px-2 me-1"
                                                                onClick={() => handleEdit(s)}
                                                                title="Edit Shift"
                                                            >
                                                                <Edit3 size={14} />
                                                            </Button>
                                                        )}
                                                        {(isSuperAdmin || can('shifts', 'delete')) && (
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="p-1 px-2 text-danger"
                                                                onClick={() => handleDelete(s.id)}
                                                                title="Delete Shift"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {allShifts.length > shiftPageSize && (
                                <div className="p-3 border-top">
                                    <PaginationBar
                                        pagination={shiftPagination}
                                        onPageChange={(p) => setShiftPage(p)}
                                        onPageSizeChange={(s) => { setShiftPageSize(s); setShiftPage(1); }}
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Active Shift Rosters / Assignments */}
                <Col md={12}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                    <Users size={18} /> Active Employee Shift Assignments
                                    <Badge bg="primary-subtle" className="text-primary border border-primary-subtle ms-1">
                                        {allAssignments.length}
                                    </Badge>
                                </h6>
                                <div className="d-flex align-items-center gap-2">
                                    <InputGroup size="sm" style={{ width: '250px' }}>
                                        <InputGroup.Text className="bg-light border-end-0">
                                            <Search size={13} className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search staff, dept, shift..."
                                            className="border-start-0 ps-0"
                                            value={assignSearch}
                                            onChange={(e) => { setAssignSearch(e.target.value); setAssignPage(1); }}
                                        />
                                        {assignSearch && (
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="border-start-0"
                                                onClick={() => { setAssignSearch(''); setAssignPage(1); }}
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </InputGroup>
                                    <Button variant="outline-secondary" size="sm" onClick={() => refetchAssignments()} title="Refresh">
                                        <RefreshCw size={14} />
                                    </Button>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Assigned Shift</th>
                                            <th>Timings</th>
                                            <th>Effective From</th>
                                            <th>Effective To</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingAssignments ? (
                                            <TableSkeleton rows={5} cols={6} hasCheckbox={false} hasAvatar={false} />
                                        ) : paginatedAssignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    {assignSearch ? 'No shift assignments match your search.' : 'No employees currently assigned to shifts.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedAssignments.map(a => (
                                                <tr key={a.id}>
                                                    <td>
                                                        <div className="fw-semibold text-dark">
                                                            {a.firstName} {a.lastName || ''}
                                                        </div>
                                                        <span className="text-primary font-monospace small">{a.empCode}</span>
                                                    </td>
                                                    <td>{a.department || '—'}</td>
                                                    <td>
                                                        <span className="fw-medium text-dark">{a.shiftName} ({a.shiftCode})</span>
                                                    </td>
                                                    <td>
                                                        <span className="shift-time-badge">
                                                            <Clock size={13} /> {a.startTime?.substring(0, 5)} - {a.endTime?.substring(0, 5)}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(a.effectiveFrom).toLocaleDateString()}</td>
                                                    <td>{a.effectiveTo ? new Date(a.effectiveTo).toLocaleDateString() : 'Ongoing'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {allAssignments.length > assignPageSize && (
                                <div className="p-3 border-top">
                                    <PaginationBar
                                        pagination={assignPagination}
                                        onPageChange={(p) => setAssignPage(p)}
                                        onPageSizeChange={(s) => { setAssignPageSize(s); setAssignPage(1); }}
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Shift Modal */}
            <ShiftModal
                show={showShiftModal}
                onHide={() => setShowShiftModal(false)}
                shift={selectedShift}
                firmId={firmId}
            />

            {/* Shift Assign Modal */}
            <ShiftAssignModal
                show={showAssignModal}
                onHide={() => setShowAssignModal(false)}
                firmId={firmId}
            />
        </div>
    );
};

export default ShiftList;
