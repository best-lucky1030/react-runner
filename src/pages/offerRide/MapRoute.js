import React, { useState, useEffect } from "react";
import { useDispatch,
   } from "react-redux";
import {
  createTutorial, deleteAllTutorials,
} from "../../actions/tutorials";
import Map from '../../components/Map.js';
import Tutorial from '../../components/Tutorial.js';

const MapRoute = (props) => {
  const mediaMatch = window.matchMedia('(min-width: 768px)');
  const [matches, setMatches] = useState(mediaMatch.matches);
  const [curRoute, setCurRoute] = React.useState("0");
  const [routes, setRoutes] = React.useState([]);
  const [downloadData, setDownloadData] = React.useState(null);
  const [wayPointNames, setWayPointNames] = React.useState([]);
  const [wayUpdated, setWayUpdated] = useState('');


  useEffect(() => {
    const handler = e => setMatches(e.matches);
    mediaMatch.addListener(handler);
    return () => mediaMatch.removeListener(handler);
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(deleteAllTutorials());
    dispatch(createTutorial('start', 'ChIJqTzBn6xLtUYREuPsfzX-Fks'));
    dispatch(createTutorial('end', 'ChIJxXY4jnlMtUYRbQ_TT0XRQ7s'));
    dispatch(createTutorial('route', 0));
  }, []);

  const btnContinueHandler = () => {
    if (downloadData == null) return;
    console.log(downloadData);
    const url = 'data:text/json;charset=utf-8,' + downloadData.data;
    const link = document.createElement('a');
    link.download = `${downloadData.summary}-${(new Date()).toLocaleString()}.gpx`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="row mw-100 m-0">
      <div className="col-md-6 d-flex p-0">
        <div className="" style={styles.leftContainer(matches)}
        >
          <div>
            <h1 className={""} style={styles.txtTitle(matches)}>Router Builder</h1>

            <div className="" style={styles.hDivider} />
          </div>

          <div className="" style={{flex: "auto"}}>
            <Tutorial
              onWayPointsChange={setWayPointNames}
              curWayPoints={wayPointNames}
              updateWayState={setWayUpdated}
            />
          </div>

          <button
            className="btn btn-sm"
            style={styles.btnContinue(matches)}
            onClick={btnContinueHandler}
          >
            Download your Route
          </button>
        </div>
      </div>
      
      <div className="col-md-6 p-0">
        <Map
          onRouteChange={setRoutes}
          currentRoute={curRoute}
          onWayPointsChange={setWayPointNames}
          curWayPoints={wayPointNames}
          wayUpdated={wayUpdated}
          setDownloadData={setDownloadData}
        />
      </div>
    </div>
  );
};

const styles = {
  leftContainer: isRowBased => ({ 
    backgroundColor: "rgb(42 42 42)", 
    padding: 20,
    width: "100%",
    height: "100%",
    margin: isRowBased ? "auto" : "10vh auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    // borderRadius: "3vw"
  }),
  icSearch: isRowBased => ({ 
    fontSize: isRowBased ? "1vw" : "2vw",
    color: "#707070",
    position: "absolute",
    zIndex: 100,
    top: "50%",
    left: "7%",
    transform: `translate(-50%, -50%)` 
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
  hDivider: {
    width: "100%",
    border: "1px solid rgb(88 88 88)",
    margin: "3vh auto",
    height: "1px",
  },
  radioContainer: {
    margin: '3vw auto',
    maxWidth: '100%',
  },
  btnContinue: isRowBased => ({
    height: "3rem",
    width: "100%",
    color: "#000",
    backgroundColor: "rgb(156 187 17)",
    fontFamily: "Poppins",
    fontSize: "1em",
  }),
  txtTitle: isRowBased => ({
    color: "white",
    fontFamily: "Montserrat",
    borderRadius: "5px",
    fontSize: isRowBased ? "2rem" : "2rem",
    fontWeight: "650",
    letterSpacing: "-0.33px"
  }),
}

export default MapRoute;