"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "@/app/admin/actions";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { Field } from "@/components/admin/ui/Field/Field";
import { Switch } from "@/components/admin/ui/Switch/Switch";
import { GREETING_KEY } from "@/features/admin/greeting";
import { bem } from "@/lib/bem";
import { routes } from "@/lib/routes";
import s from "./Login.module.scss";

const b = bem(s, "admin-login");

/** Full-screen sign-in (prototype «вход»). The server checks the password and sets the session cookie. */
export function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!login.trim()) {
      setError("Укажите логин");
      return;
    }
    setPending(true);
    try {
      sessionStorage.setItem(GREETING_KEY, "1");
    } catch {}
    // On success the cookie change re-renders /admin into the panel.
    const res = await signIn(login, password, remember).catch(() => ({ error: "Не удалось войти, попробуйте ещё раз" }));
    if (res.error) {
      try {
        sessionStorage.removeItem(GREETING_KEY);
      } catch {}
      setError(res.error);
      setPassword("");
    }
    setPending(false);
  };

  return (
    <div className={b()}>
      <div className={b("top")}>
        <Link href={routes.home} className={b("brand")}>
          <span className={b("word")}>
            kuznetsovs<span className={b("dot")}>.</span>
          </span>
          <span className={b("caption")}>Админ-панель</span>
        </Link>
        <Link href={routes.home} className={b("back")}>
          ← На сайт
        </Link>
      </div>
      <div className={b("center")}>
        <form className={b("form")} onSubmit={submit}>
          <h1 className={b("title")}>вход</h1>
          <div className={b("fields")}>
            <Field label="Логин">
              <input
                className={b("input")}
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setError("");
                }}
                autoComplete="username"
                placeholder="Имя или телефон"
              />
            </Field>
            <Field label="Пароль">
              <input
                className={b("input")}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
              />
            </Field>
          </div>
          <button type="button" className={b("remember")} aria-pressed={remember} onClick={() => setRemember((v) => !v)}>
            <span>
              <span className={b("remember-title")}>Запомнить это устройство</span>
              <span className={b("remember-text")}>Не придётся входить снова, а на сайте появится кнопка «Админка»</span>
            </span>
            <Switch on={remember} />
          </button>
          <div className={b("actions")}>
            {error && (
              <span className={b("error")} role="alert">
                {error}
              </span>
            )}
            <DsButton type="submit" size="lg" block disabled={pending}>
              Войти
            </DsButton>
          </div>
        </form>
      </div>
      <span className={b("caption")}>Kuznetsovs Gallery · Ташкент</span>
    </div>
  );
}
