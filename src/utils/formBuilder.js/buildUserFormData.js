export const buildUserFormData = (form, emailUserNow, profileImage) => {
    const fd = new FormData();
  
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
  
    const toArray = (s) =>
      String(s || "")
        .split(/[\n,]/g)
        .map((x) => x.trim())
        .filter(Boolean);
  
    fd.set("hapu", JSON.stringify(toArray(form.hapu)));
    fd.set("iwi", JSON.stringify(toArray(form.iwi)));
    fd.set("marae", JSON.stringify(toArray(form.marae)));
    fd.set("maunga", JSON.stringify(toArray(form.maunga)));
    fd.set("awa", JSON.stringify(toArray(form.awa)));
  
    fd.set("emailNow", emailUserNow);
  
    if (profileImage) fd.append("profile_image", profileImage);
  
    return fd;
  };
  