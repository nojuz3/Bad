import { useState, useEffect } from "react";
import axios from "axios";

function Login() {
  const [data, setdata] = useState("");
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Register
  const [loggedin, setLoggedin] = useState(false); // true = logged in, false = not logged in
  const [loading, setLoading] = useState(true);


  const fetchApi = async () => {
    const res = await axios.get("http://localhost:8080/api");
    setdata(res.data);
    console.log(res.data);
  };

  // Run on load
  useEffect(() => {
    setTimeout(() => {
      if (localStorage.getItem("token")) {
        setLoggedin(true);
      }
      setLoading(false);
    }, 100);

    fetchApi();
  }, []);

  // handle button login and register
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Login
        const res = await axios.post("http://localhost:8080/login", {
          username,
          password,
        });
        setToken(res.data.token);
        //
        console.log(res.data);
        if (res.data.success) {
          localStorage.setItem("token", res.data.token); // save JWT
          setLoggedin(true);
          window.location.reload();
        }
        //
      } else {
        // Register
        await axios.post("http://localhost:8080/register", {
          username,
          password,
          role: "user",
        });
        window.location.reload();
      }
    } catch (error) {
      console.error(`${isLogin ? "Login" : "Register"} failed:`, error);
    }
    setUsername("");
    setPassword("");
  };
  if (loading || loggedin) {
    return null;
  }
  return (
    <div className="login-container">
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button class="login-button" onClick={handleSubmit}>{isLogin ? "Login" : "Register"}</button>
      <p>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{
            background: "none",
            border: "none",
            color: "blue",
            cursor: "pointer",
          }}
        >
          {isLogin ? "Register" : "Login"}
        </button>
      </p>
    </div>
  );
}

export default Login;
