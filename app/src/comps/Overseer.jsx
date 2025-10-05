import React, { useState, useEffect } from "react";
import axios from "axios";

const Overseer = () => {
  const [tickets, setTickets] = useState([]);
  const [response, setResponse] = useState("");
  const [currentTickets, setCurrentTickets] = useState([tickets]);
  const [users, setUsers] = useState([]);
  const [cuser, setCuser] = useState("");
  const [selected, setSelected] = useState("");
  const [view, setView] = useState("ticket"); // ticket, dash
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get("http://localhost:8080/tickets", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const allTickets = res.data.tickets;
        setTickets(allTickets);
        setCurrentTickets(allTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:8080/user", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchTickets();
    fetchUsers();
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
      setCurrentTickets(allTickets);
    } catch (error) {
      console.error("Error submitting response:", error);
    }
  };
  // filter for selecting user + the type of ticket
  function filter(id, status) {
    let filtered = tickets;
    // if it exists and is not all
    if (id && id !== "all") {
      filtered = filtered.filter((ex) => ex.user_id === parseInt(id));
    }
    if (status && status !== "all") {
      if (status === "pending") {
        filtered = filtered.filter((s) => s.responded === 0);
      }
      if (status === "resolved") {
        filtered = filtered.filter((s) => s.responded === 1);
      }
    }
    return filtered;
  }

  // delete button function
  const HandleDelete = async (ticketid) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this ticket?"
    );
    if (!confirmed) return;
    try {
      await axios.post(
        "http://localhost:8080/delete",
        { ticketid },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // take the state of tickets updates and removes the ticket that got deleted
      setTickets((prevTickets) =>
        prevTickets.filter((ticket) => ticket.idTicket !== ticketid)
      );
      // take the state of tickets updates and removes it from the current tickets
      setCurrentTickets((prevCurrent) =>
        prevCurrent.filter((ticket) => ticket.idTicket !== ticketid)
      );
    } catch (err) {
      console.log(err);
    }
  };
  const handleRoleChange = async (userid, newrole) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userid ? { ...user, role: newrole } : user
      )
    );
    try {
      const res = await axios.post(
        "http://localhost:8080/updateRole",
        { id: userid, role: newrole },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
    } catch (err) {
      console.log(err);
    }
  };
  function swap() {
    if (view == "ticket") {
      setView("dash");
    } else if (view == "dash") {
      setView("ticket");
    }
  }
  return (
    <div>
      <div class="select-overseer">
        <button onClick={() => swap()}>
          {view === "ticket" ? "DashBoard" : "Ticket"}
        </button>
        {view === "ticket" && (
          <div class="select-overseer">
            <select
              value={cuser}
              onChange={(e) => {
                const value = e.target.value;
                setCuser(value);
                setCurrentTickets(filter(value, selected));
              }}
            >
              <option value="">--User--</option>
              <option value="all">All Users</option>
              {users.map((users) => (
                <option key={users.id} value={users.id}>
                  {users.username}
                </option>
              ))}
            </select>
            <select
              value={selected}
              onChange={(e) => {
                const value = e.target.value;
                setSelected(value);
                setCurrentTickets(filter(cuser, value));
              }}
            >
              <option>--Sort--</option>
              <option value="all">All Tickets</option>
              <option value="pending">Pending Tickets</option>
              <option value="resolved">Resolved Tickets</option>
            </select>
          </div>
        )}
      </div>
      {view === "dash" && (
        <div class="user-container">
          {users &&
            users.map((user, index) => (
              <div key={user.userid || index} class="users">
                <p>
                  <strong>User: {user.username}</strong>
                </p>
                <p>Email: {user.email}</p>
                <label>Role:</label>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
        </div>
      )}
      {currentTickets && currentTickets.length === 0 && (
        <p>No tickets found.</p>
      )}
      {view == "ticket" && (
        <div class="ticket-box">
          {currentTickets &&
            currentTickets.map((ticket, index) => (
              <div className="ticket" key={ticket.idTicket || index}>
                <button
                  class="button-delete-overseer"
                  onClick={() => HandleDelete(ticket.idTicket)}
                >
                  Delete
                </button>
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
      )}
    </div>
  );
};
export default Overseer;
