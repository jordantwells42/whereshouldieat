/* eslint-disable @next/next/no-img-element */
import Router, { useRouter } from "next/router";
import useMeasure from 'react-use-measure'
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useGesture } from "@use-gesture/react";
import { useSpring, animated, config } from "react-spring";
import { AnimatePresence, m, motion } from "framer-motion";
import { DebounceInput } from "react-debounce-input";
import FoodIcons from "../components/FoodIcons";
import StarRatings from "react-star-ratings";
import Link from "next/link";
import Modal from "../components/Modal";
import { stringify } from "querystring";
import Footer from "../components/Footer";

const day = (new Date().getDay() + 6) % 7;

const starDict : any ={
  0: "large_0.png",
  1: "large_1.png",
  1.5: "large_1_half.png",
  2: "large_2.png",
  2.5: "large_2_half.png",
  3: "large_3.png",
  3.5: "large_3_half.png",
  4: "large_4.png",
  4.5: "large_4_half.png",
  5: "large_5.png"
}

function useQueryState(
  name: string,
  defaultValue: any,
  callback: (value: any) => void = () => {}
) {
  const router = useRouter();
  const [value, setQueryValue] = useState(defaultValue);
  //const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const qvalue = query.get(name);
    console.log(qvalue, name);

    if (qvalue) {
      if (JSON.parse(qvalue) === value || JSON.parse(qvalue) == defaultValue) {
        return;
      }
      callback(JSON.parse(qvalue));
      setQueryValue(JSON.parse(qvalue));
    } else if (defaultValue == "") {
      //callback(defaultValue);
      setQueryValue(defaultValue);
    } else {
      //callback(defaultValue)
      if (name === "location") {
        return;
      }
      setQueryValue(defaultValue);
    }
  }, [router.query[name]]);

  function setValue(qvalue: any) {
    if (qvalue == value) {
      return;
    }

    console.log("SETTING STATE OF ", name, "to", qvalue);
    const query = new URLSearchParams(window.location.search);
    query.set(name, JSON.stringify(qvalue) || "");
    router.push(`?${query.toString()}`, undefined, {shallow: true, scroll: false});
    setQueryValue(qvalue);
  }

  return [value, setValue];
}

