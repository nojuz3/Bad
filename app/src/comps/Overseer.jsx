import React, { useState, useEffect } from "react";
import axios from "axios";

const Overseer = () => {
  const [tickets, setTickets] = useState([]);
  const [response, setResponse] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get("http://localhost:8080/tickets", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTickets(res.data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };

    fetchTickets();
  }, []);

  const handleResponse = async (idTicket) => {
    console.log(
      "Responding to ticket ID:",
      idTicket,
      "with response:",
      response[idTicket]
    );
    setResponse({ ...response, [idTicket]: "" });
    try {
      await axios.post(
        "http://localhost:8080/tickets/respond",
        { idTicket, response: response[idTicket] },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      window.location.reload();
    } catch (error) {
      console.error("Error submitting response:", error);
    }
  };

  return (
    <div>
      <h2>All Tickets</h2>
      {tickets.tickets && tickets.tickets.length === 0 && (
        <p>No tickets found.</p>
      )}
      {tickets.tickets &&
        tickets.tickets.map((ticket) => (
          <div className="ticket" key={ticket.idTicket}>
            <h3>Title: {ticket.title}</h3>
            <p>Description: {ticket.description}</p>
            <p>Submitted by: {ticket.username}</p>
            <p>Response: {ticket.response || "No response yet"}</p>
            {!ticket.response && (
              <div>
                <input
                  type="text"
                  placeholder="Response..."
                  value={response[ticket.idTicket] || ""}
                  onChange={(e) =>
                    setResponse({
                      ...response,
                      [ticket.idTicket]: e.target.value,
                    })
                  }
                />
                <button onClick={() => handleResponse(ticket.idTicket)}>
                  Submit Response
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};
export default Overseer;
