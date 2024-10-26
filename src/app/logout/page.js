import { logoutRequest } from "../Api";

export default async function Logout() {
  await logoutRequest();
}
