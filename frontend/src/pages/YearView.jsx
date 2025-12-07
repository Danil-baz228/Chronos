import React from "react";
import { motion } from "framer-motion";

const monthNames = [
  "Січень", "Лютий", "Березень", "Квітень",
  "Травень", "Червень", "Липень", "Серпень",
  "Вересень", "Жовтень", "Листопад", "Грудень"
];

function getMonthMatrix(year, month) {
  let first = new Date(year, month, 1);
  let last = new Date(year, month + 1, 0);

  let matrix = [];
  let row = [];

  for (let i = 0; i < first.getDay(); i++) row.push(null);

  for (let day = 1; day <= last.getDate(); day++) {
    row.push(new Date(year, month, day));
    if (row.length === 7) {
      matrix.push(row);
      row = [];
    }
  }

  if (row.length) {
    while (row.length < 7) row.push(null);
    matrix.push(row);
  }

  return matrix;
}

export default function YearView({ year, events, onSelectDate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 24,
        padding: 10,
      }}
    >
      {monthNames.map((name, month) => {
        const matrix = getMonthMatrix(year, month);

        return (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background: "rgba(255,255,255,0.06)",
              padding: 16,
              borderRadius: 16,
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3 style={{ marginBottom: 8, textAlign: "center" }}>{name}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", fontSize: 12, opacity: 0.7 }}>
              <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span>
              <span>Пт</span><span>Сб</span><span>Нд</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginTop: 6 }}>
              {matrix.map((row, ri) =>
                row.map((date, di) => {
                  if (!date) {
                    return <div key={ri + "-" + di} style={{ height: 28 }} />;
                  }

                  const dayEvents = events.filter(
                    (ev) =>
                      new Date(ev.start || ev.date).toDateString() ===
                      date.toDateString()
                  );

                  return (
                    <div
                      key={ri + "-" + di}
                      onClick={() => onSelectDate(date)}
                      style={{
                        height: 28,
                        textAlign: "center",
                        cursor: "pointer",
                        borderRadius: 6,
                        paddingTop: 4,
                        position: "relative",
                      }}
                    >
                      {date.getDate()}

                      {dayEvents.length > 0 && (
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#3b82f6",
                            position: "absolute",
                            bottom: 4,
                            left: "50%",
                            transform: "translateX(-50%)",
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
