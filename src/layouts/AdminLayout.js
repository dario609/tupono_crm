import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";


import "../assets/css/admin_layout.css"; // <-- we'll move your inline CSS here

const AdminLayout = ({ children }) => {
  return (
    <div className="container-scroller with-welcome-text">
      <div className="loader-overlay" style={{ display: "none" }}>
        <div className="loader"></div>
      </div>

      <Header />

      <div className="container-fluid page-body-wrapper">
        <Sidebar />

        <div className="main-panel">
          <div className="content-wrapper pt-0">{children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
