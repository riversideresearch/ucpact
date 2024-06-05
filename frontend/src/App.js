import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.css';
import LandingPage from './components/landingPage';
import ModelList from './components/modelList';
import LoadingPage from './components/loadingPage';
import 'react-notifications-component/dist/theme.css'
import './App.css';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { changeModelReadOnlyDispatch } from './features/model/modelSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "react-oidc-context";

function App(props) {
  const modelSelector = useSelector(state => state.model);
  const reduxSelector = useSelector(state => state);

  const [modelIsActive, setModelIsActive] = useState(false);
  const [modelModalShow, setModelModalShow] = useState(false);
  const auth = useAuth();
  const handleShow = () => setModelModalShow(true);

  const handleLogout = () => {
    if (auth.isAuthenticated) {
      let urlPath = process.env.REACT_APP_SERVER_PREFIX + '/return';
      let token = "none";
      if (process.env.NODE_ENV !== 'test') {
          token = auth.user?.access_token;
      }
      axios({
          method: "GET",
          url: urlPath,
          headers: {
            Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
          }
      })
      .then(_ => {})
      .catch((err) => {
          if (err.response) {
              console.log(err.response);
              console.log(err.response.status);
              console.log(err.response.headers);
          }
      })
      .finally(() => {
          if (!modelSelector.readOnly) {
            changeModelReadOnlyDispatch("");
            let reduxData = {...reduxSelector}
            delete reduxData["model"];
          }
      });
    }
    if (auth.activeNavigator !== "signoutRedirect") {
      auth.signoutRedirect();
    }
  }
  if (process.env.NODE_ENV !== 'test') {
    switch (auth.activeNavigator) {
      case "signinSilent":
        return <div>Signing you in ...</div>;
      case "signoutRedirect":
        if (reduxSelector["model"]) {
          handleLogout();
        }
        return <div>Signing you out ...</div>;
      default:
        // do nothing
    }

    if (auth.isLoading) {
      return <div>Auth is loading...</div>;
    }
  }
  window.addEventListener('storage', () => {
    if (process.env.NODE_ENV !== 'test' && auth.isAuthenticated) {
      let flag = true;
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).startsWith('oidc.user:')) {
          flag = false;
          break
        }
      }
      if (flag) {
        handleLogout()
      }
    }
  });

  window.addEventListener('pagehide', (event) => {
    event.preventDefault();

    if ((process.env.NODE_ENV === 'test' || auth.isAuthenticated) && !modelSelector.readOnly) {
      changeModelReadOnlyDispatch("");
      
      let reduxData = {...reduxSelector}
      delete reduxData["model"];
      let token = "none";
      if (process.env.NODE_ENV !== 'test') {
          token = auth.user?.access_token;
      }
      let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/return/" + modelSelector.name;

      axios({
          method: "PUT",
          url: urlPath,
          headers: {
          Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
          },
          data: {
            ...reduxData,
            ...modelSelector
          }
      })
      .then(_ => {})
      .catch((err) => {
          if (err.response) {
              console.log(err.response);
              console.log(err.response.status);
              console.log(err.response.headers);
          }
      });
    }
  });
  if (process.env.NODE_ENV !== 'test' && auth.error) {
    return <div>Oops... Auth error {auth.error.message}</div>;
  }
  if (process.env.NODE_ENV === 'test' || auth.isAuthenticated) {
    return (
      <div>
        <BrowserRouter>
          <Routes>
              <Route index element={<LandingPage />} />
              <Route path="new/:name" element={<LoadingPage setModelIsActive={setModelIsActive} show={modelModalShow} setShow={setModelModalShow}/>}/>
              <Route path="model/:id" element={<LoadingPage setModelIsActive={setModelIsActive} show={modelModalShow} setShow={setModelModalShow}/>} />
              <Route path="list/" element={<ModelList />} /> 
          </Routes>
        </BrowserRouter>
        {modelIsActive && 
        <div className='readOnlyIndicator'>
            {modelSelector.readOnly ? <span className="ifReadOnly">Read Only</span> : <span className="ifWritable">Writable</span>}
        </div>}
        {modelIsActive && 
        <div className='modelSettings'>
            <FontAwesomeIcon data-testid="modelSettingsBtn" className='modelSettingsBtn' icon={faGear} size="2x" onClick={handleShow}/>
        </div>}
        <div className='logout'>
            <FontAwesomeIcon className='logoutBtn' title={"Logout"} icon={faRightFromBracket} size="2x"onClick={process.env.NODE_ENV !== 'test' ? handleLogout : () => {}}/>
        </div>
      </div>
    );
  } else if (process.env.NODE_ENV !== 'test') {
    auth.signinRedirect();
  } else {
    return (
      <div>
        <BrowserRouter>
          <Routes>
              <Route index element={<LandingPage />} />
              <Route path="new/:name" element={<LoadingPage setModelIsActive={setModelIsActive} show={modelModalShow} setShow={setModelModalShow}/>}/>
              <Route path="model/:id" element={<LoadingPage setModelIsActive={setModelIsActive} show={modelModalShow} setShow={setModelModalShow}/>} />
              <Route path="list/" element={<ModelList />} />
          </Routes>
        </BrowserRouter>
        {modelIsActive && 
        <div className='modelSettings'>
            <FontAwesomeIcon data-testid="modelSettingsBtn" className='modelSettingsBtn' icon={faGear} size="2x" onClick={handleShow}/>
        </div>}
      </div>
    );
  }
}

export default App;
