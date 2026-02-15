"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface SOSConfirmationProps {
  open: boolean;
  isCountdown: boolean;
  countdown: number;
  isSending: boolean;
  error: string | null;
  lastResult: Array<{
    contactId: string;
    channel: string;
    status: "sent" | "failed";
    error?: string;
  }> | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SOSConfirmation({
  open,
  isCountdown,
  countdown,
  isSending,
  error,
  lastResult,
  onConfirm,
  onCancel,
}: SOSConfirmationProps) {
  const t = useTranslations("sos");

  const sentCount = lastResult?.filter((r) => r.status === "sent").length ?? 0;
  const hasSent = lastResult && sentCount > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sos-red/10">
            <AlertTriangle className="h-6 w-6 text-sos-red" />
          </div>
          <DialogTitle className="text-center">{t("confirm")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("confirmDesc")}
          </DialogDescription>
        </DialogHeader>

        {isCountdown && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-sos-red text-2xl font-bold text-sos-red">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("countdown", { seconds: countdown })}
            </p>
          </div>
        )}

        {isSending && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sos-red border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {hasSent && (
          <div className="rounded-lg bg-soft-green/20 p-3 text-center text-sm text-foreground">
            {t("sent")}
          </div>
        )}

        <DialogFooter>
          {!isCountdown && !isSending && !lastResult && (
            <>
              <Button variant="outline" onClick={onCancel}>
                {t("cancel")}
              </Button>
              <Button
                className="bg-sos-red text-white hover:bg-sos-red/90"
                onClick={onConfirm}
              >
                {t("confirm")}
              </Button>
            </>
          )}

          {isCountdown && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              {t("cancel")}
            </Button>
          )}

          {(lastResult || error) && !isCountdown && !isSending && (
            <Button variant="outline" onClick={onCancel} className="w-full">
              {t("close")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
