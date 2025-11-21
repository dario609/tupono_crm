import React, { useEffect, useState } from "react";
import {
    Card,
    Row,
    Col,
    Form,
    Button,
    Breadcrumb,
    Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
// import InputMask from "react-input-mask";
import UsersApi from "../../api/usersApi";
import { AuthApi } from "../../api/authApi";
import defaultProfileImage from "../../assets/images/user.jpg";

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState("");
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const authUser = (await AuthApi.check()).user;
            const res = await UsersApi.getById(authUser.id);
            setUser(res.data);
            setProfileImagePreview(res.data.profile_image || defaultProfileImage);
        } catch (e) {
            console.error(e);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    const handleKeyPress = (e) => {
        // Only allow letters and spaces for name fields
        const charCode = e.charCode || e.keyCode;
        if (!((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode === 32)) {
            e.preventDefault();
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setUser({ ...user, profile_image: file });

        if (file) {
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setSuccess("");

        const formData = new FormData();
        Object.keys(user).forEach((key) => {
            formData.append(key, user[key]);
        });

        try {
            const authUser = (await AuthApi.check()).user;
            await UsersApi.update(authUser.id, formData);
            setSuccess("Profile updated successfully.");
            // Reload user data after successful update
            setTimeout(() => {
                loadUser();
            }, 1000);
        } catch (e) {
            if (e.response?.data?.errors) {
                setErrors(Object.values(e.response.data.errors).flat());
            } else {
                setErrors(["Something went wrong."]);
            }
        }
    };

    const handleChangePassword = () => {
        navigate("/change-password");
    };

    

    return (
        <div className="container-full">
            {/* Breadcrumb */}
             {user && (
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24 card mt-3">
                <div className="col-12 card-body">
                    <div className="template-demo">
                        <nav aria-label="breadcrumb">
                            <Breadcrumb className="breadcrumb-custom">
                                <Breadcrumb.Item href="/admin/dashboard">
                                    Dashboard
                                </Breadcrumb.Item>

                                <Breadcrumb.Item active>
                                    <span>Edit Profile</span>
                                </Breadcrumb.Item>
                            </Breadcrumb>
                        </nav>

                    </div>
                </div>
             </div>
             )}
        
            { user && (
            <section className="card mt-3 h-100 w-100">
                <div className="row card-body">
                    {/* Navigation Pills */}
                    <ul
                        className="nav border-gradient-tab nav-pills d-inline-flex p-3"
                        id="pills-tab"
                        role="tablist"
                        style={{ borderBottom: "0px !important" }}
                    >
                        <li className="nav-item">
                            <button
                                className="nav-link d-flex align-items-center px-24 active"
                                onClick={() => navigate("/profile")}
                                type="button"
                                role="tab"
                                aria-controls="pills-change-password"
                                aria-selected="false"
                                tabIndex="-1"
                            >
                                Edit Profile
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className="nav-link d-flex align-items-center px-24"
                                onClick={handleChangePassword}
                                type="button"
                                role="tab"
                                aria-controls="pills-change-password"
                                aria-selected="false"
                                tabIndex="-1"
                            >
                                Change Password
                            </button>
                        </li>
                    </ul>

                    <Row className="w-100 p-3 m-0" >
                        {/* Left Panel - Profile Summary */}
                        <Col xl={4} lg={5}>
                            <Card className="text-center">
                                <Card.Body>

                                    {/* Profile Picture */}
                                    <img
                                        src={profileImagePreview}
                                        className="bg-light w-50 h-50 rounded-circle avatar-lg img-thumbnail"
                                        alt="profile-image"
                                        style={{
                                            objectFit: "cover",
                                            height: "200px !important",
                                            width: "200px !important",
                                        }}
                                    />

                                    {/* User Name */}
                                    <h4 className="mb-0 mt-2">
                                        {user.first_name} {user.last_name}
                                    </h4>

                                    {/* Profile Details */}
                                    <div className="text-start mt-3">
                                        <p className="mb-2">
                                            <strong>Phone Number :</strong>
                                            <span className="ms-2">{user.phone || ""}</span>
                                        </p>
                                        <p className="mb-2">
                                            <strong>Email :</strong>{" "}
                                            <span className="ms-2">{user.email || ""}</span>
                                        </p>
                                        <p className="mb-2">
                                            <strong>Address :</strong>{" "}
                                            <span className="ms-2">{user.address || ""}</span>
                                        </p>
                                        <p className="mb-2">
                                            <strong>City :</strong>{" "}
                                            <span className="ms-2">{user.city || ""}</span>
                                        </p>
                                        <p className="mb-2">
                                            <strong>State :</strong>{" "}
                                            <span className="ms-2">{user.state || ""}</span>
                                        </p>
                                        <p className="mb-2">
                                            <strong>County :</strong>{" "}
                                            <span className="ms-2">
                                                {user.country || ""}
                                            </span>
                                        </p>
                                        <p className="mb-2">
                                            <strong>Zip Code :</strong>{" "}
                                            <span className="ms-2">{user.zip_code || ""}</span>
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Right Panel - Personal Info Form */}
                        <Col xl={8} lg={7}>
                            <Card>
                                <Card.Body>
                                    <div className="tab-content" style={{ borderTop: "1px solid #dee2e6" }}>
                                        <div className="tab-pane show active" id="settings">
                                            {/* Success alert */}
                                            {success && (
                                                <Alert
                                                    variant="success"
                                                    onClose={() => setSuccess("")}
                                                    dismissible
                                                >
                                                    <ul style={{ listStyle: "none", marginBottom: "0px" }}>
                                                        <li>{success}</li>
                                                    </ul>
                                                </Alert>
                                            )}

                                            {/* Error alert */}
                                            {errors.length > 0 && (
                                                <Alert
                                                    variant="danger"
                                                    onClose={() => setErrors([])}
                                                    dismissible
                                                >
                                                    <ul style={{ listStyle: "none", marginBottom: "0px" }}>
                                                        {errors.map((err, i) => (
                                                            <li key={i}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </Alert>
                                            )}

                                            {/* Section Header */}
                                            <h5 className="mb-4 display-5">
                                                <i className="mdi mdi-account-circle me-1"></i> Personal Info
                                            </h5>

                                            <Form onSubmit={handleSubmit}>
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="first_name">
                                                                First Name <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <Form.Control
                                                                id="first_name"
                                                                name="first_name"
                                                                type="text"
                                                                maxLength={50}
                                                                value={user.first_name || ""}
                                                                onChange={handleChange}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Enter First Name"
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="last_name">
                                                                Last Name <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <Form.Control
                                                                id="last_name"
                                                                name="last_name"
                                                                type="text"
                                                                maxLength={50}
                                                                value={user.last_name || ""}
                                                                onChange={handleChange}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Enter Last Name"
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={12}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="address">
                                                                Address <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <Form.Control
                                                                id="address"
                                                                name="address"
                                                                as="textarea"
                                                                rows={2}
                                                                maxLength={250}
                                                                value={user.address || ""}
                                                                onChange={handleChange}
                                                                placeholder="Enter Address"
                                                                style={{
                                                                    resize: "none",
                                                                    height: "55px !important",
                                                                }}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="city">
                                                                City <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <Form.Control
                                                                id="city"
                                                                name="city"
                                                                type="text"
                                                                maxLength={50}
                                                                value={user.city || ""}
                                                                onChange={handleChange}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Enter City"
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="state">
                                                                State <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <Form.Control
                                                                id="state"
                                                                name="state"
                                                                type="text"
                                                                maxLength={50}
                                                                value={user.state || ""}
                                                                onChange={handleChange}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Enter State"
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="country">
                                                                County <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <Form.Control
                                                                id="country"
                                                                name="country"
                                                                type="text"
                                                                maxLength={100}
                                                                value={user.country || ""}
                                                                onChange={handleChange}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Enter Country"
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="zip_code">
                                                                Zip Code <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="zip_code"
                                                                id="zip_code"
                                                                value={user.zip_code || ""}
                                                                placeholder="Enter Zip Code"
                                                                maxLength={6}
                                                                required
                                                                onChange={(e) => {
                                                                    // keep only digits
                                                                    let raw = e.target.value.replace(/\D/g, "");

                                                                    // limit to 6 digits
                                                                    if (raw.length > 6) raw = raw.slice(0, 6);

                                                                    setUser({ ...user, zip_code: raw });
                                                                }}
                                                            />

                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="phone">
                                                                Phone Number <span className="text-danger">*</span>
                                                            </Form.Label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                id="phone"
                                                                name="phone"
                                                                placeholder="Enter Phone"
                                                                required
                                                                maxLength={14}
                                                                value={user.phone || ""}
                                                                onChange={(e) => {
                                                                    let raw = e.target.value.replace(/\D/g, ""); // digits only

                                                                    if (raw.length > 10) raw = raw.slice(0, 10);

                                                                    let formatted = raw;

                                                                    if (raw.length > 6) {
                                                                        formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;
                                                                    } else if (raw.length > 3) {
                                                                        formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
                                                                    } else if (raw.length > 0) {
                                                                        formatted = `(${raw}`;
                                                                    }

                                                                    setUser({ ...user, phone: formatted });
                                                                }}
                                                            />

                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label htmlFor="profile_image">
                                                                Profile Image
                                                            </Form.Label>
                                                            <Form.Control
                                                                id="profile_image"
                                                                name="profile_image"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageChange}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                {/* Save Button */}
                                                <div className="text-center">
                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        className="btn-rounded btn-fw"
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </Form>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>
            )}
        </div>
    );
};

export default ProfilePage;

