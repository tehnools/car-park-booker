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
        boxSizing: "border-box",
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
            style={{ width: "100%", padding: "8px 12px", marginTop: 4, boxSizing: "border-box" }}
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
            style={{ width: "100%", padding: "8px 12px", marginTop: 4, boxSizing: "border-box" }}
          />
        </label>
        <label>
          Time:
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            style={{ width: "100%", padding: "8px 12px", marginTop: 4, boxSizing: "border-box" }}
            disabled={!date || isLoading}
          >
            <option value="" disabled>
              {isLoading ? "Loading..." : date ? "Select a time" : "Select a date first"}
            </option>
            {(() => {
              if (!date) {
                return (
                  <option value="" disabled>
                    Select a date first
                  </option>
                );
              }
              const slots = getDefaultTimeSlots(getBookedSlots());
              if (slots.length === 0) {
                return (
                  <option value="" disabled>
                    No available time slots
                  </option>
                );
              }
              return slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ));
            })()}
          </select>
        </label>
        <button type="submit" style={{ padding: 12, fontWeight: "bold" }}>
          Submit
        </button>
      </form>
      <div style={{ minHeight: 24, marginTop: 16, width: "100%", boxSizing: "border-box" }}>
        {message && <p style={{ margin: 0 }}>{message}</p>}
      </div>
    </div>
  );
}

function getDefaultTimeSlots(datesTaken: string[] = []) {
  const slots: string[] = [];
  const tz = "Pacific/Auckland";
  const now = new Date(new Date().toLocaleString("en-NZ", { timeZone: tz }));
  const nowHour = now.getHours();

  for (let hour = 8; hour <= 21; hour++) {
    const h = hour.toString().padStart(2, "0");
    if (hour <= nowHour || datesTaken.includes(`${h}:00`)) continue;
    slots.push(`${h}:00`);
  }
  return slots;
}

export default App;
