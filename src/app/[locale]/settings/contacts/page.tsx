"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Copy, Trash2, Clock, CheckCircle, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import QRCode from "qrcode";
import Link from "next/link";

export default function ContactsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { user, isAuthenticated } = useAuth();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query user's contacts
  const { data, isLoading } = db.useQuery(
    isAuthenticated && user
      ? {
          emergencyContacts: {
            $: { where: { "owner.id": user.id } },
          },
        }
      : { emergencyContacts: {} }
  );

  const contacts = data?.emergencyContacts || [];
  const pendingContacts = contacts.filter((c) => !c.acceptedAt);
  const activeContacts = contacts.filter((c) => c.acceptedAt);

  // Generate invite link
  const generateInvite = async () => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts/invite", {
        method: "POST",
        headers: {
          "X-Instant-User-Id": user.id,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate invite");
      }

      setInviteLink(data.inviteLink);

      // Generate QR code
      const qr = await QRCode.toDataURL(data.inviteLink);
      setQRCode(qr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invite");
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete contact
  const deleteContact = async (contactId: string) => {
    try {
      await db.transact([db.tx.emergencyContacts[contactId].delete()]);
    } catch (err) {
      console.error("Failed to delete contact:", err);
      setError("Failed to delete contact");
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <LogIn className="h-12 w-12 text-primary" />
        <h2 className="text-xl font-semibold">{t("authRequired")}</h2>
        <p className="text-center text-muted-foreground">{t("authRequiredDesc")}</p>
        <Link href={`/${locale}/auth`}>
          <Button>
            <LogIn className="mr-2 h-4 w-4" />
            {tCommon("signIn")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/settings`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">{t("contacts")}</h1>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Generate Invite Button */}
      {!inviteLink && (
        <Button onClick={generateInvite} disabled={isGenerating || contacts.length >= 10} className="w-full">
          <Users className="mr-2 h-4 w-4" />
          {isGenerating ? t("generating") : t("generateInvite")}
        </Button>
      )}

      {contacts.length >= 10 && !inviteLink && (
        <p className="text-center text-sm text-muted-foreground">{t("maxContactsReached")}</p>
      )}

      {/* Invite Link Card */}
      {inviteLink && (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">{t("shareInvite")}</h3>
          <p className="mb-3 text-sm text-muted-foreground">{t("shareInviteDesc")}</p>

          {qrCode && (
            <div className="mb-3 flex justify-center">
              <img src={qrCode} alt="QR Code" className="h-48 w-48 rounded-lg" />
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={inviteLink}
              readOnly
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <Button size="icon" onClick={() => copyToClipboard(inviteLink)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => {
              setInviteLink(null);
              setQRCode(null);
            }}
          >
            {tCommon("close")}
          </Button>
        </Card>
      )}

      {/* Pending Invites */}
      {pendingContacts.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">{t("pendingInvites")}</h3>
          {pendingContacts.map((contact) => (
            <Card key={contact.id} className="mb-2 flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{t("waitingForAcceptance")}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm(t("confirmDelete"))) {
                    deleteContact(contact.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Active Contacts */}
      {activeContacts.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">{t("activeContacts")}</h3>
          {activeContacts.map((contact) => (
            <Card key={contact.id} className="mb-2 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{contact.displayName}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {contact.telegramChatType === "private" ? t("private") : t("group")}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(t("confirmDelete"))) {
                      deleteContact(contact.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeContacts.length === 0 && pendingContacts.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">{t("noContacts")}</div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-8 text-center text-muted-foreground">{tCommon("loading")}</div>
      )}
    </div>
  );
}
