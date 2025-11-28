const getBaseUrl = () => {
    const fromEnv = (process.env.REACT_APP_TUPONO_API_URL || "").trim();
    if (/^https?:\/\//i.test(fromEnv)) {
        return fromEnv.replace(/\/+$/, "");
    }
    if (process.env.NODE_ENV === "production") {
        return "https://tupono-crm-backend.onrender.com/api";
    }
    return "http://localhost:5000/api";
};

export default getBaseUrl;