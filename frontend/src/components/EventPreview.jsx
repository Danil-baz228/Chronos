import React, { useContext, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import { BASE_URL } from "../config";
import { useLocation } from "react-router-dom";

function toLocalView(dateString) {
  if (!dateString) return new Date();
  return new Date(dateString);
}

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
  canManage,
}) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const location = useLocation();
  const cardRef = useRef(null);

  // 🟦 Хуки ВСЕГДА ДОЛЖНЫ БЫТЬ ВЫШЕ ЛЮБЫХ return
  useEffect(() => {
    function handleClick(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // закрывать при смене страницы
  useEffect(() => {
    onClose();
  }, [location.key, onClose]);

  // закрывать при обновлении календаря
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("calendar_changed", handler);
    return () => window.removeEventListener("calendar_changed", handler);
  }, [onClose]);

  // 🟥 ВАЖНО: теперь return стоит ПОСЛЕ ВСЕХ useEffect
  if (!event) return null;

  const isHoliday = event.category === "holiday";
  const isGuest = Boolean(event.invitedFrom);
  const canGuestLeave = isGuest && !canManage;

  const rawDate = event.start || event.date;
  const localDate = toLocalView(rawDate);

  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1099,
          background: "transparent",
        }}
      />

      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 1100,
        }}
      >
        <div
          ref={cardRef}
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
          {/* header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
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
            {format(localDate, "dd.MM.yyyy HH:mm")}
          </Row>

          <Row icon="📂" theme={theme}>
            {event.category}
          </Row>

          {event.description && (
            <Row icon="📝" theme={theme}>
              {event.description}
            </Row>
          )}

          {/* invited users */}
          {!isHoliday &&
            (event.invitedUsers?.length > 0 ||
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
                  {event.invitedUsers?.map((u) => {
                    const displayName =
                      u.username ||
                      u.fullName ||
                      u.email?.split("@")[0] ||
                      "User";

                    const initials = displayName.charAt(0).toUpperCase();

                    return (
                      <div key={u._id} style={invitedChipStyle(theme)}>
                        <div
                          style={{
                            ...avatarStyle(theme),
                            overflow: "hidden",
                          }}
                        >
                          {u.avatar ? (
                            <img
                              src={`${BASE_URL}${u.avatar}`}
                              alt="avatar"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            initials
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {displayName}
                          </div>

                          {u.email && (
                            <div
                              style={{
                                fontSize: 12,
                                color: theme.textMuted,
                              }}
                            >
                              {u.email}
                            </div>
                          )}
                        </div>

                        {canManage && (
                          <button
                            onClick={() =>
                              onRemoveInviteUser(u._id, "user")
                            }
                            style={removeBtnStyle(theme)}
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {event.invitedEmails?.map((mail, idx) => (
                    <div key={idx} style={invitedChipStyle(theme)}>
                      <div style={avatarStyle(theme)}>@</div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {mail}
                        </div>
                        <div style={{ fontSize: 12, color: theme.textMuted }}>
                          (email)
                        </div>
                      </div>

                      {canManage && (
                        <button
                          onClick={() =>
                            onRemoveInviteUser(mail, "email")
                          }
                          style={removeBtnStyle(theme)}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* invite input */}
          {!isHoliday && !isGuest && canManage && (
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

              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="email"
                  placeholder={t("preview.invitePlaceholder")}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.7)",
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
                    color: "#fff",
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

          {/* buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 14,
              gap: 8,
            }}
          >
            {!isHoliday && !isGuest && canManage && (
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
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  {t("preview.delete")}
                </button>
              </>
            )}

            {canGuestLeave && (
              <button
                onClick={onDeleteSelf}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 12px",
                  background: theme.danger,
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                {t("preview.deleteSelf")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
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
  padding: "6px 10px",
  borderRadius: 12,
  background:
    theme.name === "glass"
      ? "rgba(15,23,42,0.9)"
      : "rgba(249,250,251,0.96)",
  border: "1px solid rgba(148,163,184,0.5)",
});

const avatarStyle = (theme) => ({
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: theme.primarySoft,
  color: theme.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
});

const removeBtnStyle = (theme) => ({
  marginLeft: "auto",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 18,
  color: theme.danger,
});
