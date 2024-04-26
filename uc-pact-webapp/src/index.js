import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux'
import store from './store'
import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import uuid from 'react-uuid';

const oidcConfig = {
  authority: process.env.REACT_APP_KEYCLOAK_PREFIX + "/realms/" + process.env.REACT_APP_KC_REALM_NAME,
  client_id: process.env.REACT_APP_KC_CLIENT_ID,
  redirect_uri: process.env.REACT_APP_KC_REDIRECT_URL,
  post_logout_redirect_uri: process.env.REACT_APP_KC_REDIRECT_URL,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
  userStore: new WebStorageStateStore({
    store: localStorage
  })
};

// eslint-disable-next-line no-unused-vars
const sessionID = (localStorage.sessionID ?
  localStorage.sessionID :
  localStorage.sessionID = uuid());

// eslint-disable-next-line no-unused-vars
const tabID = (sessionStorage.tabID ?
  sessionStorage.tabID :
  sessionStorage.tabID = uuid());

const root = ReactDOM.createRoot(document.getElementById('root'));

window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
    window.history.go(1);
};
root.render(
  <AuthProvider {...oidcConfig}>
    <Provider store={store}>   
      <App />
    </Provider>
  </AuthProvider>
);
