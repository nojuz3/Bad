import React, { useState, useEffect } from "react";
import axios from "axios";
import { use } from "react";

const Content = () => {
  const user = localStorage.getItem("token");
  const [res, setRes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [view, setView] = useState("all")
  const [resolved, setResolved] = useState([]);
  const [all , setAll] = useState([]);


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
        setAll(allTickets)
      } catch (err) {}
    };
    fetchData();
  }, []);

  const handlepost = async (e) => {
    e.preventDefault();
    if (title == "" || description == "") {
      alert("Please fill in the title and description");
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
      const updated = await axios.get("http://localhost:8080/tickets", {
        headers: {
          Authorization: `Bearer ${user}`,
        },
      });
      setRes(updated.data);
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

  function swap(spec){
    if(spec == "all"){
      setView("all");
      setRes(all);
    }
    if(spec == "responded"){
      setView("all");
      setRes(resolved);
    }
    if(spec == "request"){
      setView("request");
    }
  }
  return (
    <div class="content">
      <div class="swap-content">
      <button onClick={(e) => swap("all")} class="content-button-nav"><h2>All My Tickets</h2></button>
      <button onClick={(e) => swap("responded")} class="content-button-nav"><h2>Responded Tickets</h2></button>
      <button onClick={(e) => swap("request")} class="content-button-nav"><h2>Send a Request</h2></button>

      </div>
      {view === "all" &&
        <div class="mytickets">
        {res && res.length === 0 && <p>No tickets found.</p>}
        {res &&
          res.map((ticket , index) => (
            <div class="ticket" key={ticket.idTicket || index}>
              <h3>Title: {ticket.title}</h3>
              <p class="content-desc">Decription: {ticket.description}</p>
              <p class="content-response">Response: {ticket.response || "No response yet"}</p>
              {ticket.response && (
                <div class="content-rating">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button class="el-rating"
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
      }
      {view === "request" &&
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
      }
      
    </div>
  );
};

export default Content;
