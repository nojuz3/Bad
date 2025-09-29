import React, { useState, useEffect } from "react";
import axios from "axios";
import { use } from "react";

const Content = () => {
  const user = localStorage.getItem("token");
  const [res, setRes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:8080/tickets", {
          headers: {
            Authorization: `Bearer ${user}`,
          },
        });
        console.log(res.data);
        setRes(res.data);
      } catch (err) {}
    };
    fetchData();
  }, []);

  const handlepost = async (e) => {
    e.preventDefault();
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
    } catch (error) {
      console.log(error);
    }
    setTitle("");
    setDescription("");
  };

  return (
    <div class="content">
      <div class="mytickets">
        <h2>My Tickets</h2>
        {res.tickets && res.tickets.length === 0 && <p>No tickets found.</p>}
        {res.tickets && res.tickets.map((ticket) => (
          <div class="ticket" key={ticket.idTicket}>
            <h3>Title: {ticket.title}</h3>
            <p>Decription: {ticket.description}</p>
            <p>Response: {ticket.response || "No response yet"}</p>
          </div>
        ))}
      </div>
      <div className="content-container">
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
        <button onClick={handlepost}>Submit</button>
      </div>
    </div>
  );
};

export default Content;
