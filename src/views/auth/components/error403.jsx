import React from 'react'
import {Container,Image} from 'react-bootstrap'
import {Link} from 'react-router-dom'
// img
// import error500 from '../../../assets/images/error/403_1.png'

 const Error403 = () => {
    return (
        <>
            <div className="gradient">
                <Container>
                    {/* <Image src={error500} className="img-fluid mb-4 w-50" alt=""/> */}
                    <h2 className="mb-0 mt-4 text-white">Oops! You don’t have permission to view this page.</h2>
                    <p className="mt-2 text-white">Please contact your administrator if you believe this is a mistake.</p>
                    <Link className="btn bg-white text-primary d-inline-flex align-items-center" to="/dashboard">Back to Home</Link>
                </Container>
                <div className="box">
                    <div className="c xl-circle">
                        <div className="c lg-circle">
                            <div className="c md-circle">
                                <div className="c sm-circle">
                                    <div className="c xs-circle">                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Error403;
