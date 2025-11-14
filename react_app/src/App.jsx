import React from "react";
import Routes from "./Routes";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/next"

function App() {
  return (
    <Analytics>
      <SpeedInsights>
        <Routes />
      </SpeedInsights>
    </Analytics>
  );
}

export default App;