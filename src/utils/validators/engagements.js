const validateEngagement = (data) => {
    const errors = {};
    if (!data.engage_date) errors.engage_date = "Date is required";
    if (!data.engage_type) errors.engage_type = "Engagement Type is required";
    if (!data.purpose) errors.purpose = "Purpose is required";
    if (!data.hapus || data.hapus.length === 0) errors.hapus = "Hapū is required";
    if (!data.project) errors.project = "Project is required";
    return errors;
};

export default validateEngagement;