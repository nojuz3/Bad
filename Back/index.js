require("dotenv").config();
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const db = new Database(process.env.DB_PATH || "database.db");
const cors = require("cors");
app.use(express.json());

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || JSW;

// Create Table of users
db.prepare(
  `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`
).run();

// Create Table of tickets

db.prepare(
  `
  Create TABLE IF NOT EXISTS tickets (
    idTicket INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER NOT NULL,
    response TEXT,
    responded INTEGER NOT NULL,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
    )`
).run();

// creates a default admin
(async () => {
  const userExists = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get("admin");

  if (!userExists) {
    const adminpass = await bcrypt.hash("admin123", 10);
    db.prepare(
      "INSERT INTO users (username,email ,password, role) VALUES (?, ?, ?, ?)"
    ).run("admin", "admin@mail.com", adminpass, "admin");
  }
})();

const users = db.prepare("SELECT id, username, email, role FROM users").all();
console.log(users);

const corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));

app.get("/api", (req, res) => {
  res.json({ users });
});

app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields (username, email, password) are required.",
    });
  }

  try {
    const existinguser = db
      .prepare("SELECT * FROM users WHERE  username = ? OR email = ?")
      .get(username, email);
    if (existinguser) {
      return res
        .status(400)
        .json({ success: false, message: "The email exists" });
    }

    const hashPassword = await bcrypt.hash(req.body.password, 10);
    db.prepare(
      "INSERT INTO users (username, email, password, role) VALUES (?, ? , ?, ?)"
    ).run(username, email, hashPassword, role);

    res.json({ success: true, message: "User created!" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const userRow = db
    .prepare(
      "SELECT id, username, password, role FROM users WHERE username = ?"
    )
    .get(username);

  if (!userRow) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const passwordMatch = await bcrypt.compare(password, userRow.password);
  if (!passwordMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }
  const token = jwt.sign({ id: userRow.id, role: userRow.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ success: true, token });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get("/me", authenticateToken, (req, res) => {
  const user = db
    .prepare("SELECT id, username, role FROM users WHERE id = ?")
    .get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json({ success: true, user });
});

// ticket creation

app.post("/tickets", authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (title == "" || description == "") return;

  db.prepare(
    "INSERT INTO tickets (title, description, rating, responded, user_id) VALUES (?, ?, ?, ?, ?)"
  ).run(title, description, 0, 0, req.user.id);

  res.json({ success: true, message: "Ticket created!" });
});

app.get("/tickets", authenticateToken, (req, res) => {
  let tickets;

  if (req.user.role === "admin") {
    tickets = db
      .prepare(
        "SELECT idTicket, title, description, responded,rating, response, username, user_id FROM tickets JOIN users ON tickets.user_id = users.id"
      )
      .all();
  } else {
    tickets = db
      .prepare(
        "SELECT idTicket, title, description, responded, response,rating, username FROM tickets JOIN users ON tickets.user_id = users.id WHERE user_id = ?"
      )
      .all(req.user.id);
  }

  res.json({ success: true, tickets });
});
// ticket edit

app.put("/tickets/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json({ success: false, message: "title and desc required" });
  }
  const ticket = db.prepare("SELECT * FROM tickets WHERE idTicket = ?").get(id);

  if (!ticket) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found" });
  }
  if (ticket.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }
  try {
    db.prepare(
      "UPDATE tickets SET title = ?, description = ? WHERE idTicket = ?"
    ).run(title, description, id);
    res.json({ success: true, message: "update complete" });
  } catch (err) {
    console.error(err);
  }
});

// handle response by admin

app.post("/tickets/respond", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied." });
  }

  const { idTicket, response } = req.body;
  if (response == "" || response == null || response == undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Response cannot be empty." });
  }
  try {
    db.prepare(
      "UPDATE tickets SET responded = 1, response = ? WHERE idTicket = ?"
    ).run(response, idTicket);

    res.json({ success: true, message: "Response submitted successfully." });
  } catch (error) {
    console.error("Error submitting response:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});
// users
app.get("/user", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const users = db.prepare("SELECT id, username ,email, role FROM users WHERE NOT username = 'admin'").all();
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// role

app.post("/updateRole", authenticateToken, (req,res) =>{
  if (req.user.role !== "admin"){
    return res.status(403).json({success: false, message: "Access denied"})
  }
  const {id, role} = req.body;
  if (!id || !role){return;}
  try{
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role,id)
  }catch(err){
    return res.status(500).json({success: false, message: "Internal server error"})
  }
})

// handle rating

app.post("/rating", authenticateToken, (req, res) => {
  const { ticketid, rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ success: false, message: "Rating must be between 1 and 5." });
  }

  try {
    db.prepare("UPDATE tickets SET rating = ? WHERE idTicket = ?").run(
      rating,
      ticketid
    );
    res.json({ success: true, message: "Rating updated." });
  } catch (err) {
    console.error("Error submitting response:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/delete", authenticateToken, (req, res) => {
  const { ticketid } = req.body;
  check = db
    .prepare("SELECT idTicket, responded FROM tickets WHERE idTIcket = ? ")
    .get(ticketid);

  if (!check) {
    return res.status(404).json({ message: "Ticket not found." });
  }
  if (check === 1) {
    return res
      .status(400)
      .json({ message: "Cannot delete a ticket that has been responded to." });
  }
  db.prepare("DELETE FROM tickets WHERE idTicket = ?").run(ticketid);
  return res.json({ message: "ticket was deleted" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// testing: reset the users table

// db.prepare("DELETE FROM users").run();
// db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();

// db.prepare("DELETE FROM tickets").run();
// db.prepare("DELETE FROM sqlite_sequence WHERE name = 'tickets'").run();

// db.prepare('DROP TABLE IF EXISTS tickets').run();
// db.prepare('DROP TABLE IF EXISTS users').run();
