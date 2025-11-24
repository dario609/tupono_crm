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
import UsersApi from "../../api/usersApi";
import { AuthApi } from "../../api/authApi";
import defaultProfileImage from "../../assets/images/user.jpg";
import { ProfileSkeleton } from "../../components/common/SkelentonTableRow";
import safeString from "../../utils/safe";
const ProfilePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile"); // "profile" or "password"
    const [user, setUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        city: "",
        country: "",
        zip_code: "",
        profile_image: "",
    });
    const [passwordData, setPasswordData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        old_password: false,
        new_password: false,
        confirm_password: false,
    });
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState("");
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const authUser = (await AuthApi.check()).user;
            setUserId(authUser.id);
            const res = await UsersApi.getById(authUser.id);
            const profileImageUrl = `${process.env.REACT_APP_TUPONO_API_URL.replace('/api', '')}${res.data.profile_image}`;
            setUser(res.data); 
            setProfileImagePreview( res.data.profile_image ? profileImageUrl : defaultProfileImage);
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
            await UsersApi.updateProfile(user._id, formData);
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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field],
        });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setSuccess("");

        // Validation
        if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
            setErrors(["All fields are required."]);
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setErrors(["New password and confirm password do not match."]);
            return;
        }

        if (passwordData.new_password.length < 6) {
            setErrors(["New password must be at least 6 characters long."]);
            return;
        }

        try {
            await UsersApi.changePassword(userId, {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password,
                confirm_password: passwordData.confirm_password,
            });
            setSuccess("Password changed successfully.");
            // Clear form
            setPasswordData({
                old_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (e) {
            if (e.response?.data?.errors) {
                setErrors(Object.values(e.response.data.errors).flat());
            } else if (e.response?.data?.message) {
                setErrors([e.response.data.message]);
            } else if (e.message) {
                setErrors([e.message]);
            } else {
                setErrors(["Something went wrong. Please try again."]);
            }
        }
    };



    return (
        <div className="container-full">
            {/* Breadcrumb */}

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24 card mt-3">
                <div className="col-12 card-body">
                    {user && (
                        <div className="template-demo">
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb breadcrumb-custom">
                                    <li className="breadcrumb-item"><a href="/admin/dashboard" style={{ textDecoration: "none" }}>Dashboard</a></li>
                                    <li className="breadcrumb-item active">
                                        <span>{activeTab === "profile" ? "Edit Profile" : "Change Password"}</span>
                                    </li>
                                </ol>
                            </nav>
                        </div>
                    )}
                </div>
            </div>



            <section className="card mt-3 h-100 w-100">
                {!user && <ProfileSkeleton />}
                {user && (
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
                                    className={`nav-link d-flex align-items-center px-24 ${activeTab === "profile" ? "active" : ""}`}
                                    onClick={() => {
                                        setActiveTab("profile");
                                        setErrors([]);
                                        setSuccess("");
                                    }}
                                    type="button"
                                    role="tab"
                                    aria-controls="pills-profile"
                                    aria-selected={activeTab === "profile"}
                                    tabIndex="-1"
                                >
                                    Edit Profile
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link d-flex align-items-center px-24 ${activeTab === "password" ? "active" : ""}`}
                                    onClick={() => {
                                        setActiveTab("password");
                                        setErrors([]);
                                        setSuccess("");
                                    }}
                                    type="button"
                                    role="tab"
                                    aria-controls="pills-change-password"
                                    aria-selected={activeTab === "password"}
                                    tabIndex="-1"
                                >
                                    Change Password
                                </button>
                            </li>
                        </ul>

                        {activeTab === "profile" ? (
                            <Row className="w-100 p-3 m-0" >
                                <Col xl={4} lg={5}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <img
                                                src={profileImagePreview || defaultProfileImage}
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
                                                    {safeString(user.phone)}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>Email :</strong>{" "}
                                                    {safeString(user.email)}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>Address :</strong>{" "}
                                                    {safeString(user.address)}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>City :</strong>{" "}
                                                    {safeString(user.city)}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>State :</strong>{" "}
                                                    {safeString(user.state)}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>County :</strong>{" "}
                                                    {safeString(user.country)}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>Zip Code :</strong>{" "}
                                                    {safeString(user.zip_code)}
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
                                                                    First Name 
                                                                </Form.Label>
                                                                <Form.Control
                                                                    id="first_name"
                                                                    name="first_name"
                                                                    type="text"
                                                                    maxLength={50}
                                                                    value={safeString(user.first_name)}
                                                                    onChange={handleChange}
                                                                    onKeyPress={handleKeyPress}
                                                                    placeholder="Enter First Name"
                                                                />
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label htmlFor="last_name">
                                                                    Last Name
                                                                </Form.Label>
                                                                <Form.Control
                                                                    id="last_name"
                                                                    name="last_name"
                                                                    type="text"
                                                                    maxLength={50}
                                                                    value={safeString(user.last_name)}
                                                                    onChange={handleChange}
                                                                    onKeyPress={handleKeyPress}
                                                                    placeholder="Enter Last Name"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label htmlFor="address">
                                                                    Address 
                                                                </Form.Label>
                                                                <Form.Control
                                                                    id="address"
                                                                    name="address"
                                                                    as="textarea"
                                                                    rows={2}
                                                                    maxLength={250}
                                                                    value={safeString(user.address)}
                                                                    onChange={handleChange}
                                                                    placeholder="Enter Address"
                                                                    style={{
                                                                        resize: "none",
                                                                        height: "55px !important",
                                                                    }}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label htmlFor="city">
                                                                    City 
                                                                </Form.Label>
                                                                <Form.Control
                                                                    id="city"
                                                                    name="city"
                                                                    type="text"
                                                                    maxLength={50}
                                                                    value={safeString(user.city)}
                                                                    onChange={handleChange}
                                                                    onKeyPress={handleKeyPress}
                                                                    placeholder="Enter City"
                                                                />
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label htmlFor="state">
                                                                    State
                                                                </Form.Label>
                                                                <Form.Control
                                                                    id="state"
                                                                    name="state"
                                                                    type="text"
                                                                    maxLength={50}
                                                                    value={safeString(user.state)}
                                                                    onChange={handleChange}
                                                                    onKeyPress={handleKeyPress}
                                                                    placeholder="Enter State"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label htmlFor="country">
                                                                    County 
                                                                </Form.Label>
                                                                <Form.Control
                                                                    id="country"
                                                                    name="country"
                                                                    type="text"
                                                                    maxLength={100}
                                                                    value={safeString(user.country)}
                                                                    onChange={handleChange}
                                                                    onKeyPress={handleKeyPress}
                                                                    placeholder="Enter Country"
                                                                />
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label htmlFor="zip_code">
                                                                    Zip Code 
                                                                </Form.Label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    name="zip_code"
                                                                    id="zip_code"
                                                                    value={safeString(user.zip_code)}
                                                                    placeholder="Enter Zip Code"
                                                                    maxLength={6}
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
                                                                    Phone Number
                                                                </Form.Label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="phone"
                                                                    name="phone"
                                                                    placeholder="Enter Phone"
                                                                    maxLength={14}
                                                                    value={safeString(user.phone)}
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
                        ) : (
                            <div className="col-xl-12 col-lg-12">
                                <Card>
                                    <Card.Body>
                                        <h4 className="mb-4">Change Password</h4>
                                        <div className="tab-content" style={{ borderTop: "1px solid #dee2e6" }}>
                                            <div className="tab-pane show active" id="settings">
                                                <Form onSubmit={handlePasswordSubmit}>
                                                    <Row>
                                                        {/* Success alert */}
                                                        {success && (
                                                            <Col md={12}>
                                                                <Alert
                                                                    variant="success"
                                                                    onClose={() => setSuccess("")}
                                                                    dismissible
                                                                >
                                                                    <ul style={{ listStyle: "none", marginBottom: "0px" }}>
                                                                        <li>{success}</li>
                                                                    </ul>
                                                                </Alert>
                                                            </Col>
                                                        )}

                                                        {/* Error alert */}
                                                        {errors.length > 0 && (
                                                            <Col md={12}>
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
                                                            </Col>
                                                        )}

                                                        <Col md={4}>
                                                            <Form.Group className="mb-3 position-relative">
                                                                <Form.Label htmlFor="old_password">
                                                                    Old Password <span className="text-danger">*</span>
                                                                </Form.Label>
                                                                <Form.Control
                                                                    type={showPasswords.old_password ? "text" : "password"}
                                                                    id="old_password"
                                                                    name="old_password"
                                                                    placeholder="Enter Old Password"
                                                                    required
                                                                    value={passwordData.old_password}
                                                                    onChange={handlePasswordChange}
                                                                />
                                                                <i
                                                                    className={`fa ${showPasswords.old_password ? "fa-eye-slash" : "fa-eye"} toggle-password`}
                                                                    onClick={() => togglePasswordVisibility("old_password")}
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "35px",
                                                                        right: "25px",
                                                                        cursor: "pointer",
                                                                    }}
                                                                />
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <Form.Group className="mb-3 position-relative">
                                                                <Form.Label htmlFor="new_password">
                                                                    New Password <span className="text-danger">*</span>
                                                                </Form.Label>
                                                                <Form.Control
                                                                    type={showPasswords.new_password ? "text" : "password"}
                                                                    id="new_password"
                                                                    name="new_password"
                                                                    placeholder="Enter New Password"
                                                                    required
                                                                    value={passwordData.new_password}
                                                                    onChange={handlePasswordChange}
                                                                />
                                                                <i
                                                                    className={`fa ${showPasswords.new_password ? "fa-eye-slash" : "fa-eye"} toggle-password`}
                                                                    onClick={() => togglePasswordVisibility("new_password")}
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "35px",
                                                                        right: "25px",
                                                                        cursor: "pointer",
                                                                    }}
                                                                />
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <Form.Group className="mb-3 position-relative">
                                                                <Form.Label htmlFor="confirm_password">
                                                                    Confirm New Password <span className="text-danger">*</span>
                                                                </Form.Label>
                                                                <Form.Control
                                                                    type={showPasswords.confirm_password ? "text" : "password"}
                                                                    id="confirm_password"
                                                                    name="confirm_password"
                                                                    placeholder="Confirm New Password"
                                                                    required
                                                                    value={passwordData.confirm_password}
                                                                    onChange={handlePasswordChange}
                                                                />
                                                                <i
                                                                    className={`fa ${showPasswords.confirm_password ? "fa-eye-slash" : "fa-eye"} toggle-password`}
                                                                    onClick={() => togglePasswordVisibility("confirm_password")}
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "35px",
                                                                        right: "25px",
                                                                        cursor: "pointer",
                                                                    }}
                                                                />
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={12} className="text-center">
                                                            <Button
                                                                type="submit"
                                                                variant="primary"
                                                                className="btn-rounded btn-fw"
                                                            >
                                                                Change Password
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </Form>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        )}

                    </div>
                )}
            </section>

        </div>
    );
};

export default ProfilePage;

