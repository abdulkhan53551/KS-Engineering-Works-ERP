import React, { useState } from 'react';
import { Table, Form, Dropdown, Image, Button, Row, Col } from 'react-bootstrap';
import Card from '../../components/Card';

// img
import shap1 from '../../assets/images/shapes/01.png'
import shap2 from '../../assets/images/shapes/02.png'
import { Link } from 'react-router-dom';

const initForm = {
  rowID: 1,
  name: '',
  gender: ''
}

const initFormError = {
  name: 'Please enter Name.',
  gender: 'Please select gender'
}

const NewRow = ({ item, idx, index, ...props }) => {
  const { error = {}, rowCallback = Function(), rowErrorCallback = Function(), removeRowCallback = Function() } = props

  console.log('item => ', item);
  console.log('row erro => ', error);

  const [selectedItem, setSelectedItem] = useState(item.gender ? item.gender : '');
  const [ddError, setDdError] = useState('');

  const removeRow = (e) => {
    const rowIndex = parseInt(e.target.closest('tr').getAttribute('data-index'), 10);
    // const updatedRows = rows.filter((_, index) => index != rowIndex);
    // setRows(updatedRows);
    removeRowCallback(rowIndex)
  };

  const handleOnChange = (e, index) => {
    // const value = [...row];
    // value.name = e.target.value
    // rowCallback(value)
    rowCallback({...item, name: e.target.value})
  }

  const handleSelect = (value, index) => {
    // const data = [...row];
    // data.gender = value
    // rowCallback(data)
    rowCallback({...item, gender: value})
    rowErrorCallback({ ...item, gender: value ? '' : initFormError.gender })


    // setSelectedItem(value);
    // setDdError('');
  };


  return (
    // <tr key={index} data-index={index} data-row-id={item.rowID}>
    //   <td>
    //     <Form.Control type="text" placeholder="Enter text" value={item.name} onChange={(e) => handleOnChange(e, index)} />
    //   </td>
    //   <td>
    //     <Dropdown>
    //       <Dropdown.Toggle variant="secondary" id="dropdown-basic">
    //         Select Option
    //       </Dropdown.Toggle>
    //       <Dropdown.Menu>
    //         <Dropdown.Item>Action</Dropdown.Item>
    //         <Dropdown.Item>Another action</Dropdown.Item>
    //         <Dropdown.Item>Something else</Dropdown.Item>
    //       </Dropdown.Menu>
    //     </Dropdown>
    //   </td>
    //   <td>
    //     <Form.Check inline label="Option 1" />
    //     <Form.Check inline label="Option 2" />
    //     <Form.Check inline label="Option 3" />
    //   </td>
    //   <td>
    //     <Form.Label className="d-block">Label 1</Form.Label>
    //     <Form.Label className="d-block">Label 2</Form.Label>
    //     <Form.Label className="d-block">Label 3</Form.Label>
    //   </td>
    //   <td>
    //     <Image src="https://via.placeholder.com/150" rounded />
    //   </td>
    //   <td>
    //     <Form.Check inline type="radio" label="Option 1" />
    //     <Form.Check inline type="radio" label="Option 2" />
    //     <Form.Check inline type="radio" label="Option 3" />
    //   </td>
    //   <td>
    //     <Button variant="danger" onClick={(e) => removeRow(e)}>Delete</Button>
    //   </td>
    // </tr>
    // <></>
    <tr data-index={idx} data-row-id={item.rowID}>
      <td className="text-center"><Image className="bg-soft-primary rounded img-fluid avatar-40 me-3" src={'https://via.placeholder.com/150'} rounded alt="profile" /></td>
      <td style={{ width: '400px' }}>
        <Form.Group className="col-md-12 form-group">
          <Form.Control type="text" name='firstName' id="fname" value={item.name} onChange={(e) => handleOnChange(e, idx)} isInvalid={true} placeholder="First Name" required />
          <Form.Control.Feedback type="invalid">{'Please enter first name'}</Form.Control.Feedback>
        </Form.Group>
      </td>
      <td>
        <Form.Group className="col-md-12 form-group">
          <Dropdown drop={'up'} onSelect={(value) => handleSelect(value, idx)}>
            <Dropdown.Toggle as={Button} variant="secondary" type="button" id="dropupMenuButton">
              {selectedItem || 'Select an option'}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ maxHeight: '100px', overflowY: 'auto' }} aria-labelledby="dropupMenuButton">
              <Dropdown.Item eventKey="">Select an opton</Dropdown.Item>
              <Dropdown.Item eventKey="Action">Action</Dropdown.Item>
              <Dropdown.Item eventKey="Another action">Another action</Dropdown.Item>
              <Dropdown.Item eventKey="Something else here">Something else here</Dropdown.Item>
              <li><hr className="dropdown-divider" /></li>
              <Dropdown.Item eventKey="Separated link">Separated link</Dropdown.Item>
              <Dropdown.Item eventKey="Separated link">Separated link</Dropdown.Item>
              <Dropdown.Item eventKey="Separated link">Separated link</Dropdown.Item>
              <Dropdown.Item eventKey="Separated link">Separated link</Dropdown.Item>
              <Dropdown.Item eventKey="Separated link">Separated link</Dropdown.Item>
              <Dropdown.Item eventKey="Separated link">Separated link</Dropdown.Item>
              <Dropdown.Item eventKey="Separated link">Separated link</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          {/* {ddError && <div className="text-danger">{ddError}</div>} */}
          {error.gender && <div className="text-danger">{error.gender}</div>}
        </Form.Group>
        {/* <Form.Group className="col-md-4 form-group">
                                    <Form.Label>Country:</Form.Label>
                                    <select name="type" className="selectpicker form-control" data-style="py-0">
                                       <option>Select Country</option>
                                       <option>Caneda</option>
                                       <option>Noida</option>
                                       <option >USA</option>
                                       <option>India</option>
                                       <option>Africa</option>
                                    </select>
                                 </Form.Group> */}
      </td>
      <td>{item.email}</td>
      <td>{item.country}</td>
      <td><span className={`badge ${item.color}`}>{item.status}</span></td>
      <td>{item.company}</td>
      <td>{item.joindate}</td>
      <td>
        <div className="flex align-items-center list-user-action">
          <Button onClick={removeRow} variant="danger" className="btn btn-sm btn-icon btn-danger" title="Delete" data-original-title="Delete">
            <span className="btn-inner">
              <svg width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                <path d="M19.3248 9.46826C19.3248 9.46826 18.7818 16.2033 18.4668 19.0403C18.3168 20.3953 17.4798 21.1893 16.1088 21.2143C13.4998 21.2613 10.8878 21.2643 8.27979 21.2093C6.96079 21.1823 6.13779 20.3783 5.99079 19.0473C5.67379 16.1853 5.13379 9.46826 5.13379 9.46826" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M20.708 6.23975H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M17.4406 6.23973C16.6556 6.23973 15.9796 5.68473 15.8256 4.91573L15.5826 3.69973C15.4326 3.13873 14.9246 2.75073 14.3456 2.75073H10.1126C9.53358 2.75073 9.02558 3.13873 8.87558 3.69973L8.63258 4.91573C8.47858 5.68473 7.80258 6.23973 7.01758 6.23973" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
          </Button>
        </div>
      </td>
    </tr>
  )
}

