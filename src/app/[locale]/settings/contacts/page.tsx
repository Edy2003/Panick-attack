"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  MessageCircle,
  Send,
  ArrowLeft,
  Link as LinkIcon,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

const DEVICE_TOKEN_KEY = "panic-helper:device-token";

interface Contact {
  name: string;
  telegramUsername?: string;
  telegramChatId?: string;
  whatsappNumber?: string;
  linkToken?: string;
}

function getDeviceToken(): string {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

export default function ContactsPage() {
  const t = useTranslations("settings");
  const locale = useLocale();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const token = getDeviceToken();
      const res = await fetch("/api/contacts", {
        headers: { "X-Device-Token": token },
      });
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    if (!telegramUsername.trim() && !whatsappNumber.trim()) return;

    setSubmitting(true);
    try {
      const token = getDeviceToken();
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": token,
        },
        body: JSON.stringify({
          name: name.trim(),
          telegramUsername: telegramUsername.trim() || undefined,
          whatsappNumber: whatsappNumber.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.telegramLink) {
          setTelegramLink(data.telegramLink);
        }
        setName("");
        setTelegramUsername("");
        setWhatsappNumber("");
        setShowForm(false);
        fetchContacts();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (index: number) => {
    const token = getDeviceToken();
    await fetch(`/api/contacts/${index}`, {
      method: "DELETE",
      headers: { "X-Device-Token": token },
    });
    fetchContacts();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/settings`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">{t("contacts")}</h1>
      </div>

      <p className="text-sm text-muted-foreground">{t("contactsDesc")}</p>

      {/* Telegram link notification */}
      {telegramLink && (
        <Card className="border-calm-blue bg-calm-blue/10 p-4">
          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-calm-blue mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("telegramLinkTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("telegramLinkDesc")}
              </p>
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-calm-blue underline break-all"
              >
                {telegramLink}
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(telegramLink);
                  setTelegramLink(null);
                }}
              >
                {t("copyLink")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Contact list */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">
          {t("loading")}
        </div>
      ) : contacts.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">{t("noContacts")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((contact, i) => (
            <Card key={i} className="flex items-center justify-between p-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{contact.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {contact.telegramUsername && (
                    <span className="flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      @{contact.telegramUsername}
                      {contact.telegramChatId ? (
                        <CheckCircle className="h-3 w-3 text-soft-green" />
                      ) : (
                        <Clock className="h-3 w-3 text-yellow-500" />
                      )}
                    </span>
                  )}
                  {contact.whatsappNumber && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {contact.whatsappNumber}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(i)}
                aria-label={t("deleteContact")}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Add contact form */}
      {showForm ? (
        <Card className="flex flex-col gap-3 p-4">
          <h3 className="font-medium">{t("addContact")}</h3>
          <Input
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("telegramPlaceholder")}
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("whatsappPlaceholder")}
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                submitting ||
                !name.trim() ||
                (!telegramUsername.trim() && !whatsappNumber.trim())
              }
              className="flex-1"
            >
              {submitting ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4" />
          {t("addContact")}
        </Button>
      )}
    </div>
  );
}
