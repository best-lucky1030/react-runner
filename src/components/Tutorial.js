import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateTutorial, deleteTutorial } from "../actions/tutorials";

const Tutorial = (props) => {
  const mediaMatch = window.matchMedia('(min-width: 768px)');
  const [matches, setMatches] = useState(mediaMatch.matches);
  const [wayPoints, setWayPoints] = useState([
    { location: "Kolomenskoye, Andropova Avenue, Moscow, Russia", place_id: "ChIJ8R9Prla0SkERjbavViSc0Wg"},
    { location: "Beklemischew-Turm, Moscow", place_id: "ChIJWRfZtFdKtUYRZ6QwbueyiIQ"},
    { location: "Danilovsky Market, Mytnaya Ulitsa, Moscow, Russia", place_id: "ChIJVSw1SUBLtUYRuguJQx04lbQ"},
    { location: "Sperlingsberge, Ulitsa Kosygina, Moscow, Russia", place_id: "ChIJxXY4jnlMtUYRbQ_TT0XRQ7s"},
    { location: "Christ-Erlöser-Kathedrale, Ulitsa Volkhonka, Moscow, Russia", place_id: "ChIJqTzBn6xLtUYREuPsfzX-Fks"},
    { location: "Donskoy Monastery, Ulitsa Donskaya, Moscow, Russia", place_id: "ChIJyRiuZm5LtUYRS1TAi27x2nU"},
    { location: "Sovetskiy, Leningradsky Avenue, Moscow, Russia", place_id: "ChIJ7V0AV4tJtUYR2SeywY96c8o"},
  ]);
  const [_, forceUpdate] = useState('');

  useEffect(() => {
    const handler = e => setMatches(e.matches);
    mediaMatch.addListener(handler);
    return () => mediaMatch.removeListener(handler);
  });

  useEffect(() => {
    if (props.curWayPoints.length == 0) {
      props.onWayPointsChange(wayPoints);
      props.updateWayState((new Date()).toString());
    }
  }, []);

  const handleDragStart = (ev) => {
    ev.dataTransfer.setData('index', ev.target.id)
  }

  const handleDrop = (ev) => {
    ev.preventDefault();
    const srcIdx = ev.dataTransfer.getData('index');
    const dstIdx = ev.target.id;
    if (srcIdx == dstIdx) return;
    const bufPoints = Object.assign(wayPoints);
    console.log(`Drop ${srcIdx} on ${dstIdx}: count is ${bufPoints.length}`);
    if (bufPoints.length <= srcIdx || bufPoints.length <= dstIdx) return;
    const dst = bufPoints[dstIdx];
    bufPoints[dstIdx] = bufPoints[srcIdx];
    bufPoints[srcIdx] = dst;
    setWayPoints(bufPoints);
    props.onWayPointsChange(bufPoints);
    forceUpdate((new Date()).toString());
    props.updateWayState((new Date()).toString());
  }

  const handleDelete = (idx) => {
    if (idx >= wayPoints.length) return;
    const bufPoints = Object.assign(wayPoints);
    bufPoints.splice(idx, 1);
    setWayPoints(bufPoints);
    props.onWayPointsChange(bufPoints);
    forceUpdate((new Date()).toString());
    props.updateWayState((new Date()).toString());
  }

  return (
    <div>
      {
        wayPoints.length > 0 ?
        wayPoints.map((item, idx) => 
          <div key={idx} className="d-flex justify-content-between align-items-center" style={styles.wayPointItem}>
            <span
              id={idx}
              className="material-icons"
              style={styles.icMover(matches)}
              draggable={true}
              onDragOver={(ev) => {ev.preventDefault()}}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            >list</span>
            <p className="d-flex align-items-center" style={{flex: 'auto', margin: '0 1rem'}}>{item.location}</p>
            <span className="material-icons" style={styles.icDelete(matches)} onClick={() => handleDelete(idx)}>delete</span>
          </div>
        ) : <></>
      }
    </div>
  );
};

const styles = {
  icMover: isRowBased => ({ 
    fontSize: isRowBased ? "2rem" : "2rem",
    cursor: "move",
    color: "#707070",
  }),
  icDelete: isRowBased => ({ 
    fontSize: isRowBased ? "1.5rem" : "1.5rem",
    color: "#707070",
    cursor: "pointer",
  }),
  inputSearch: isRowBased => ({
    backgroundColor: "#F2F2F2",
    border: "none",
    height: "4vh",
    fontSize: isRowBased ? "1vw" : "2vw",
    padding: 0,
    borderRadius: "2em",
    paddingLeft: "3em",
  }),
  wayPointItem: {
    color: 'white',
    fontSize: '1rem',
    fontFamily: "Montserrat",
    letterSpacing: "-0.33px",
    margin: "8px 0",
    // height: 70,
  },
}

export default Tutorial;