function tiler(x: number, y: number, z: number, dpr?: number) {
  return `https://a.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png`;
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 1080,
    height: 720,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

type Result = any | null;
type Results = Result[];

const Home: NextPage = () => {
  const maxZoom = 14;
  const [ref, bounds] = useMeasure()
  const windowSize = useWindowSize();
  const [toggle, setToggle] = useQueryState("toggle", true);
  const [tab, setTab] = useQueryState("tab", 0);
  const [foodQuery, setFoodQuery] = useQueryState("food", "", (val) =>
    search("", val)
  );
  const [results, setResults] = useState<Results>([]);
  const [resultIds, setResultIds] = useState<string[]>([]);
  const [business, setBusiness] = useState<Result>(undefined);
  const router = useRouter();
  const centerRef = useRef<[number, number]>([40.7812, -73.9665]);
  const zoomRef = useRef<number>(maxZoom);
  const [location, setLocation] = useQueryState(
    "location",
    [40.7812, -73.9665]
  );
  const [locationQuery, setLocationQuery] = useState("");

  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
  }));

  const bind = useGesture(
    {
      onDrag:
        // @ts-ignore
        ({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
          if (!windowSize || !windowSize.width) {
            return;
          }
          const trigger =
            Math.abs(mx) > windowSize.width / (windowSize.width > 700 ? 6 : 2);
          // @ts-ignore
          api.start(() => {
            if (!windowSize || !windowSize.width) {
              return;
            }
            const x = !down ? 0 : windowSize.width < 500 ? mx * 1.5 : mx;
            const rotate = !down
              ? 0
              : windowSize.width < 500
              ? mx / 20
              : mx / 50;
            const scale = down ? 1.05 : 1;
            return {
              x,
              rotate,
              scale,
              config: config.wobbly,
            };
          });
        },

      onDragEnd: ({
        down,
        // @ts-ignore
        movement: [mx],
        // @ts-ignore
        direction: [dx],
        // @ts-ignore
        velocity: [vx],
      }) => {
        if (!windowSize || !windowSize.width) {
          return;
        }
        const trigger =
          Math.abs(mx) > windowSize.width / (windowSize.width > 700 ? 6 : 2);
        // @ts-ignore
        api.start(() => {
          function handleTrigger() {
            if (mx > 0) {
              console.log("Swipe Right");
              swipeRight();
            } else {
              console.log("Swipe Left");
              swipeLeft();
            }
          }

          if (trigger) {
            handleTrigger();
          }

          return {
            x: 0,
            rotate: 0,
            scale: 1,
            config: config.gentle,
          };
        });
      },
    },
    {
      drag: {
        filterTaps: true,
        preventDefault: true,
        //preventScroll: true,
        axis: "x",
      },
    }
  );

  useEffect(() => {
    if (navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition((e) => {
          setLocation([e.coords.latitude, e.coords.longitude]);
          centerRef.current = [e.coords.latitude, e.coords.longitude];
          search([e.coords.latitude, e.coords.longitude].join(","), "");
        });
      } catch (e) {
        setLocation([40.7812, -73.9665]);
        centerRef.current = [40.7812, -73.9665];
        search([40.7812, -73.9665].join(","), "");
      }
    } else {
      setLocation([40.7812, -73.9665]);
      centerRef.current = [40.7812, -73.9665];
      search([40.7812, -73.9665].join(","), "");
    }
  }, []);
  /*
useEffect(() => {
  if (firstLoad) {
    setFirstLoad(false);
    return;
  }
  if (location) {
    centerRef.current = location;
    search("", foodQuery)
  }
}, [location])*/

  function search(locationStr: string, foodStr: string) {
    fetch(
      `/api/search-area?q=${foodStr || "food"}&l=${
        locationStr || location[0] + "," + location[1]
      }`
    )
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        setResultIds(res.businesses.map((r: Result) => r.id));
        setResults(res.businesses.reverse());
        newBusiness(res.businesses.at(-1).id);

        if (locationStr) {
          console.log("AYO", locationStr);
          setLocation([
            res.region.center.latitude,
            res.region.center.longitude,
          ]);
          centerRef.current = [
            res.region.center.latitude,
            res.region.center.longitude,
          ];
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleSelectLocation({
    event,
    latLng,
  }: {
    event: MouseEvent;
    latLng: [number, number];
  }) {
    centerRef.current = latLng;

    setLocation(latLng);
  }

  function handleMarkerClick({
    event,
    anchor,
  }: {
    event: MouseEvent;
    anchor: [number, number];
  }) {
    centerRef.current = anchor;
    //setLocation(anchor)
    zoomRef.current = maxZoom;
  }

  function newBusiness(id: string | undefined) {
    fetch(`/api/business?id=${id}`)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        setBusiness(res);
      });
  }

  function swipeLeft() {
    if (resultIds.length > 1) {
      setResultIds((p) => {
        const newP = p.filter((id) => id !== business.id);
        newBusiness(newP[0]);
        return newP;
      });
    } else {
      setBusiness(undefined);
      setResultIds([]);
    }
  }

  function swipeRight() {
    router.push(
      `https://www.google.com/maps/search/${business.name
        .split(" ")
        .join("+")}/@${business.coordinates.latitude},${
        business.coordinates.longitude
      },15z`
    );
  }
  //console.log(location, centerRef.current);
  console.log(business, business && business.hours);
  return (
    <>
      <div
        style={{ height: "100%", backgroundBlendMode: toggle ? "darken" : ""}}
        className="relative flex min-h-screen w-full flex-col items-center justify-center bg-stone-700  font-main"
      >
        {/*TINDER*/}
        <div className="relative min-h-screen flex h-full w-full flex-col items-center justify-center overflow-x-hidden overflow-y-hidden">
          <div
            style={{ height: windowSize.height , marginBottom: (bounds.height - windowSize.height + 100 > 0) ? bounds.height - windowSize.height + 100 : 0 }}
            className="flex w-full items-center justify-center "
          >
            {
              <Map
                provider={tiler}
                center={
                  business
                    ? [
                        business.coordinates.latitude,
                        business.coordinates.longitude,
                      ]
                    : centerRef.current
                }
                zoom={zoomRef.current}
                maxZoom={maxZoom + 3}
                onClick={handleSelectLocation}
                onBoundsChanged={({ center, zoom }) => {
                  centerRef.current = center;
                  zoomRef.current = zoom;
                }}
              >
                {business &&
                  results &&
                  results.map(
                    (result) =>
                      resultIds.includes(result.id) && (
                        <Marker
                          key={result.id}
                          color={
                            result.id === business.id ? "salmon" : "lightblue"
                          }
                          width={50}
                          anchor={[
                            result.coordinates.latitude,
                            result.coordinates.longitude,
                          ]}
                          onClick={() => (
                            (zoomRef.current = maxZoom), newBusiness(result.id)
                          )}
                        />
                      )
                  )}
              </Map>
            }
          </div>
          {!toggle && business ? (
            [business].map((datum: any, idx: number) => {
              return (
                <motion.div
                  key={datum.id}
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  ref={ref}
                  className="z-10 flex h-full w-[400px] flex-col items-center text-lg md:text-lg lg:text-xl justify-center rounded-2xl  text-stone-900 md:w-[400px] lg:absolute lg:top-10 lg:left-20  lg:mt-0 lg:h-auto  lg:w-[425px] xl:w-[500px] 2xl:w-[600px]"
                >
                  <animated.div
                    style={{
                      marginTop:
                        windowSize.width >= 1024 ? 0 : -windowSize.height / 2.2,
                      x,
                      rotate,
                      scale,
                      touchAction: "pan-y",
                    }}
                    className="w-full h-full bg-stone-50 flex items-center justify-start flex-col rounded-2xl"
                    {...bind()}
                  >
                    {(datum.hours && datum.hours[0]) ? <div
                      className={`text-center text-xl font-bold text-stone-50 ${
                        datum.hours[0].is_open_now ? "bg-green-500" : "bg-red-500"
                      } w-full rounded-t-2xl`}
                    >
                      {datum.hours[0].is_open_now ? "OPEN" : "CLOSED"}
                    </div> : <div className="p-2"></div>}

                    {/* IMAGES */}
                    <div className="flex w-5/6 flex-col items-center justify-start">
                      <div className="relative m-4 mb-0 flex aspect-square w-full flex-col items-center justify-start">
                        <Carousel
                          swipeable={false}
                          showThumbs={false}
                          className="absolute bottom-0 aspect-square w-full"
                        >
                          {datum.photos.map((photo: string) => {
                            return (
                              <img
                                className="aspect-square w-full rounded-2xl object-cover "
                                key={photo}
                                src={photo}
                                alt={datum.name}
                              />
                            );
                          })}
                        </Carousel>
                        <div className="absolute bottom-0  flex h-2/3 w-full  items-center rounded-2xl bg-gradient-to-t from-stone-800"></div>
                        <div className="absolute bottom-5  flex w-full flex-col justify-start p-4 text-left text-white">
                          <p className="gap-2 align-middle">
                            <b className="font-bold">{datum.name}</b>
                            &nbsp;&nbsp;
                            <i className="font-light">{datum.price}</i>
                          </p>
                          <p className="">
                            {results.find((result) => result.id === datum.id) &&
                              results.find((result) => result.id === datum.id)
                                .distance &&
                              Math.round(
                                (results.find(
                                  (result) => result.id === datum.id
                                ).distance /
                                  1609) *
                                  100
                              ) / 100}{" "}
                            miles away
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="align-center flex h-8 w-full items-center justify-start gap-2">
                              <img src={starDict[datum.rating]} alt="stars" />
                              ({datum.review_count})
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* LINKS */}
                      <div className="z-20 mb-4 flex w-full justify-center gap-4">
                        <Link href={datum.url}>
                          <a rel="noreferrer noopener" target="_blank">
                            <img
                              alt="yelp"
                              className="h-8 rounded-lg"
                              src={"yelp.svg"}
                            />
                          </a>
                        </Link>
                        <Link
                          href={`https://www.google.com/maps/dir/${location.join(
                            ","
                          )}/${business.name.split(" ").join("+")}/@${
                            business.coordinates.latitude
                          },${business.coordinates.longitude},15z`}
                        >
                          <a rel="noreferrer noopener" target="_blank">
                            <img
                              alt="yelp"
                              className="h-8 rounded-lg"
                              src={"maps.svg"}
                            />
                          </a>
                        </Link>
                      </div>
                      <p className="w-full font-semibold">
                      {datum.categories.map((c: any) => c.title).join(", ")}
                      </p>
                      <p className="w-full text-left capitalize">{datum.transactions.join(" | ")}</p>
                      {/* HOURS */}
                      {datum.hours && (
                        <div className="m-3 w-full ">
                          {(() => {
                            const hoursString = datum.hours[0].open
                              .filter((e: any) => e.day === day)
                              .map(
                                (hour: any) =>
                                  `${
                                    hour.start.slice(0, -2) +
                                    ":" +
                                    hour.start.slice(-2)
                                  } to ${
                                    hour.end.slice(0, -2) +
                                    ":" +
                                    hour.end.slice(-2)
                                  } `
                              )
                              .join("and ");
                            return (
                              <p>
                                {hoursString
                                  ? "Open from " + hoursString + " today"
                                  : "Closed today"}
                              </p>
                            );
                          })()}
                        </div>
                      )}
                      {/* INFO */}
                      <div className="m-3 w-full">
                        <p>{datum.display_phone}</p>
                        <p>{datum.location.display_address.join("\n")}</p>
                        
                      </div>

                      {/* BUTTONS */}
                      <div className="m-3 flex w-full items-center justify-between">
                        <button onClick={swipeLeft}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                        <button onClick={swipeRight}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="red"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </animated.div>
                </motion.div>
              );
            })
          ) : toggle ? (
            <></>
          ) : resultIds.length === 0 ? (
            <button
              className="z-20 my-10 -mt-40 flex h-20 w-full items-center justify-center rounded-2xl bg-stone-500 hover:bg-sky-500 p-4 text-white lg:absolute lg:top-20 lg:left-20 lg:mt-0 lg:w-1/4"
              onClick={() => (setToggle(true), setTab(1))}
            >
              Didn&apos;t find your Craving?
            </button>
          ) : (
            <div className="z-20 my-10 -mt-40 flex h-20 w-full items-center justify-center rounded-2xl bg-stone-500 p-4 text-white lg:absolute lg:top-20 lg:left-20 lg:mt-0 lg:w-1/4">
              Loading
            </div>
          )}

          <button
            className={`my-8 ${toggle ? "" : "mb-24"} flex h-10 xl:absolute xl:top-5 xl:right-5 items-center justify-center rounded-2xl hover:bg-sky-500 bg-stone-500 p-4 text-white`}
            onClick={() => (setTab(1), setToggle(true))}
          >
            Cravings Changed?
          </button>
          <div
            style={{ display: toggle ? "block" : "none" }}
            className="absolute h-full w-full bg-stone-800 bg-opacity-80"
          ></div>
        </div>

        {/*MDOAL */}

        <AnimatePresence>
          {/*WHERE*/}
          {tab == 0 && (
            <Modal toggle={toggle} setToggle={setToggle}>
              <div className="h-1/2 w-full">
                <Map
                  provider={tiler}
                  center={location}
                  zoom={zoomRef.current}
                  maxZoom={maxZoom + 3}
                  onClick={handleSelectLocation}
                  onBoundsChanged={({ center, zoom }) => {
                    centerRef.current = center;
                    zoomRef.current = zoom;
                  }}
                >
                  <ZoomControl />
                  <Marker
                    width={50}
                    anchor={location}
                    onClick={handleMarkerClick}
                  />
                </Map>
              </div>
              <div className="flex h-1/4 w-full flex-col items-center justify-center gap-4 p-4 py-8">
                <h2 className="w-5/6 text-xl text-black">
                  <b className="italic">Where</b> are you eating?
                </h2>
                <DebounceInput
                  className="w-5/6 rounded-2xl border-2 border-black p-2 focus:outline-blue-400"
                  value={locationQuery}
                  placeholder="Downtown Austin"
                  debounceTimeout={300}
                  onChange={(e) => [
                    setLocationQuery(e.target.value),
                    search(e.target.value, foodQuery),
                  ]}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setTab(1);
                    }
                  }}
                />
              </div>
              <button
                className="absolute bottom-5 right-5 h-1/4"
                onClick={() => setTab(1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </Modal>
          )}
          {/*WHAT*/}
          {tab == 1 && (
            <Modal setToggle={setToggle} toggle={toggle}>
              <div className="z-10 flex h-full w-full flex-col items-center justify-start text-lg">
                <div className="h-1/2 w-full">
                  <FoodIcons
                    search={search}
                    setToggle={setToggle}
                    setFoodQuery={setFoodQuery}
                  />
                </div>
                <div className="flex h-1/4 w-full flex-col items-center justify-center gap-4 p-4 py-8">
                  <h2 className="w-5/6 text-xl text-black">
                    <b className="italic">What</b>&nbsp;are you craving?
                  </h2>
                  <DebounceInput
                    className="w-5/6 rounded-2xl border-2 border-black p-2 focus:outline-sky-400"
                    value={foodQuery}
                    placeholder="Pizza"
                    debounceTimeout={300}
                    onChange={(e) => [
                      setFoodQuery(e.target.value),
                      search("", e.target.value),
                    ]}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setToggle(false);
                      }
                    }}
                  />
                </div>
                <button
                  className="absolute bottom-5 left-5 h-1/4"
                  onClick={() => setTab(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  className="absolute bottom-5 right-5 h-1/4"
                  onClick={() => (search("", foodQuery), setToggle(false))}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
        {!toggle && <Footer />}
      </div>
    </>
  );
};

export default Home;
