import React from 'react'

// auth
import SignIn from '../views/auth/sign-in'
import SignUp from '../views/dashboard/auth/sign-up'
import Recoverpw from '../views/dashboard/auth/recoverpw'
import ResetPassword from '../views/dashboard/auth/reset-password'
import LockScreen from '../views/dashboard/auth/lock-screen'
import Error403 from '../views/auth/components/error403'
import Error404 from '../views/auth/components/error404'
import Error500 from '../views/auth/components/error500'
import Maintenance from '../views/auth/components/maintenance'

export const SimpleRouter = [
    {
        path: 'sign-in',
        element: <SignIn />
    },
    {
        path: 'auth/sign-in',
        element: <SignIn />
    },
    {
        path: 'sign-up',
        element: <SignUp />
    },
    {
        path: 'auth/sign-up',
        element: <SignUp />
    },
    {
        path: 'auth/recoverpw',
        element: <Recoverpw />
    },
    {
        path: 'recoverpw',
        element: <Recoverpw />
    },
    {
        path: 'auth/reset-password',
        element: <ResetPassword />
    },
    {
        path: 'reset-password',
        element: <ResetPassword />
    },
    {
        path: 'auth/lock-screen',
        element: <LockScreen />
    },
    {
        path: 'lock-screen',
        element: <LockScreen />
    },
    {
        path: '/server-error',
        element: <Error500 />
    },
    {
        path: '/unauthorized',
        element: <Error403 />
    },
    {
        path: 'maintenance',
        element: <Maintenance />
    },
    {
        path: '*',
        element: <Error404 />
    }
];
