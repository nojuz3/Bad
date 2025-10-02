import React, { useState, useEffect } from "react";
import axios from "axios";

const Overseer = () => {
  const [tickets, setTickets] = useState([]);
  const [response, setResponse] = useState("");
  const [resolved, setResolved] = useState([]);
  const [pending, setPending] = useState([]);

  const [currentTickets, setCurrentTickets] = useState([tickets]);
  const [current, setCurrent] = useState("all"); // all, pending, resolved

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get("http://localhost:8080/tickets", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const allTickets = res.data.tickets;

        setTickets(allTickets);
        setResolved(allTickets.filter((ticket) => ticket.responded === 1));
        setPending(allTickets.filter((ticket) => ticket.responded === 0));
        setCurrentTickets(allTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };

    fetchTickets();
  }, []);

  const handleResponse = async (idTicket) => {
    if (!response[idTicket] || response[idTicket].trim() === "") return;
    try {
      await axios.post(
        "http://localhost:8080/tickets/respond",
        { idTicket, response: response[idTicket] },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const res = await axios.get("http://localhost:8080/tickets", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const allTickets = res.data.tickets;
      setTickets(allTickets);
      setResolved(allTickets.filter((ticket) => ticket.responded === 1));
      setPending(allTickets.filter((ticket) => ticket.responded === 0));
      setCurrentTickets(allTickets);
    } catch (error) {
      console.error("Error submitting response:", error);
    }
  };
  // setting display based on the button clicked
  const display = (type) => {
    if (type === "all") {
      setCurrent("all");
      setCurrentTickets(tickets);
    }
    if (type === "pending") {
      setCurrent("pending");
      setCurrentTickets(pending);
    }
    if (type === "resolved") {
      setCurrent("resolved");
      setCurrentTickets(resolved);
    }
  };
  return (
    <div>
      {/* Display Buttons */}
      <div class="display-buttons">
        <button onClick={() => display("all")}>
          <h2>All Tickets</h2>
        </button>
        <button onClick={() => display("pending")}>
          <h2>Pending Tickets</h2>
        </button>
        <button onClick={() => display("resolved")}>
          <h2>Resolved Tickets</h2>
        </button>
      </div>

      {currentTickets && currentTickets.length === 0 && (
        <p>No tickets found.</p>
      )}
      <div class="ticket-box">
        {currentTickets &&
          currentTickets.map((ticket, index) => (
            <div className="ticket" key={ticket.idTicket || index}>
              <h3>Title: {ticket.title}</h3>
              <p class="overseer-desc">Description: {ticket.description}</p>
              <p>Submitted by: {ticket.username}</p>
              <p class="overseer-res">
                Response: {ticket.response || "No response yet"}
              </p>
              {!ticket.response && (
                <div>
                  <textarea
                    class="response-input"
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

                  <button
                    class="response-submit"
                    onClick={() => handleResponse(ticket.idTicket)}
                  >
                    Submit Response
                  </button>
                </div>
              )}
              {ticket.rating > 0 ? (
                <p class="rating-o">Your response got {ticket.rating}★</p> // displays rating if above 0
              ) : (
                <p class="rating-o">No rating</p> // displays if 0 or less
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
export default Overseer;
