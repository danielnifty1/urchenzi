"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/userStore";

export default function RegisterPage() {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name || !email || !password) return;
    login({ id: "u1", name, email });
    toast.success("Account created.");
    router.push("/");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6"
    >
      <h1 className="text-2xl font-bold">Register</h1>
      <input
        placeholder="Full name"
        className="w-full rounded-xl border border-border bg-background px-3 py-2"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        className="w-full rounded-xl border border-border bg-background px-3 py-2"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full rounded-xl border border-border bg-background px-3 py-2"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <button type="submit" className="w-full rounded-xl bg-brand-strong py-2 font-medium text-white">
        Register
      </button>
    </form>
  );
}
