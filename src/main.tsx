import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import "./styles.css";
import { isWeb } from "./utils";

function main() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (isWeb()) {
  navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      if (registration) {
        registration.update();
      } else {
        navigator.serviceWorker.register("sw.js");
      }
    })
    .finally(main);
} else {
  main();
}
