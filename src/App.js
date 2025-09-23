//router
// import IndexRouters from "./router/index"

//scss
import "./assets/scss/hope-ui.scss"
import "./assets/scss/custom.scss"
import "./assets/scss/dark.scss"
import "./assets/scss/rtl.scss"
import "./assets/scss/customizer.scss"

// Redux Selector / Action
import { useDispatch } from 'react-redux';

// import state selectors
import { setSetting } from './store/setting/actions'
import { useEffect } from "react"
import { Outlet } from "react-router-dom"

function App({children}) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setSetting())
  }, [dispatch])
  
  return (
    <div className="App">
      {/* <IndexRouters /> */}
      <Outlet />
      
    </div>
  );
}

export default App;
