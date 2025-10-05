//router
// import IndexRouters from "./router/index"

//scss
import "./assets/scss/hope-ui.scss"
import "./assets/scss/custom.scss"
import "./assets/scss/dark.scss"
import "./assets/scss/rtl.scss"
import "./assets/scss/customizer.scss"
import "./assets/custom/scss/custom.scss"

// Redux Selector / Action
import { useDispatch } from 'react-redux';

// import state selectors
import { setSetting } from './store/setting/actions'
import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Bounce, ToastContainer } from "react-toastify"

function App({ children }) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setSetting())
  }, [dispatch])

  return (
    <div className="App">
      {/* <IndexRouters /> */}
      <Outlet />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        transition={Bounce}
      />
    </div>
  );
}

export default App;
