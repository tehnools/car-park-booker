import { useState } from "react";
import useSWR, { mutate } from "swr";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");

  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const month = date ? date.slice(0, 7) : "";

  const { data: bookings, isLoading } = useSWR<
    {
      id: number;
      name: string;
      booking_date: string;
    }[]
  >(date ? `/bookings?month=${month}` : null, fetcher, {
    refreshInterval: 10000,
  });

  const getBookedSlots = () => {
    if (!date) return [];
    return (bookings || [])
      .filter((b) => {
        const [bookedDate] = b.booking_date.split(" ");
        return bookedDate === date;
      })
      .map((b) => {
        const parts = b.booking_date.split(" ");
        return parts[1] || "";
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !time) {
      setMessage("Please fill in all fields.");
      return;
    }
    const res = await fetch("/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date, time }),
    });
    if (res.ok) {
      setMessage("Booking successful!");
      setName("");
      setDate("");
      setTime("");
    } else {
      const data = await res.json();
      setMessage(data.error || "Booking failed.");
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h2>Book a Parking Lot</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              // Refetch bookings for new date
              const month = e.target.value ? e.target.value.slice(0, 7) : "";
              if (month) mutate(`/bookings?month=${month}`);
            }}
            required
            min={new Date().toISOString().slice(0, 10)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          Time:
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            disabled={!date || isLoading}
          >
            <option value="" disabled>
              {isLoading ? "Loading..." : date ? "Select a time" : "Select a date first"}
            </option>
            {(() => {
              // Helper to safely construct a Date in NZ time
              function safeGetNZDate(dateStr: string, timeStr: string) {
                if (!dateStr || !/^[\d]{2}:[\d]{2}$/.test(timeStr)) return null;
                const tz = "Pacific/Auckland";
                try {
                  const d = new Date(
                    new Date(`${dateStr}T${timeStr}:00`).toLocaleString("en-GB", { timeZone: tz })
                  );
                  if (isNaN(d.getTime())) return null;
                  return d;
                } catch {
                  return null;
                }
              }

              function isNZToday(selected: string) {
                if (!selected || !/^[\d]{4}-[\d]{2}-[\d]{2}$/.test(selected)) return false;
                const tz = "Pacific/Auckland";
                let nowNZ: Date;
                try {
                  nowNZ = new Date(new Date().toLocaleString("en-CA", { timeZone: tz }));
                  if (isNaN(nowNZ.getTime())) return false;
                } catch {
                  return false;
                }
                let todayNZ = "";
                try {
                  todayNZ = nowNZ.toISOString().slice(0, 10);
                } catch {
                  return false;
                }
                return selected === todayNZ;
              }

              const isToday = isNZToday(date);
              const slots = getDefaultTimeSlots(isToday, getBookedSlots()).filter((slot) => {
                if (!date) return false;
                if (isToday) {
                  const d = safeGetNZDate(date, slot);
                  return !!d;
                } else {
                  return true;
                }
              });
              if (!date) {
                return (
                  <option value="" disabled>
                    Select a date first
                  </option>
                );
              }
              if (slots.length === 0) {
                return (
                  <option value="" disabled>
                    No available time slots
                  </option>
                );
              }
              const bookedSlots = getBookedSlots();
              let currentHour = 0;
              if (isToday) {
                const tz = "Pacific/Auckland";
                const nowNZ = new Date(new Date().toLocaleString("en-NZ", { timeZone: tz }));
                currentHour = nowNZ.getHours();
              }
              return slots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const hour = parseInt(slot.slice(0, 2), 10);
                const isPast = isToday && hour <= currentHour;
                return (
                  <option
                    key={slot}
                    value={slot}
                    disabled={isBooked || isPast}
                    style={isBooked || isPast ? { color: "#aaa" } : {}}
                  >
                    {slot} {isBooked ? "(Booked)" : isPast ? "(Past)" : ""}
                  </option>
                );
              });
            })()}
          </select>
        </label>
        <button type="submit" style={{ padding: 12, fontWeight: "bold" }}>
          Submit
        </button>
      </form>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}

// Fallback: generate all 1-hour slots from 8am to 6pm as "HH:mm" strings
function getDefaultTimeSlots(isToday: boolean, datesTaken: string[] = []) {
  const slots: string[] = [];
  const tz = "Pacific/Auckland";
  let nowHour = 0;
  if (isToday) {
    const now = new Date(new Date().toLocaleString("en-NZ", { timeZone: tz }));
    nowHour = now.getHours();
  }
  for (let hour = 8; hour <= 21; hour++) {
    const h = hour.toString().padStart(2, "0");
    if (isToday && (hour <= nowHour || datesTaken.includes(`${h}:00`))) continue;
    slots.push(`${h}:00`);
  }
  return slots;
}

export default App;
