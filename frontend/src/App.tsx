import { Slider } from "@mui/material";
import "./App.css";

function App() {
  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <div>
        <Slider defaultValue={30} />
        <Slider
          defaultValue={30}
          className="text-teal-600"
          slotProps={{ thumb: { className: "rounded-sm" } }}
        />
        <div className="text-red-500">Teste</div>
      </div>
    </div>
  );
}

export default App;
