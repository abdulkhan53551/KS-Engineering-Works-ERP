import React, { useEffect, useRef, useState } from 'react'
import { Row, Col, Image, Form, Button, Spinner, } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
// import Card from '../../../components/Card'

// img
import auth1 from '../../assets/images/auth/01.png'
import { useCurrentUser, useLogin, usePost } from './hooks/api.hooks'
import { useDispatch, useSelector } from 'react-redux'
import { loginSuccess, setAccessToken } from '../../store/auth.slice'
import { setUser } from '../../store/user.slice'
import Card from '../../components/Card'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { joiResolver } from "@hookform/resolvers/joi";
import { signinSchema } from '../../validation/auth.validation'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import Toast from '../../utilities/toast'

const SignIn = () => {
   const { isAuthenticated } = useSelector((state) => state.authReducer);
   const { accessToken } = useSelector((state) => state.authReducer)
   const userProfile = useSelector((state) => state.userReducer)

   const { mutate: loginApi, isPending, isError, error } = useLogin();
   const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: joiResolver(signinSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
   });

   // Handle form submit
   const onSubmit = (data) => {
      if (!isPending) {
         loginApi(data);
      }
   };

   return (
      <>
         <section className="login-content">
            <Row className="m-0 align-items-center bg-white vh-100">
               <Col md="6">
                  <Row className="justify-content-center">
                     <Col md="10">
                        <Card className="card-transparent shadow-none d-flex justify-content-center mb-0 auth-card">
                           <Card.Body>
                              <Link to="/dashboard" className="navbar-brand d-flex align-items-center mb-3">
                                 <svg width="30" className="text-primary" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="-0.757324" y="19.2427" width="28" height="4" rx="2" transform="rotate(-45 -0.757324 19.2427)" fill="currentColor" />
                                    <rect x="7.72803" y="27.728" width="28" height="4" rx="2" transform="rotate(-45 7.72803 27.728)" fill="currentColor" />
                                    <rect x="10.5366" y="16.3945" width="16" height="4" rx="2" transform="rotate(45 10.5366 16.3945)" fill="currentColor" />
                                    <rect x="10.5562" y="-0.556152" width="28" height="4" rx="2" transform="rotate(45 10.5562 -0.556152)" fill="currentColor" />
                                 </svg>
                                 <h4 className="logo-title ms-3">Hope UI</h4>
                              </Link>
                              <h2 className="mb-2 text-center">Sign In</h2>
                              <p className="text-center">Login to stay connected.</p>
                              <Form onSubmit={handleSubmit(onSubmit)}>
                                 <Row>
                                    <Col lg="12">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                          <Form.Control type="email" autoComplete="username email" placeholder="Email" isInvalid={!!errors.email} {...register("email")} />
                                          <Form.Label htmlFor="email" >
                                             Email <span className="text-danger label-required">*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>
                                    <Col lg="12">
                                       <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                          <Form.Control type="password" autoComplete="current-password" placeholder="Password" isInvalid={!!errors.password} {...register("password")} />
                                          <Form.Label htmlFor="password" >
                                             Password <span className="text-danger" style={{ marginLeft: "-2px" }}>*</span>
                                          </Form.Label>
                                          <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
                                       </Form.Floating>
                                    </Col>
                                    <Col lg="12" className="d-flex justify-content-between">
                                       <Form.Check className="form-check mb-3">
                                          <Form.Check.Input type="checkbox" id="customCheck1" />
                                          <Form.Check.Label htmlFor="customCheck1">Remember Me</Form.Check.Label>
                                       </Form.Check>
                                       <Link to="/auth/recoverpw">Forgot Password?</Link>
                                    </Col>
                                 </Row>
                                 <div className="d-flex justify-content-center">
                                    <Button type="submit" variant="btn btn-primary" disabled={isPending}>
                                       {isPending && (
                                          <Spinner
                                             as="span"
                                             animation="border"
                                             size="sm"
                                             role="status"
                                             aria-hidden="true"
                                             className="me-2" // spacing between spinner & text
                                          />
                                       )}
                                       Sign In
                                    </Button>
                                 </div>
                                 <p className="mt-3 text-center">
                                    Don’t have an account? <Link to="/auth/sign-up" className="text-underline">Click here to sign up.</Link>
                                 </p>
                              </Form>
                           </Card.Body>
                        </Card>
                     </Col>
                  </Row>
                  <div className="sign-bg">
                     <svg width="280" height="230" viewBox="0 0 431 398" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g opacity="0.05">
                           <rect x="-157.085" y="193.773" width="543" height="77.5714" rx="38.7857" transform="rotate(-45 -157.085 193.773)" fill="#3B8AFF" />
                           <rect x="7.46875" y="358.327" width="543" height="77.5714" rx="38.7857" transform="rotate(-45 7.46875 358.327)" fill="#3B8AFF" />
                           <rect x="61.9355" y="138.545" width="310.286" height="77.5714" rx="38.7857" transform="rotate(45 61.9355 138.545)" fill="#3B8AFF" />
                           <rect x="62.3154" y="-190.173" width="543" height="77.5714" rx="38.7857" transform="rotate(45 62.3154 -190.173)" fill="#3B8AFF" />
                        </g>
                     </svg>
                  </div>
               </Col>
               <Col md="6" className="d-md-block d-none bg-primary p-0 mt-n1 vh-100 overflow-hidden">
                  <Image src={auth1} className="Image-fluid gradient-main animated-scaleX" alt="images" />
               </Col>
            </Row>
         </section>
      </>
   )
}

export default SignIn
