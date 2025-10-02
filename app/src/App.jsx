import { useState, useEffect } from "react";
import "./App.css";

import axios from "axios";
import Login from "./comps/Login";
import Nav from "./comps/Nav";
import Content from "./comps/Content";
import Overseer from "./comps/Overseer";
import Footer from "./comps/Footer";

function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token){
      localStorage.removeItem("token");
      return;
    }

    axios
      .get("http://localhost:8080/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
        }
      })
      .catch((err) =>{
        if (err.response && err.response.status === 401 || err.response.status === 403) {
          localStorage.removeItem("token");
          setUser(null);
        }
      });
  }, []);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  if (!user) {
    return (
      <>
        <div class="inactive">
          <Nav />
        </div>
        <Login />
      </>
    );
  }

  return (
    <>
      <Nav />
      {user.role === "admin" && <Overseer />}
      {user.role === "user" && <Content />}
      <Footer />
    </>
  );
}

export default App;