const AddRowTable = () => {
  const [rows, setRows] = useState([initForm]);
  const [rowError, setRowError] = useState([initFormError]);
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState(initForm);


  console.log('rowError => ', rowError);

  const customerList = [
    {
      img: `${shap1}`,
      name: 'Anna Sthesia',
      phone: '(760) 756 7568',
      email: 'annasthesia@gmail.com',
      country: 'USA',
      status: 'Active',
      company: 'Acme Corporation',
      joindate: '2019/12/01',
      color: 'bg-primary'
    },
    {
      img: `${shap2}`,
      name: 'Brock Lee',
      phone: '+62 5689 458 658',
      email: 'brocklee@gmail.com',
      country: 'Indonesia',
      status: 'Active',
      company: 'Soylent Corp',
      joindate: '2019/12/01',
      color: 'bg-primary'
    }
  ]

  // Add new row
  const addRow = () => {
    setRows(prev => [...prev, { ...initForm, rowID: prev?.length + 1 }]);
    setRowError(prev => [...prev, initFormError])
  };

  const handleSubmit = (event) => {
    console.log('======= handle submit => ',);
    event.preventDefault();
    const form = event.currentTarget;

    console.log('add row all data => ', rows);

    if (form.checkValidity()) {
      // Form is valid
      console.log('***** FORM IS VALID *****');
    } else {
      event.stopPropagation();
      setRowError(validateForm(rows))
    }

    setValidated(true);
  };

  const validateForm = (formArr = []) => {
    const updatedFormErrors = []

    if (formArr?.length > 0) {
      formArr.forEach((element, index) => {
        const updatedErrors = {};

        Object.entries(element).forEach(([key, value]) => {
          if (key == 'rowID') [key] = value > 0 ? value : 0;
          else updatedErrors[key] = value.trim() === '' ? initFormError[key] : '';
        });

        updatedFormErrors[index] = updatedErrors
      });
    }

    return updatedFormErrors
  }

  // Handle row error callback
  const handleRowCallback = (row, idx) => {
    console.log('on change row => ', row);
    console.log('idx => ', idx);
    const temp = [...rows]
    temp[idx] = row
    setRows(temp)
    // setRows(prev => {
    //   prev[idx] = row
    //   return prev
    // })
  }

  // Handle row error callback
  const handleRowErrorCallback = (newRowError, idx) => {
    const temp = [...rowError]
    temp[idx] = newRowError
    setRows(temp)
    // setRowError(prev => {
    //   prev[idx] = newRowError
    //   return prev
    // })
  }

  // Remove row callback
  const removeRowCallback = (rowIndex = -1) => {
    if (rowIndex > -1) {
      const updatedRows = rows.filter((_, index) => index != rowIndex);
      const updatedRowsError = rowError.filter((_, index) => index != rowIndex);
      setRows(updatedRows);
      setRowError(updatedRowsError)
    }
  }

  return (
    <div className="container mt-4">
      {/* <Table striped bordered hover>
        <pre>
          {JSON.stringify(rows, undefined, 2)}
        </pre>
        <thead>
          <tr>
            <th>Text Input</th>
            <th>Dropdown</th>
            <th>Checkboxes</th>
            <th>Labels</th>
            <th>Image</th>
            <th>Radio Buttons</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <NewRow item={row} rowID={row.rowID} index={index} rows={rows} setRows={setRows} />
          ))}
        </tbody>
      </Table> */}
      <div>
      <pre>
          {JSON.stringify(rows, undefined, 2)}
        </pre>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Row>
            <Col sm="12">
              <Card>
                <Card.Body className="px-0">
                  <div className="table-responsive">
                    <table width={'100%'} id="user-list-table" className="table table-striped" role="grid" data-toggle="data-table">
                      <thead>
                        <tr className="ligth">
                          <th>Profile</th>
                          <th>Name</th>
                          <th>Contact</th>
                          <th>Email</th>
                          <th>Country</th>
                          <th>Status</th>
                          <th>Company</th>
                          <th>Join Date</th>
                          <th min-width="100px">  <Button variant="primary" onClick={addRow}>Add Row</Button></th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          rows.map((item, idx) => (
                            <NewRow
                              key={idx}
                              item={item}
                              rowID={item.rowID}
                              idx={idx}
                              // row={rows[idx]}
                              error={rowError[idx]}
                              rowCallback={(row) => handleRowCallback(row, idx)}
                              removeRowCallback={(rowIndex) => removeRowCallback(rowIndex)}
                              rowErrorCallback={(error) => handleRowErrorCallback(error, idx)}
                            />
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <Button type="submit" variant="btn btn-primary">Submit Form</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default AddRowTable;
