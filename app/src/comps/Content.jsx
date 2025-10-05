import React, { useState, useEffect } from "react";
import axios from "axios";

const Content = () => {
  const user = localStorage.getItem("token");
  const [res, setRes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [view, setView] = useState("all");
  const [resolved, setResolved] = useState([]);
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState("");
  const [editid, setEditid] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:8080/tickets", {
          headers: {
            Authorization: `Bearer ${user}`,
          },
        });
        const allTickets = res.data.tickets;

        setRes(allTickets);
        setResolved(allTickets.filter((ticket) => ticket.responded === 1));
        setAll(allTickets);
      } catch (err) {}
    };
    fetchData();
  }, []);

  const refresh = async () => {
    const updated = await axios.get("http://localhost:8080/tickets", {
      headers: {
        Authorization: `Bearer ${user}`,
      },
    });
    setRes(updated.data.tickets);
    setAll(updated.data.tickets);
    setResolved(
      updated.data.tickets.filter((ticket) => ticket.responded === 1)
    );
  };

  const handlepost = async (e) => {
    e.preventDefault();
    if (title == "" || description == "") {
      alert("Please fill in the title and description");
    }
    if (editid) {
      setEditid(null);
      setView("all");
      await axios.put(
        `http://localhost:8080/tickets/${editid}`,
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${user}`,
          },
        }
      );
      refresh();
      return;
    }
    try {
      await axios.post(
        "http://localhost:8080/tickets",
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${user}`,
          },
        }
      );
      alert("Ticket Created")
      refresh();
    } catch (error) {
      console.log(error);
    }
    setTitle("");
    setDescription("");
  };

  const Handlerating = async (ticketid, newrating) => {
    const ticket = res.find((t) => t.idTicket === ticketid);

    if (!ticket.response) {
      return;
    }

    try {
      await axios.post(
        "http://localhost:8080/rating",
        { ticketid, rating: newrating },
        {
          headers: {
            Authorization: `bearer ${user}`,
          },
        }
      );
      setRes((prev) =>
        prev.map((t) =>
          t.idTicket === ticketid ? { ...t, rating: newrating } : t
        )
      );
    } catch (err) {}
  };

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
            Authorization: `Bearer ${user}`,
          },
        }
      );
      refresh();
    } catch (err) {
      console.log(err);
    }
  };

  function swap(e) {
    if (e === "request") {
      setView("request");
      setSelected("");
      return;
    }

    const value = e.target.value;
    setSelected(value);

    if (value === "all") {
      setView("all");
      setRes(all);
      return;
    }
    if (value === "responded") {
      setView("all");
      setRes(resolved);
      return;
    }
  }
  return (
    <div class="content">
      <div class="swap-content">
        <button onClick={(e) => swap("request")} class="content-button-nav">
          <h2>Send a Request</h2>
        </button>
      </div>
      <select class="content-select" value={selected} onChange={swap}>
        <option>--select--</option>
        <option value="all">All</option>
        <option value="responded">Responded</option>
      </select>

      {view === "all" && (
        <div class="mytickets">
          {res && res.length === 0 && <p>No tickets found.</p>}
          {res &&
            res.map((ticket, index) => (
              <div class="ticket" key={ticket.idTicket || index}>
                {!ticket.response && (
                  <div>
                    <button onClick={() => HandleDelete(ticket.idTicket)}>
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setEditid(ticket.idTicket);
                        setTitle(ticket.title);
                        setDescription(ticket.description);
                        setView("request");
                        setSelected("");
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
                <h3>Title: {ticket.title}</h3>
                <p class="content-desc">Decription: {ticket.description}</p>
                <p class="content-response">
                  Response: {ticket.response || "No response yet"}
                </p>
                {ticket.response && (
                  <div class="content-rating">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        class="el-rating"
                        style={{
                          color: num <= (ticket.rating || 0) ? "gold" : "gray",
                          fontSize: "20px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        key={num}
                        onClick={() => Handlerating(ticket.idTicket, num)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      {view === "request" && (
        <form className="content-container" onSubmit={handlepost}>
          <label for="title">Title:</label>
          <input
            name="title"
            type="text"
            placeholder="Enter the Title..."
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label for="description">Problem Description:</label>
          <textarea
            name="description"
            class="form-textarea"
            placeholder="Describe the problem..."
            rows={10}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Submit</button>
        </form>
      )}
    </div>
  );
};

export default Content;
