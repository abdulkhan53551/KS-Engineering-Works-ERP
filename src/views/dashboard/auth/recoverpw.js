import React, { useState } from 'react';
import { Row, Col, Image, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { forgotPasswordSchema } from '../../../validation/auth.validation';
import { useForgotPassword } from '../../auth/hooks/api.hooks';

// img
import auth2 from '../../../assets/images/auth/02.png';

const Recoverpw = () => {
   const [submitted, setSubmitted] = useState(false);
   const { mutate: requestReset, isPending, error } = useForgotPassword();

   const {
      register,
      handleSubmit,
      formState: { errors }
   } = useForm({
      resolver: joiResolver(forgotPasswordSchema),
      mode: 'onBlur',
      reValidateMode: 'onChange'
   });

   const onSubmit = (data) => {
      requestReset(data, {
         onSuccess: () => {
            setSubmitted(true);
         }
      });
   };

   return (
      <section className="login-content">
         <Row className="m-0 align-items-center bg-white vh-100">
            <Col md="6" className="d-md-block d-none bg-primary p-0 mt-n1 vh-100 overflow-hidden">
               <Image src={auth2} className="img-fluid gradient-main animated-scaleX" alt="images" />
            </Col>
            <Col md="6" className="p-0">
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
                                 <div className="avatar avatar-80 bg-soft-primary text-primary rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px', fontSize: '32px' }}>
                                    ✉
                                 </div>
                                 <h3 className="mb-3">Request Submitted</h3>
                                 <p className="text-muted mb-4">
                                    Your password reset request has been logged and sent to the Super Admin for approval.
                                    Once approved, you will be issued your reset link to create a new password.
                                 </p>
                                 <Link to="/sign-in" className="btn btn-primary">
                                    Return to Sign In
                                 </Link>
                              </div>
                           ) : (
                              <>
                                 <h2 className="mb-2">Reset Password</h2>
                                 <p className="text-muted mb-4">
                                    Enter your registered email address to request a password reset from the Super Admin.
                                 </p>

                                 {error?.response?.data?.message && (
                                    <Alert variant="danger" className="mb-3">
                                       {error.response.data.message}
                                    </Alert>
                                 )}

                                 <Form onSubmit={handleSubmit(onSubmit)}>
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                       <Form.Control
                                          type="email"
                                          placeholder="Email"
                                          isInvalid={!!errors.email}
                                          {...register('email')}
                                       />
                                       <Form.Label htmlFor="email">
                                          Email Address <span className="text-danger">*</span>
                                       </Form.Label>
                                       <Form.Control.Feedback type="invalid">
                                          {errors.email?.message}
                                       </Form.Control.Feedback>
                                    </Form.Floating>

                                    <Button type="submit" variant="primary" className="w-100 mt-3 py-2" disabled={isPending}>
                                       {isPending ? (
                                          <>
                                             <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                             Submitting...
                                          </>
                                       ) : (
                                          'Request Password Reset'
                                       )}
                                    </Button>

                                    <p className="mt-3 text-center">
                                       Remember your password?{' '}
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

export default Recoverpw;
