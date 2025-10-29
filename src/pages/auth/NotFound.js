import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container-scroller">
      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="content-wrapper d-flex align-items-center text-center error-page bg-primary">
          <div className="row flex-grow">
            <div className="col-lg-7 mx-auto text-white">
              <div className="row align-items-center">
                <div className="col-lg-12 error-page-divider text-lg-left pl-lg-4">
                  <h1 className="display-1 mb-0">404</h1>
                  <h2>Page Not Found!</h2>
                  <h3 className="fw-light">
                    The page you’re looking for was not found.
                  </h3>
                </div>
              </div>

              <div className="row mt-5">
                <div className="col-12 text-center mt-xl-2">
                  <button
                    onClick={() => navigate("/")}
                    className="btn btn-primary"
                  >
                    Back to previous page
                  </button>
                </div>
              </div>

              <div className="row mt-5">
                <div className="col-12 mt-xl-2">
                  <p className="text-white fw-medium text-center">
                    Copyright {new Date().getFullYear()} Tupono Consulting LTD. All Rights Reserved. Designed and Developed by{" "}
                    <a
                      href="https://www.connectinfosoft.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white"
                    >
                      Connect Infosoft
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* content-wrapper ends */}
      </div>
      {/* page-body-wrapper ends */}
    </div>
  );
};

export default NotFound;
