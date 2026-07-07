import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';

const MyForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: false,
    email: false
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFormErrors({
      ...formErrors,
      [name]: value.trim() === ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isFormValid = Object.values(formErrors).every((error) => !error);

    if (isFormValid) {
      // Handle form submission logic here
      console.log('Form submitted:', formData);
      setFormData({
        name: '',
        email: ''
      });
      setFormErrors({
        name: false,
        email: false
      });
    } else {
      // Set validation errors for empty fields
      const updatedErrors = {};
      Object.entries(formData).forEach(([key, value]) => {
        updatedErrors[key] = value.trim() === '';
      });
      setFormErrors(updatedErrors);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="formName">
        <Form.Label>Name</Form.Label>
        <Form.Control 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          isInvalid={formErrors.name} 
          required 
        />
        <Form.Control.Feedback type="invalid">
          Please provide a name.
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="formEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          isInvalid={formErrors.email} 
          required 
        />
        <Form.Control.Feedback type="invalid">
          Please provide a valid email address.
        </Form.Control.Feedback>
      </Form.Group>

      <Button type="submit">Submit</Button>
    </Form>
  );
};

export default MyForm;
