import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import "bootstrap/dist/css/bootstrap.css"; // 
import "./assets/vendors/feather/feather.css";
import "./assets/vendors/mdi/css/materialdesignicons.min.css";
import "./assets/vendors/ti-icons/css/themify-icons.css";
import "./assets/vendors/font-awesome/css/font-awesome.min.css";
import "./assets/vendors/typicons/typicons.css";
import "./assets/vendors/simple-line-icons/css/simple-line-icons.css";
import "./assets/vendors/css/vendor.bundle.base.css";
import "./assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.css";
import "./assets/css/select2.min.css";
import "./assets/css/select2-bootstrap-5-theme.min.css";
import "./assets/vendors/datatables.net-bs4/dataTables.bootstrap4.css";
import "./assets/js/select.dataTables.min.css";

// import $ from "jquery";
import "./assets/css/style.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// import "./assets/js/chart.js";
// import "./assets/vendors/js/vendor.bundle.base.js";
// import "./assets/vendors/bootstrap-datepicker/bootstrap-datepicker.min.js";
// import "./assets/vendors/progressbar.js/progressbar.min.js";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
