const safeString = (val) => {
    if (!val || val === "null" || val === "NULL") return "";
    return val;
};

export default safeString;