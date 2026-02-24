import { redirect } from "next/navigation"

export default function AdminPage() {
  redirect("/_admin/sign-in")
}
