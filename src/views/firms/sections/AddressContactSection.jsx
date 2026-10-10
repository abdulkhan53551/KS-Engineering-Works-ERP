import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { useWatch } from 'react-hook-form';

const AddressContactSection = ({ register, errors, control, setValue, countryStates, cities, isFetchingCities }) => {
    const selectedState = useWatch({ control, name: "stateId" });

    return (
        <div className="p-4">
            {/* Digital Channels (Email, Phone, Website) */}
            <Row>
                <Col lg={4} md={6}>
                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                        <Form.Control
                            type="email"
                            id="email"
                            placeholder="Official Email Address"
                            isInvalid={!!errors.email}
                            {...register("email")}
                        />
                        <Form.Label htmlFor="email">Official Email Address</Form.Label>
                        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                    </Form.Floating>
                </Col>

                <Col lg={4} md={6}>
                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                        <Form.Control
                            type="text"
                            id="phoneNumber"
                            placeholder="Primary Phone Number"
                            maxLength={10}
                            isInvalid={!!errors.phoneNumber}
                            {...register("phoneNumber", {
                                onChange: (e) => {
                                    const numericOnly = e.target.value.replace(/\D/g, "");
                                    setValue("phoneNumber", numericOnly, { shouldValidate: true });
                                }
                            })}
                        />
                        <Form.Label htmlFor="phoneNumber">
                            Primary Phone Number (10 digits) <span className="text-danger label-required">*</span>
                        </Form.Label>
                        <Form.Control.Feedback type="invalid">{errors.phoneNumber?.message}</Form.Control.Feedback>
                    </Form.Floating>
                </Col>

                <Col lg={4} md={12}>
                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                        <Form.Control
                            type="text"
                            id="website"
                            placeholder="Corporate Website (e.g. https://company.com)"
                            isInvalid={!!errors.website}
                            {...register("website")}
                        />
                        <Form.Label htmlFor="website">Corporate Website</Form.Label>
                        <Form.Control.Feedback type="invalid">{errors.website?.message}</Form.Control.Feedback>
                    </Form.Floating>
                </Col>
            </Row>

            {/* Physical Address Grid */}
            <Row>
                <Col lg={6}>
                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                        <Form.Control
                            as="textarea"
                            id="addressLine1"
                            placeholder="Registered Street Address"
                            style={{ height: '118px' }}
                            isInvalid={!!errors.addressLine1}
                            {...register("addressLine1")}
                        />
                        <Form.Label htmlFor="addressLine1">
                            Registered Street Address <span className="text-danger label-required">*</span>
                        </Form.Label>
                        <Form.Control.Feedback type="invalid">{errors.addressLine1?.message}</Form.Control.Feedback>
                    </Form.Floating>
                </Col>

                <Col lg={6}>
                    <Row>
                        {/* State Dropdown */}
                        <Col sm={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                <Form.Select
                                    id="stateId"
                                    isInvalid={!!errors.stateId}
                                    {...register("stateId", { required: "Please select a state" })}
                                >
                                    <option value="">-- Select State --</option>
                                    {countryStates.map((st) => (
                                        <option key={st.id} value={st.id}>{st.name}</option>
                                    ))}
                                </Form.Select>
                                <Form.Label htmlFor="stateId">
                                    State <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.stateId?.message}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* City Dropdown */}
                        <Col sm={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                <Form.Select
                                    id="cityId"
                                    disabled={!selectedState || isFetchingCities}
                                    isInvalid={!!errors.cityId}
                                    {...register("cityId")}
                                >
                                    <option value="">{isFetchingCities ? "Loading..." : "-- Select City --"}</option>
                                    {cities.map((ct) => (
                                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                                    ))}
                                </Form.Select>
                                <Form.Label htmlFor="cityId">
                                    City <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.cityId?.message}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Pincode */}
                        <Col sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    type="text"
                                    id="pincode"
                                    placeholder="6-digit Pincode"
                                    maxLength={6}
                                    isInvalid={!!errors.pincode}
                                    {...register("pincode", {
                                        onChange: (e) => {
                                            e.target.value = e.target.value.replace(/\D/g, "");
                                        }
                                    })}
                                />
                                <Form.Label htmlFor="pincode">
                                    Postal Pincode <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.pincode?.message}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
};

export default React.memo(AddressContactSection);
