import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [cauldrons, setCauldrons] = useState([]);

  useEffect(() => {
    async function getCauldrons() {
      const apiUrl = "http://localhost:8000/api/cauldrons";
      console.log("Attempting to fetch cauldrons from API...");

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        console.log("Successfully fetched data:");
        console.log(data);

        setCauldrons(data);
      } catch (error) {
        console.error("Error fetching cauldron data:", error);
      }
    }

    getCauldrons();
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      {/* You can now use your data! 
          This will show how many cauldrons you fetched. */}
      <h2>Fetched {cauldrons.length} cauldrons.</h2>
    </>
  );
}

export default App;
