// Roles with full admin rights. A teacher is on the same level as an admin,
// matching the API (AuthAccount::STAFF_ROLES): use isStaffRole() wherever the
// code used to check `role === "admin"`.
export const STAFF_ROLES = ["admin", "teacher"];

export const isStaffRole = (role) => STAFF_ROLES.includes(role);
