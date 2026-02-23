import { useState, useMemo, useRef } from "react";
import UsersApi from "../../api/usersApi";
import { onlyLetters, formatPhone, formatZip } from "../../utils/formatPhone";
import { buildUserFormData } from "../../utils/formBuilder.js/buildUserFormData";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
  city: "",
  country: "",
  zip_code: "",
  address: "",
  organisation: "",
  role_id: "",
  hapu: "",
  iwi: "",
  marae: "",
  maunga: "",
  awa: "",
  project_id: "",
};

export const useCreateUserForm = ({ pushNotification }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailUserNow, setEmailUserNow] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  const confirmRef = useRef(null);

  const canSubmit = useMemo(() => {
    return (
      form.first_name &&
      form.last_name &&
      form.email &&
      form.password &&
      form.confirm_password &&
      form.role_id &&
      form.project_id &&
      form.password === form.confirm_password
    );
  }, [form]);

  const setConfirmValidity = (pwd, confirm) => {
    if (!confirmRef.current) return;
    confirmRef.current.setCustomValidity(
      pwd !== confirm ? "Passwords do not match" : ""
    );
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    let next = value;

    if (["first_name", "last_name"].includes(name)) next = onlyLetters(value).slice(0, 30);
    if (name === "phone") next = formatPhone(value);
    if (name === "zip_code") next = formatZip(value);

    setForm((prev) => {
      const updated = { ...prev, [name]: next };

      if (name === "password" || name === "confirm_password") {
        setConfirmValidity(updated.password, updated.confirm_password);
      }

      return updated;
    });
  };

  const onSubmit = async (e, navigate) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const fd = buildUserFormData(form, emailUserNow, profileImage);

      const data = await UsersApi.create(fd);

      if (!data?.success) throw new Error(data?.message);

      pushNotification({
        _id: data.data.notifications.creatorNotificationId,
        title: "New User Created",
        message: `${form.first_name} ${form.last_name} has been added.`,
        isRead: false,
        createdAt: new Date(),
      });

      setSuccess("User created successfully");
      setTimeout(() => navigate("/users"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    onChange,
    onSubmit,
    canSubmit,
    loading,
    error,
    success,
    confirmRef,
    emailUserNow,
    setEmailUserNow,
    profileImage,
    setProfileImage,
  };
};
