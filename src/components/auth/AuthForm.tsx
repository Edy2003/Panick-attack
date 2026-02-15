"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AuthForm() {
  const t = useTranslations("auth");
  const { sendMagicCode, signInWithMagicCode } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await sendMagicCode(email.trim());
      setStep("code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("sendError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await signInWithMagicCode(email.trim(), code.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("codeError")
      );
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm p-6">
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <Mail className="mx-auto h-10 w-10 text-calm-blue mb-2" />
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "email" ? (
          <>
            <Input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              autoFocus
            />
            <Button onClick={handleSendCode} disabled={loading || !email.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {t("sendCode")}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-center text-muted-foreground">
              {t("codeSent", { email })}
            </p>
            <Input
              type="text"
              placeholder={t("codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <Button
              onClick={handleVerifyCode}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {t("verify")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            >
              {t("changeEmail")}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
