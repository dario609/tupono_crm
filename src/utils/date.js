export const toInputFormat = (value) => {
    if (!value) return "";
    const [dd, mm, yyyy] = value.split("/");
    return `${yyyy}-${mm}-${dd}`;
};

export const toDisplayFormat = (value) => {
    if (!value) return "";
    const [yyyy, mm, dd] = value.split("-");
    return `${dd}/${mm}/${yyyy}`;
};
