import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Image, Form, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { resetPasswordSchema } from '../../../validation/auth.validation';
import { useValidateResetToken, useResetPassword } from '../../auth/hooks/api.hooks';
import { FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle, FaLock, FaShieldAlt } from 'react-icons/fa';

// img
import auth2 from '../../../assets/images/auth/02.png';

const ResetPassword = () => {
   const [searchParams] = useSearchParams();
   const token = searchParams.get('token');
   const navigate = useNavigate();
   const [isResetDone, setIsResetDone] = useState(false);
   const [countdown, setCountdown] = useState(4);

   // Password visibility states
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

   const {
      data: validatedUser,
      isLoading: isValidating,
      isError: isTokenInvalid,
      error: tokenError
   } = useValidateResetToken(token);

   const { mutate: doResetPassword, isPending: isSubmitting, error: submitError } = useResetPassword();

   const {
      register,
      handleSubmit,
      watch,
      formState: { errors }
   } = useForm({
      resolver: joiResolver(resetPasswordSchema),
      mode: 'onChange',
      reValidateMode: 'onChange'
   });

   const passwordValue = watch('password') || '';
   const confirmPasswordValue = watch('confirmPassword') || '';

   // Password strength calculation
   const passwordStrength = useMemo(() => {
      if (!passwordValue) return { score: 0, label: '', variant: 'secondary' };
      let score = 0;
      if (passwordValue.length >= 6) score += 25;
      if (passwordValue.length >= 8) score += 25;
      if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) score += 25;
      if (/\d/.test(passwordValue) || /[^A-Za-z0-9]/.test(passwordValue)) score += 25;

      if (score <= 25) return { score: 25, label: 'Weak', variant: 'danger' };
      if (score <= 50) return { score: 50, label: 'Fair', variant: 'warning' };
      if (score <= 75) return { score: 75, label: 'Good', variant: 'info' };
      return { score: 100, label: 'Strong', variant: 'success' };
   }, [passwordValue]);

   // Passwords match check
   const passwordsMatch = useMemo(() => {
      if (!passwordValue || !confirmPasswordValue) return null;
      return passwordValue === confirmPasswordValue;
   }, [passwordValue, confirmPasswordValue]);

   const onSubmit = (data) => {
      doResetPassword(
         { token, password: data.password },
         {
            onSuccess: () => {
               setIsResetDone(true);
            }
         }
      );
   };

   // Auto-redirect timer when reset succeeds
   useEffect(() => {
      if (!isResetDone) return;
      const interval = setInterval(() => {
         setCountdown((prev) => {
            if (prev <= 1) {
               clearInterval(interval);
               navigate('/sign-in');
               return 0;
            }
            return prev - 1;
         });
      }, 1000);
      return () => clearInterval(interval);
   }, [isResetDone, navigate]);

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

                           {!token ? (
                              <div className="text-center py-4">
                                 <Alert variant="danger" className="mb-4">
                                    No reset token provided. Please use the link provided by your Super Admin.
                                 </Alert>
                                 <Link to="/sign-in" className="btn btn-primary">
                                    Go to Sign In
                                 </Link>
                              </div>
                           ) : isValidating ? (
                              <div className="text-center py-5">
                                 <Spinner animation="border" variant="primary" className="mb-3" />
                                 <p className="text-muted">Verifying reset token security...</p>
                              </div>
                           ) : isTokenInvalid ? (
                              <div className="text-center py-4">
                                 <div className="avatar avatar-80 bg-soft-danger text-danger rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px', fontSize: '32px' }}>
                                    ✕
                                 </div>
                                 <h3 className="mb-2 text-danger">Invalid or Expired Link</h3>
                                 <p className="text-muted mb-4">
                                    {tokenError?.response?.data?.message ||
                                       'This password reset link is invalid or has expired. Please contact your Super Admin to request a new password reset.'}
                                 </p>
                                 <div className="d-flex justify-content-center gap-2">
                                    <Link to="/auth/recoverpw" className="btn btn-primary">
                                       Request New Reset
                                    </Link>
                                    <Link to="/sign-in" className="btn btn-outline-secondary">
                                       Back to Sign In
                                    </Link>
                                 </div>
                              </div>
                           ) : isResetDone ? (
                              <div className="text-center py-4">
                                 <div className="avatar avatar-80 bg-soft-success text-success rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px', fontSize: '32px' }}>
                                    ✓
                                 </div>
                                 <h3 className="mb-2 text-success">Password Reset Complete!</h3>
                                 <p className="text-muted mb-3">
                                    Your password has been changed successfully. You can now sign in with your new credentials.
                                 </p>
                                 <p className="text-primary small mb-4">
                                    Redirecting to Sign In in <strong>{countdown}</strong> seconds...
                                 </p>
                                 <Link to="/sign-in" className="btn btn-primary px-4 py-2">
                                    Sign In Now
                                 </Link>
                              </div>
                           ) : (
                              <>
                                 <div className="d-flex align-items-center gap-2 mb-2">
                                    <div className="rounded-circle bg-soft-primary text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                                       <FaLock />
                                    </div>
                                    <h3 className="mb-0 fw-bold">Set New Password</h3>
                                 </div>

                                 <div className="p-2 mb-3 rounded bg-light border small text-muted">
                                    Account: <strong className="text-dark">{validatedUser?.email || validatedUser?.userName || 'User'}</strong>
                                 </div>

                                 {submitError?.response?.data?.message && (
                                    <Alert variant="danger" className="mb-3">
                                       {submitError.response.data.message}
                                    </Alert>
                                 )}

                                 <Form onSubmit={handleSubmit(onSubmit)}>
                                    {/* New Password Floating Input */}
                                    <div className="mb-3">
                                       <div className="position-relative">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Control
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                autoComplete="new-password"
                                                placeholder="New Password"
                                                isInvalid={!!errors.password}
                                                {...register('password')}
                                                style={{ paddingRight: '40px', backgroundImage: 'none' }}
                                             />
                                             <Form.Label htmlFor="password">
                                                New Password <span className="text-danger">*</span>
                                             </Form.Label>
                                          </Form.Floating>
                                          <button
                                             type="button"
                                             className="btn btn-link p-0 position-absolute text-muted d-flex align-items-center justify-content-center"
                                             style={{
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 5,
                                                border: 'none',
                                                background: 'transparent',
                                                width: '24px',
                                                height: '24px'
                                             }}
                                             onClick={() => setShowPassword(!showPassword)}
                                             tabIndex="-1"
                                          >
                                             {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                                          </button>
                                       </div>
                                       {errors.password && (
                                          <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.8rem' }}>
                                             {errors.password.message}
                                          </div>
                                       )}

                                       {/* Password Strength Indicator */}
                                       {passwordValue.length > 0 && (
                                          <div className="mt-2">
                                             <div className="d-flex justify-content-between align-items-center small mb-1">
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Strength:</span>
                                                <span className={`fw-bold text-${passwordStrength.variant}`} style={{ fontSize: '0.75rem' }}>
                                                   {passwordStrength.label}
                                                </span>
                                             </div>
                                             <ProgressBar
                                                now={passwordStrength.score}
                                                variant={passwordStrength.variant}
                                                style={{ height: '4px' }}
                                             />
                                          </div>
                                       )}
                                    </div>

                                    {/* Confirm Password Floating Input */}
                                    <div className="mb-3">
                                       <div className="position-relative">
                                          <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                             <Form.Control
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="confirmPassword"
                                                autoComplete="new-password"
                                                placeholder="Confirm Password"
                                                isInvalid={!!errors.confirmPassword}
                                                {...register('confirmPassword')}
                                                style={{ paddingRight: '40px', backgroundImage: 'none' }}
                                             />
                                             <Form.Label htmlFor="confirmPassword">
                                                Confirm Password <span className="text-danger">*</span>
                                             </Form.Label>
                                          </Form.Floating>
                                          <button
                                             type="button"
                                             className="btn btn-link p-0 position-absolute text-muted d-flex align-items-center justify-content-center"
                                             style={{
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 5,
                                                border: 'none',
                                                background: 'transparent',
                                                width: '24px',
                                                height: '24px'
                                             }}
                                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                             tabIndex="-1"
                                          >
                                             {showConfirmPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                                          </button>
                                       </div>
                                       {errors.confirmPassword && (
                                          <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.8rem' }}>
                                             {errors.confirmPassword.message}
                                          </div>
                                       )}

                                       {/* Matching status indicator */}
                                       {confirmPasswordValue.length > 0 && !errors.confirmPassword && (
                                          <div className="mt-1 d-flex align-items-center gap-1 small ps-1">
                                             {passwordsMatch ? (
                                                <span className="text-success d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                                   <FaCheckCircle /> Passwords match
                                                </span>
                                             ) : (
                                                <span className="text-danger d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                                   <FaExclamationCircle /> Passwords do not match
                                                </span>
                                             )}
                                          </div>
                                       )}
                                    </div>

                                    <Button
                                       type="submit"
                                       variant="primary"
                                       className="w-100 mt-2 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                       disabled={isSubmitting}
                                    >
                                       {isSubmitting ? (
                                          <>
                                             <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                             <span>Updating Password...</span>
                                          </>
                                       ) : (
                                          <>
                                             <FaShieldAlt />
                                             <span>Set New Password</span>
                                          </>
                                       )}
                                    </Button>

                                    <p className="mt-3 text-center mb-0">
                                       <Link to="/sign-in" className="text-primary text-decoration-none small">
                                          ← Back to Sign In
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

export default ResetPassword;
