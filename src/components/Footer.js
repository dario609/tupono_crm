import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="d-sm-flex justify-content-center justify-content-sm-between">
        <span className="text-muted text-center text-sm-left d-block d-sm-inline-block">
          Copyright © {year}{" "}
          <a href="javascript:void(0);" className="text-decoration-none">
            TCL
          </a>
          . All Rights Reserved. Designed and Developed by{" "}
          <a
            href="https://www.connectinfosoft.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
          >
            Connect Infosoft
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
