export const onlyLetters = (s) => s.replace(/[^a-zA-Z\s]/g, "");
export const onlyDigits = (s) => s.replace(/\D/g, "");

export const formatZip = (s) => onlyDigits(s).slice(0, 10);

export const formatPhone = (s) => {
    const d = onlyDigits(s).slice(0, 10);
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  };