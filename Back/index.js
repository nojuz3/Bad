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
const JWT_SECRET = process.env.JWT_SECRET || "JSW";

// Create Table of users
db.prepare(
  `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
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
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    ).run("admin", adminpass, "admin");
  }
})();

const users = db.prepare("SELECT id, username, role FROM users").all();
console.log(users);

const corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));

app.get("/api", (req, res) => {
  res.json({ users });
});

app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashPassword = await bcrypt.hash(req.body.password, 10);

    db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    ).run(username, hashPassword, role);

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
  if( title == "" || description == "") return;

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
        "SELECT idTicket, title, description, responded,rating, response, username FROM tickets JOIN users ON tickets.user_id = users.id"
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

// handle response by admin

app.post("/tickets/respond", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Admins only." });
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// testing: reset the users table

// db.prepare("DELETE FROM users").run();
// db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();

// db.prepare("DELETE FROM tickets").run();
// db.prepare("DELETE FROM sqlite_sequence WHERE name = 'tickets'").run();

// db.prepare('DROP TABLE IF EXISTS tickets').run();
