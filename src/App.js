import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import {
  MapRoute,
} from "./pages/offerRide";

function App() {
  return (
    <Router>
      <div className="container mw-100 p-0">
        <Switch>
          <Route exact path={["/", "/tutorials"]} component={MapRoute} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
