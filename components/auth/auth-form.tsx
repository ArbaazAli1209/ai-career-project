"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, LoaderCircle } from "lucide-react";

type AuthFormProps = { mode: "sign-in" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const registering = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (registering) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json() as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "We could not create your account.");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result?.ok) throw new Error("That email and password combination was not recognized.");
      router.replace("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Northstar career planning">
        <Link className="brand auth-brand" href="/"><span className="brand-mark"><Compass size={18} /></span><span>northstar<span className="brand-period">.</span></span></Link>
        <div className="auth-visual-copy"><p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER</p><h1>Find your<br />way <em>forward.</em></h1><p>A practical career compass for every step between classroom and career.</p></div>
        <span className="auth-visual-caption">CAREER CLARITY, BUILT AROUND YOU</span>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><Link href="/" className="auth-back"><ArrowLeft size={14} /> Back to home</Link><span>STUDENT WORKSPACE</span></div>
        <div className="auth-form-wrap">
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> {registering ? "START WITH A CLEAR VIEW" : "WELCOME BACK"}</p>
          <h2>{registering ? "Create your account" : "Sign in to Northstar"}</h2>
          <p className="auth-intro">{registering ? "Your next move starts with a little more direction." : "Pick up where your career plan left off."}</p>
          <form onSubmit={handleSubmit} className="auth-form">
            {registering && <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} /></label>}
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
            <label>Password<input type="password" autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={registering ? 12 : 1} maxLength={128} />{registering && <small>Use at least 12 characters.</small>}</label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-dark auth-submit" type="submit" disabled={pending}>
              {pending ? <><LoaderCircle size={17} className="spin" /> {registering ? "Creating account" : "Signing in"}</> : <>{registering ? "Create account" : "Sign in"} <ArrowRight size={17} /></>}
            </button>
          </form>
          <p className="auth-switch">{registering ? "Already have an account?" : "New to Northstar?"} <Link href={registering ? "/sign-in" : "/register"}>{registering ? "Sign in" : "Create an account"}</Link></p>
        </div>
        <p className="auth-legal">Your resume and career analysis stay private to your account.</p>
      </section>
    </main>
  );
}