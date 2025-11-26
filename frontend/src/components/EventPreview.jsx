// src/components/calendar/EventPreview.jsx
import React, { useContext } from "react";
import { format } from "date-fns";

import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";

export default function EventPreview({
  event,
  onClose,
  onEdit,
  onDelete,
  onDeleteSelf,
  onInvite,
  onRemoveInviteUser,
  inviteEmail,
  setInviteEmail,
  inviteLoading,
}) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  if (!event) return null;

  const isGuest = Boolean(event.invitedFrom);

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 1100,
      }}
    >
      <div
        style={{
          minWidth: 300,
          maxWidth: 380,
          borderRadius: 18,
          padding: 18,
          background:
            theme.name === "glass"
              ? "rgba(15,23,42,0.95)"
              : theme.cardBg,
          color: theme.text,
          boxShadow: theme.cardShadow,
          border: theme.cardBorder,
          backdropFilter: `blur(${theme.blur})`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {event.title}
          </h4>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: theme.textMuted,
              fontSize: 16,
            }}
          >
            ✖
          </button>
        </div>

        <Row icon="📅" theme={theme}>
          {format(
            event.start ? new Date(event.start) : new Date(),
            "dd.MM.yyyy HH:mm"
          )}
        </Row>

        <Row icon="📂" theme={theme}>
          {event.category}
        </Row>

        {event.invitedFrom && event.creator && (
          <Row icon="📨" theme={theme}>
            {t("preview.invitedBy")}{" "}
            {event.creator.fullName ||
              event.creator.name ||
              event.creator.email}
          </Row>
        )}

        {event.description && (
          <Row icon="📝" theme={theme}>
            {event.description}
          </Row>
        )}

        {(event.invitedUsers?.length > 0 ||
          event.invitedEmails?.length > 0) && (
          <div style={{ marginTop: 10 }}>
            <Row icon="👥" theme={theme}>
              {t("preview.invited")}
            </Row>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginTop: 4,
              }}
            >
              {event.invitedUsers?.map((u, idx) => {
                const name =
                  u.name || u.fullName || u.email || "User";
                const email = u.email || "";
                const initials = name
                  .trim()
                  .split(" ")
                  .map((p) => p[0]?.toUpperCase())
                  .slice(0, 2)
                  .join("");

                return (
                  <div
                    key={u._id || idx}
                    style={invitedChipStyle(theme)}
                  >
                    <div style={avatarStyle(theme)}>
                      {initials || "?"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {name}
                      </div>
                      {email && (
                        <div
                          style={{
                            fontSize: 12,
                            color: theme.textMuted,
                          }}
                        >
                          {email}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveInviteUser(u._id, "user")}
                      style={removeBtnStyle(theme)}
                    >
                      ❌
                    </button>
                  </div>
                );
              })}

              {event.invitedEmails?.map((mail, idx) => (
                <div
                  key={mail + idx}
                  style={invitedChipStyle(theme)}
                >
                  <div style={avatarStyle(theme)}>@</div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {mail}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                      }}
                    >
                      (email)
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveInviteUser(mail, "email")}
                    style={removeBtnStyle(theme)}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {event.category !== "holiday" && event._id && !isGuest && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 8,
              borderTop: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                marginBottom: 4,
                color: theme.textMuted,
              }}
            >
              {t("preview.inviteTitle")}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 4,
              }}
            >
              <input
                type="email"
                placeholder={t("preview.invitePlaceholder")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: 999,
                  border:
                    "1px solid rgba(148,163,184,0.7)",
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 13,
                }}
              />
              <button
                onClick={onInvite}
                disabled={inviteLoading}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "none",
                  background: theme.primary,
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: inviteLoading ? 0.7 : 1,
                }}
              >
                {inviteLoading ? "..." : t("preview.inviteBtn")}
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 14,
            gap: 8,
          }}
        >
          {!isGuest && (
            <>
              <button
                onClick={onEdit}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 12px",
                  background: theme.primarySoft,
                  color: theme.text,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("preview.edit")}
              </button>
              <button
                onClick={onDelete}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 12px",
                  background: theme.danger,
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("preview.delete")}
              </button>
            </>
          )}

          {isGuest && (
            <button
              onClick={onDeleteSelf}
              style={{
                flex: 1,
                borderRadius: 999,
                border: "none",
                padding: "8px 12px",
                background: theme.danger,
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("preview.deleteSelf")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children, theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14,
        marginTop: 4,
        color: theme.text,
      }}
    >
      <span style={{ width: 20, textAlign: "center" }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

const invitedChipStyle = (theme) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 8px",
  borderRadius: 999,
  background:
    theme.name === "glass"
      ? "rgba(15,23,42,0.9)"
      : "rgba(249,250,251,0.98)",
  border: "1px solid rgba(148,163,184,0.6)",
});

const avatarStyle = (theme) => ({
  width: 26,
  height: 26,
  borderRadius: 999,
  background: theme.primarySoft,
  color: theme.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
});

const removeBtnStyle = (theme) => ({
  marginLeft: "auto",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 16,
  color: theme.danger,
});
