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
import axios from "axios";
import InputMask from "react-input-mask";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await axios.get("/api/user/profile");
      setUser(res.data);
      setProfileImagePreview(
        res.data.profile_image
          ? `/assets/images/uploads/users/${res.data.profile_image}`
          : "/assets/images/user.jpg"
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
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
      const res = await axios.post("/api/user/profile/update", formData);
      setSuccess("Profile updated successfully.");
    } catch (e) {
      if (e.response?.data?.errors) {
        setErrors(Object.values(e.response.data.errors).flat());
      } else {
        setErrors(["Something went wrong."]);
      }
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mt-3">

      {/* Breadcrumb */}
      <Card className="mb-3 p-3">
        <Breadcrumb>
          <Breadcrumb.Item href="/admin/dashboard">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item active>Edit Profile</Breadcrumb.Item>
        </Breadcrumb>
      </Card>

      <Row>
        <Col xl={4} lg={5}>
          <Card className="text-center">
            <Card.Body>
              <img
                src={profileImagePreview}
                className="rounded-circle img-thumbnail mb-3"
                alt="profile"
                style={{
                  width: 200,
                  height: 200,
                  objectFit: "cover",
                }}
              />
              <h4>{user.first_name} {user.last_name}</h4>

              <div className="text-start mt-3">
                <p><strong>Phone:</strong> {user.phone}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Address:</strong> {user.address}</p>
                <p><strong>City:</strong> {user.city}</p>
                <p><strong>State:</strong> {user.state}</p>
                <p><strong>Country:</strong> {user.country}</p>
                <p><strong>Zip:</strong> {user.zip_code}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={8} lg={7}>
          <Card>
            <Card.Body>

              {/* Success alert */}
              {success && (
                <Alert variant="success" onClose={() => setSuccess("")} dismissible>
                  {success}
                </Alert>
              )}

              {/* Error alert */}
              {errors.length > 0 && (
                <Alert variant="danger" onClose={() => setErrors([])} dismissible>
                  <ul style={{ margin: 0 }}>
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <h5><i className="mdi mdi-account-circle"></i> Personal Info</h5>

              <Form onSubmit={handleSubmit} className="mt-3">

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        name="first_name"
                        value={user.first_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name *</Form.Label>
                      <Form.Control
                        name="last_name"
                        value={user.last_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Address *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={user.address}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        name="city"
                        value={user.city}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State *</Form.Label>
                      <Form.Control
                        name="state"
                        value={user.state}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country *</Form.Label>
                      <Form.Control
                        name="country"
                        value={user.country}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Zip Code *</Form.Label>
                      <InputMask
                        mask="999999"
                        value={user.zip_code}
                        onChange={handleChange}
                      >
                        {(inputProps) => (
                          <Form.Control
                            {...inputProps}
                            name="zip_code"
                            required
                          />
                        )}
                      </InputMask>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone *</Form.Label>
                      <InputMask
                        mask="(999) 999-9990"
                        value={user.phone}
                        onChange={handleChange}
                      >
                        {(inputProps) => (
                          <Form.Control
                            {...inputProps}
                            name="phone"
                            required
                          />
                        )}
                      </InputMask>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Profile Image</Form.Label>
                      <Form.Control
                        type="file"
                        onChange={handleImageChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-center">
                  <Button type="submit" variant="primary" className="px-4">
                    Save
                  </Button>
                </div>

              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
