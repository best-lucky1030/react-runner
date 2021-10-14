import { functions, isEqual, omit } from 'lodash'
import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from "react-redux";
import { googleAPIKey } from '../http-common'
import { buildGPX, GarminBuilder } from 'gpx-builder';
import {
  updateTutorialsByTitle,
} from "../actions/tutorials";

let directionsRenderer = null;
let directionsService = null;
const { Point } = GarminBuilder.MODELS;

function Map({ onRouteChange = null, currentRoute = null, setDownloadData, onWayPointsChange, curWayPoints, wayUpdated, options, onMount, className, onMountProps }) {
  const ref = useRef()
  const [map, setMap] = useState()
  const mediaMatch = window.matchMedia('(min-width: 768px)');
  const [matches, setMatches] = useState(mediaMatch.matches);
  const [originPlace, setOriginPlace] = useState(null);
  const [targetPlace, setTargetPlace] = useState(null);
  const [wayPointNames, setWayPointNames] = useState([]);
  const [rerenderNeed, setRerenderNeed] = useState('');
  const [routeIdx, setRouteIdx] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    const handler = e => setMatches(e.matches);
    mediaMatch.addListener(handler);
    return () => mediaMatch.removeListener(handler);
  });

  const tutorials = useSelector(state => state.tutorials);
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('way:');
    console.log(curWayPoints);
    setWayPointNames(curWayPoints);
    setRerenderNeed((new Date()).toString());
  }, [wayUpdated]);

  useEffect(() => {
    if(!directionsRenderer || !directionsService) return;
    calculateAndDisplayRoute(directionsService, directionsRenderer);
  }, [rerenderNeed]);

  useEffect(() => {
    tutorials.map((item, index) => {
      if (item.title==="start") setOriginPlace(item.description);
      if (item.title==="end") setTargetPlace(item.description);
      if (item.title==="route") setRouteIdx(item.description);
      return 0;
    });
  });

  useEffect(() => {
    if(!originPlace || !targetPlace) return;
    if(!directionsRenderer || !directionsService) return;
    calculateAndDisplayRoute(directionsService, directionsRenderer);
  }, [originPlace, targetPlace, loaded]);

  useEffect(() => {
    if (loaded) return;
    if(directionsRenderer && directionsService) setLoaded(true);
  }, [directionsService, directionsRenderer]);

  useEffect(() => {
    if (!calculated || !loaded) return;
    if (routeIdx === 0) return;
    directionsRenderer.setRouteIndex(routeIdx - 1);
  }, [calculated, routeIdx]);

  useEffect(() => {
    if (currentRoute===null) return;
    const curIdx = parseInt(currentRoute);
    if (curIdx === NaN) return;
    setRouteIdx(curIdx+1);
  }, [currentRoute]);

  function calculateAndDisplayRoute(directionsService, directionsRenderer) {
    // const selectedMode = document.getElementById("mode").value;
    if (wayPointNames.length == 0) return;
    const orgPlace = wayPointNames[0]["place_id"];
    const dstPlace = wayPointNames.length < 2 ? wayPointNames[0].place_id : wayPointNames[wayPointNames.length - 1].place_id;
    const wayPoints = [];
    if (wayPointNames.length >= 3) {
      for ( let idx in wayPointNames) {
        if (idx != 0 && idx != wayPointNames.length -1 ) wayPoints.push({location: wayPointNames[idx].location});
      }
    }
    console.log(wayPoints);
    directionsService.route(
      {
        origin: { 
            placeId: orgPlace
        },
        destination: { 
            placeId: dstPlace,
         },
        waypoints: wayPoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        // provideRouteAlternatives : true,
      },
      (response, status) => {
        if (status === "OK") {
            console.log(response);
            directionsRenderer.setDirections(response);
            if (response.routes.length > 0) {
              // $("#route-selector").html('');
              if (onRouteChange !== null) {
                let routeList = [];
                
                for (var i = 0, len = response.routes.length; i < len; i++) {
                  routeList = [...routeList, ...response.routes[i].overview_path];
                }
                
                const points = [];
                for (let data of routeList) {
                  const pt = new Point(data.lat, data.lng, {
                      ele: 0,
                      time: new Date(),
                  })
                  points.push(pt);
                }
                
                const gpxData = new GarminBuilder();
                
                gpxData.setSegmentPoints(points);
                
                setDownloadData({
                  summary: response.routes[0].summary,
                  data: buildGPX(gpxData.toObject()),
                });

                onRouteChange(routeList);
              // $('body').on('click', '.list-group-item', function() {
              //     var idx = $(this).data('index');
              //     $('.list-group-item').removeClass('active');
              //     $('input[type=radio]').attr("checked", false);
              //     $(this).addClass('active');
              //     $(this).find('input').first().attr("checked", true);
              //     directionsRenderer.setRouteIndex(idx);
              //     dispatch(updateTutorialsByTitle('route', idx));
              // })
              }
            }
            if(!calculated) setCalculated(true);
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );
  }

  useEffect(() => {
    // The Google Maps API modifies the options object passed to
    // the Map constructor in place by adding a mapTypeId with default
    // value 'roadmap'. { ...options } prevents this by creating a copy.
    const onLoad = () => {
      directionsService = new window.google.maps.DirectionsService();
      const map = new window.google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: { lat: 41.85, lng: -87.65 },
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });
      directionsRenderer = new window.google.maps.DirectionsRenderer({
        draggable: true,
        map
      });
      setMap(map);

      const onStartChangeHandler = function (event) {
        dispatch(updateTutorialsByTitle('start', event.target.value));
        setOriginPlace(event.target.value);
      };
      const onEndChangeHandler = function (event) {
        dispatch(updateTutorialsByTitle('end', event.target.value))
        setTargetPlace(event.target.value);
      };
      const startPlace=document.getElementById("start");
      const endPlace=document.getElementById("end");
      if(startPlace) startPlace.addEventListener("change", onStartChangeHandler);
      if(endPlace) endPlace.addEventListener("change", onEndChangeHandler);
    }
    if (!window.google) {
      const script = document.createElement(`script`)
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=` +
        googleAPIKey
        //+ '&callback=initAutocomplete&libraries=places&v=weekly'
      document.head.append(script)
      script.addEventListener(`load`, onLoad)
      return () => script.removeEventListener(`load`, onLoad)
    } else onLoad()
  }, [options])

  if (map && typeof onMount === `function`) onMount(map, onMountProps)

  return (
    <div id="map"
      style={styles.mapDiv(matches)}
      {...{ ref, className }}
    />
  )
}

function shouldNotUpdate(props, nextProps) {
  const [funcs, nextFuncs] = [functions(props), functions(nextProps)]
  const noPropChange = isEqual(omit(props, funcs), omit(nextProps, nextFuncs))
  const noFuncChange =
    funcs.length === nextFuncs.length &&
    funcs.every(fn => props[fn].toString() === nextProps[fn].toString())
  return noPropChange && noFuncChange
}

const styles = {
  mapDiv: isRowBased => ({
    height: isRowBased ? `100vh` : '100vh',
    margin: `0`,
  }),
  lstRoutes: isRowBased => ({
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: isRowBased ? '1vw' : "2vw",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "center",
    color: "black",
    height: "4em",
    width: "80%",
    textAlign: "left",
  }),
  btnRadio: isRowBased => ({
    minWidth: isRowBased ? "2vw" : "4vw",
    minHeight: isRowBased ? "2vw" : "4vw",
    width: isRowBased ? "2vw" : "4vw",
    height: isRowBased ? "2vw" : "4vw",
    backgroundColor: "#00AEEF",
  }),
}

export default React.memo(Map, shouldNotUpdate)

Map.defaultProps = {
  options: {
    center: { lat: 48, lng: 8 },
    zoom: 5,
  },

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
}