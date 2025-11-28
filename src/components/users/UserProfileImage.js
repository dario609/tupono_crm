import React from "react";

export const UserProfileImage = ({ profileImage, setProfileImage }) => (
  <div className="col-md-4 mb-2">
    <label>Profile Photo</label>
    <input
      type="file"
      className="form-control mt-1"
      accept="image/*"
      onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
    />
  </div>
);