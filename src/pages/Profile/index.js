import React, { useEffect, useState, useCallback } from "react";
import {
    Card,
    Row,
    Col,
    Form,
    Button,
    Alert,
} from "react-bootstrap";
import SelectWithAdd from "../../components/common/SelectWithAdd";
import HapuListsApi from "../../api/hapulistsApi";
import UsersApi from "../../api/usersApi";
import { AuthApi } from "../../api/authApi";
import defaultProfileImage from "../../assets/images/user.jpg";
import { ProfileSkeleton } from "../../components/common/SkelentonTableRow";
import safeString from "../../utils/safe";
const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState("profile"); // "profile" or "password"
    const [user, setUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
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
    const [hapuList, setHapuList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const loadUser = useCallback(async () => {
        setLoading(true);
        try {
            const authUser = (await AuthApi.check()).user;
            const res = await UsersApi.getById(authUser.id);
            const profileImageUrl = res.data.profile_image
                ? `${process.env.REACT_APP_TUPONO_API_URL.replace('/api', '')}${res.data.profile_image}`
                : defaultProfileImage;
            setUser(res.data);
            setProfileImagePreview(profileImageUrl);
            // load hapu options
            try {
                const hl = await HapuListsApi.list({ perpage: -1 });
                setHapuList(hl?.data || []);
            } catch (err) {
                setHapuList([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);


    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleKeyPress = (e) => {
        // Only allow letters and spaces for name fields
        const charCode = e.charCode || e.keyCode;
        if (!((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode === 32)) {
            e.preventDefault();
        }
    };

    const handleImageChange = useCallback((e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setUser((prev) => ({ ...prev, profile_image: file }));
        setProfileImagePreview(URL.createObjectURL(file));
    }, []);

    const handleAddHapu = useCallback(async (name) => {
        if (!name) return;
        // attempt to create hapu in hapu DB if we can determine a rohe_id
        try {
            const possibleRohe = (user && (user.rohe || user.rohe_id)) || (hapuList && hapuList[0] && hapuList[0].rohe_id);
            const roheId = typeof possibleRohe === "string" ? possibleRohe : (possibleRohe?._id || possibleRohe);
            if (roheId) {
                await HapuListsApi.create({ name, rohe_id: roheId });
                // reload hapu list
                const hl = await HapuListsApi.list({ perpage: -1 });
                setHapuList(hl?.data || []);
            } else {
                // no rohe available — still update user locally
                console.warn("No rohe_id available; skipping hapu DB create");
            }
        } catch (err) {
            console.error("Failed to create hapu:", err);
        }

        // set selected hapu on user (store as single string to match UserKaupapaFields)
        setUser((prev) => ({ ...prev, hapu: String(name) }));
    }, [hapuList, user]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setErrors([]);
        setSuccess("");

        const formData = new FormData();
        setUpdating(true);
        setLoading(true);

        // Required basic fields
        formData.append("first_name", String(user.first_name || "").trim());
        formData.append("last_name", String(user.last_name || "").trim());
        formData.append("email", String(user.email || "").trim());

        // role_id: prefer id if object
        let roleId = user.role_id;
        if (roleId && typeof roleId === "object") roleId = roleId._id || roleId;
        if (roleId) formData.append("role_id", String(roleId));

        // Optional profile fields
        if (user.phone) formData.append("phone", String(user.phone));
        if (user.city) formData.append("city", String(user.city));
        if (user.country) formData.append("country", String(user.country));
        if (user.zip_code) formData.append("zip_code", String(user.zip_code));
        if (user.address) formData.append("address", String(user.address));

        // Kaupapa fields — send as string or JSON array
        if (user.hapu) {
            if (Array.isArray(user.hapu)) formData.append("hapu", JSON.stringify(user.hapu));
            else formData.append("hapu", String(user.hapu));
        }
        if (user.iwi) {
            if (Array.isArray(user.iwi)) formData.append("iwi", JSON.stringify(user.iwi));
            else formData.append("iwi", String(user.iwi));
        }
        if (user.marae) {
            if (Array.isArray(user.marae)) formData.append("marae", JSON.stringify(user.marae));
            else formData.append("marae", String(user.marae));
        }
        if (user.maunga) {
            if (Array.isArray(user.maunga)) formData.append("maunga", JSON.stringify(user.maunga));
            else formData.append("maunga", String(user.maunga));
        }
        if (user.awa) {
            if (Array.isArray(user.awa)) formData.append("awa", JSON.stringify(user.awa));
            else formData.append("awa", String(user.awa));
        }

        // Profile image file
        if (user.profile_image instanceof File) {
            formData.append("profile_image", user.profile_image);
        }

        try {
            await UsersApi.update(user._id, formData);
            setSuccess("Profile updated successfully.");
            await loadUser();
        } catch (e) {
            if (e.response?.data?.errors) {
                setErrors(Object.values(e.response.data.errors).flat());
            } else if (e.response?.data?.message) {
                setErrors([e.response.data.message]);
            } else {
                setErrors(["Something went wrong."]);
            }
        } finally {
            setUpdating(false);
            setLoading(false);
        }
    }, [user, loadUser]);

    const handlePasswordChange = useCallback((e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const togglePasswordVisibility = useCallback((field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const handlePasswordSubmit = useCallback(async (e) => {
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
            await UsersApi.changePassword(user._id, {
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
    }, [passwordData, user]);



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
                {(loading || updating) && <ProfileSkeleton />}
                {!(loading || updating) && user && (
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

                                                <p className="mb-2 text-center fong-semibold">
                                                    <strong>Email :</strong>{" "}
                                                    {safeString(user.email)}
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
                                                                            let raw = e.target.value.replace(/\D/g, "");
                                                                            if (raw.length > 10) raw = raw.slice(0, 10);
                                                                            let formatted = raw;
                                                                            if (raw.length > 6) formatted = `(${raw.slice(0,3)}) ${raw.slice(3,6)}-${raw.slice(6)}`;
                                                                            else if (raw.length > 3) formatted = `(${raw.slice(0,3)}) ${raw.slice(3)}`;
                                                                            else if (raw.length > 0) formatted = `(${raw}`;
                                                                            setUser((prev) => ({ ...prev, phone: formatted }));
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

                                                        <Row>
                                                            <Col md={6}>
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label>Hapū</Form.Label>
                                                                    <SelectWithAdd
                                                                        name="hapu"
                                                                        value={Array.isArray(user.hapu) ? (user.hapu[0] || "") : (user.hapu || "")}
                                                                        options={hapuList.map((h) => ({ value: h.name || h.hapu_name || h.name, label: h.name || h.hapu_name || h.name }))}
                                                                        placeholder="Select Hapū"
                                                                        onChange={handleChange}
                                                                        onAdd={handleAddHapu}
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
                                                                disabled={updating}
                                                            >
                                                                {updating ? "Saving..." : "Save"}
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

