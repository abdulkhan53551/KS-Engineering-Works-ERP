import React, { useState } from 'react';
import { Row, Col, Image, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { signupSchema } from '../../../validation/auth.validation';
import { useRegister } from '../../auth/hooks/api.hooks';

// img
import auth5 from '../../../assets/images/auth/05.png';

const SignUp = () => {
   const [submitted, setSubmitted] = useState(false);
   const { mutate: registerUser, isPending, error } = useRegister();

   const {
      register,
      handleSubmit,
      formState: { errors }
   } = useForm({
      resolver: joiResolver(signupSchema),
      mode: 'onBlur',
      reValidateMode: 'onChange'
   });

   const onSubmit = (data) => {
      const { confirmPassword, ...payload } = data;
      registerUser(payload, {
         onSuccess: () => {
            setSubmitted(true);
         }
      });
   };

   return (
      <section className="login-content">
         <Row className="m-0 align-items-center bg-white vh-100">
            <div className="col-md-6 d-md-block d-none bg-primary p-0 mt-n1 vh-100 overflow-hidden">
               <Image src={auth5} className="Image-fluid gradient-main animated-scaleX" alt="images" />
            </div>
            <Col md="6">
               <Row className="justify-content-center">
                  <Col md="10">
                     <Card className="card-transparent auth-card shadow-none d-flex justify-content-center mb-0">
                        <Card.Body>
                           <Link to="/sign-in" className="navbar-brand d-flex align-items-center mb-3">
                              <svg width="30" className="text-primary" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <rect x="-0.757324" y="19.2427" width="28" height="4" rx="2" transform="rotate(-45 -0.757324 19.2427)" fill="currentColor" />
                                 <rect x="7.72803" y="27.728" width="28" height="4" rx="2" transform="rotate(-45 7.72803 27.728)" fill="currentColor" />
                                 <rect x="10.5366" y="16.3945" width="16" height="4" rx="2" transform="rotate(45 10.5366 16.3945)" fill="currentColor" />
                                 <rect x="10.5562" y="-0.556152" width="28" height="4" rx="2" transform="rotate(45 10.5562 -0.556152)" fill="currentColor" />
                              </svg>
                              <h4 className="logo-title ms-3">KS Engineering Works</h4>
                           </Link>

                           {submitted ? (
                              <div className="text-center py-4">
                                 <div className="avatar avatar-80 bg-soft-success text-success rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px', fontSize: '32px' }}>
                                    ✓
                                 </div>
                                 <h3 className="mb-3 text-success">Registration Submitted!</h3>
                                 <p className="text-muted mb-4">
                                    Your account registration request has been submitted for Super Admin review.
                                    Once approved and assigned a role, you will be able to log in to the system.
                                 </p>
                                 <Link to="/sign-in" className="btn btn-primary">
                                    Return to Sign In
                                 </Link>
                              </div>
                           ) : (
                              <>
                                 <h2 className="mb-2 text-center">Sign Up</h2>
                                 <p className="text-center text-muted mb-4">Create your account to get started.</p>

                                 {error?.response?.data?.message && (
                                    <Alert variant="danger" className="mb-3">
                                       {error.response.data.message}
                                    </Alert>
                                 )}

                                 <Form onSubmit={handleSubmit(onSubmit)}>
                                    <Row>
                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                             <Form.Control
                                                type="text"
                                                placeholder="First Name"
                                                isInvalid={!!errors.firstName}
                                                {...register('firstName')}
                                             />
                                             <Form.Label htmlFor="firstName">
                                                First Name <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">
                                                {errors.firstName?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                             <Form.Control
                                                type="text"
                                                placeholder="Last Name"
                                                isInvalid={!!errors.lastName}
                                                {...register('lastName')}
                                             />
                                             <Form.Label htmlFor="lastName">Last Name</Form.Label>
                                             <Form.Control.Feedback type="invalid">
                                                {errors.lastName?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="12">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                             <Form.Control
                                                type="text"
                                                autoComplete="username"
                                                placeholder="Username"
                                                isInvalid={!!errors.userName}
                                                {...register('userName')}
                                             />
                                             <Form.Label htmlFor="userName">
                                                Username <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">
                                                {errors.userName?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="12">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                             <Form.Control
                                                type="email"
                                                autoComplete="email"
                                                placeholder="Email"
                                                isInvalid={!!errors.email}
                                                {...register('email')}
                                             />
                                             <Form.Label htmlFor="email">
                                                Email <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">
                                                {errors.email?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                             <Form.Control
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder="Password"
                                                isInvalid={!!errors.password}
                                                {...register('password')}
                                             />
                                             <Form.Label htmlFor="password">
                                                Password <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">
                                                {errors.password?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>

                                       <Col lg="6">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                             <Form.Control
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder="Confirm Password"
                                                isInvalid={!!errors.confirmPassword}
                                                {...register('confirmPassword')}
                                             />
                                             <Form.Label htmlFor="confirmPassword">
                                                Confirm Password <span className="text-danger">*</span>
                                             </Form.Label>
                                             <Form.Control.Feedback type="invalid">
                                                {errors.confirmPassword?.message}
                                             </Form.Control.Feedback>
                                          </Form.Floating>
                                       </Col>
                                    </Row>

                                    <div className="d-flex justify-content-center mt-2">
                                       <Button type="submit" variant="primary" className="w-100 py-2" disabled={isPending}>
                                          {isPending ? (
                                             <>
                                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                                Submitting...
                                             </>
                                          ) : (
                                             'Sign Up'
                                          )}
                                       </Button>
                                    </div>

                                    <p className="mt-3 text-center">
                                       Already have an account?{' '}
                                       <Link to="/sign-in" className="text-underline">
                                          Sign In
                                       </Link>
                                    </p>
                                 </Form>
                              </>
                           )}
                        </Card.Body>
                     </Card>
                  </Col>
               </Row>
            </Col>
         </Row>
      </section>
   );
};

export default SignUp;
