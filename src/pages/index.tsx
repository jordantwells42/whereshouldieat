/* eslint-disable @next/next/no-img-element */
import Router, { useRouter } from "next/router";

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

function useQueryState(name: string, defaultValue: any){
  const router = useRouter();
  const [value, setQueryValue] = useState(defaultValue);
  
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const value = query.get(name);
    if (value) {
      setValue(JSON.parse(value));
    } else {
      setValue(defaultValue);
    }
  }, [router.query[name]]);

  function setValue(value: any) {
    const query = new URLSearchParams(window.location.search);
    query.set(name, JSON.stringify(value));
    router.push(`?${query.toString()}`);
    setQueryValue(value);
  }

  return [value, setValue];
}


function tiler(x: number, y: number, z: number, dpr?: number) {
  return `https://a.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png`;
}

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 1080,
    height: 720,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    //window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    //return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

type Result = any | null;
type Results = Result[];

const Home: NextPage = () => {
  const maxZoom = 14;

  const windowSize = useWindowSize();

  const [prevX, setPrevX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [initX, setInitX] = useState(0);
  const [toggle, setToggle] = useState(true);
  const [tab, setTab] = useState(0);
  const [foodQuery, setFoodQuery] = useQueryState("food", "");
  const [results, setResults] = useState<Results>([]);
  const [resultIds, setResultIds] = useState<string[]>([]);
  const [business, setBusiness] = useState<Result>(undefined);
  const router = useRouter();
  const [firstLoad, setFirstLoad] = useState(true);
  const centerRef = useRef<[number, number]>([40.7812, -73.9665]);
  const zoomRef = useRef<number>(maxZoom);
  const [location, setLocation] = useQueryState("location", [
    40.7812, -73.9665,
  ]);
  const [locationQuery, setLocationQuery] = useState("");
  const [dprs, setDprs] = useState<number>(1);

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
            const x = !down ? 0 : trigger ? mx * 1 : mx;
            const rotate = !down
              ? 0
              : windowSize.width < 500
              ? mx / 20
              : mx / 50;
            const scale = down ? 1.05 : 1;
            setPrevX(x);
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
    centerRef.current = location;
  }, [location])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((e) => {
        setLocation([e.coords.latitude, e.coords.longitude]);
        centerRef.current = [e.coords.latitude, e.coords.longitude];
      });
    } else {
      setLocation([40.7812, -73.9665]);
      centerRef.current = [40.7812, -73.9665];
    }
  }, []);

  useEffect(() => {
    if (!firstLoad) {
      search("", foodQuery);
    }
    setFirstLoad(false);
  }, [foodQuery]);

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

  return (
    <>
      <div
        style={{ backgroundBlendMode: toggle ? "darken" : "" }}
        className="relative flex h-full w-full flex-col items-center justify-center bg-stone-700  font-main"
      >
        {/*TINDER*/}
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-x-hidden">
          <div
            style={{ height: windowSize.height }}
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
                          onClick={() => newBusiness(result.id)}
                        />
                      )
                  )}
              </Map>
            }
          </div>
          {!toggle && business ? (
            [business].map((datum: any, idx: number) => {
              return (
                <animated.div
                  style={{
                    marginTop:
                      windowSize.width >= 1024 ? 0 : -windowSize.height / 2.2,
                    x,
                    rotate,
                    scale,
                    touchAction: "pan-y",
                  }}
                  className="z-10 flex h-full w-[400px] flex-col items-center justify-start rounded-2xl bg-stone-50 p-2 text-stone-900 md:w-[400px] lg:absolute lg:top-20 lg:left-20  lg:mt-0 lg:h-screen lg:w-[400px]"
                  key={datum.id}
                  {...bind()}
                >
                  <div className="flex w-5/6 flex-col items-center justify-start">
                    <div className="relative m-4 mb-0 flex aspect-square w-full flex-col items-center justify-start">
                      <Carousel
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
                      <div className="absolute bottom-0  flex h-3/4 w-full  items-center rounded-2xl bg-gradient-to-t from-stone-900"></div>
                      <div className="absolute bottom-5  flex w-full flex-col justify-start p-4 text-left text-white">
                        <p className="gap-2 align-middle">
                          <b className="text-lg font-bold">{datum.name}</b>
                          &nbsp;&nbsp;
                          <i className="font-light">{datum.price}</i>
                        </p>
                        <p className="">
                          {results[results.length - resultIds.length]
                            .distance &&
                            Math.round(
                              (results[results.length - resultIds.length]
                                .distance /
                                1609) *
                                100
                            ) / 100}{" "}
                          miles away
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="align-center flex h-8 w-full items-center justify-center gap-2">
                            <StarRatings
                              rating={datum.rating}
                              starRatedColor="gold"
                              starEmptyColor="black"
                              starDimension={`${
                                windowSize.width > 700 ? "20" : "20"
                              }px`}
                              numberOfStars={5}
                              name="rating"
                            />{" "}
                            ({datum.review_count})
                          </div>
                        </div>
                      </div>
                    </div>
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
                        href={`https://www.google.com/maps/search/${business.name
                          .split(" ")
                          .join("+")}/@${business.coordinates.latitude},${
                          business.coordinates.longitude
                        },15z`}
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
                    <div className="m-5 w-full">
                      <p className="italic">
                        {datum.categories.map((c: any) => c.title).join(" | ")}
                      </p>
                      <p>{datum.display_phone}</p>
                      <p>{datum.location.display_address.join("\n")}</p>
                    </div>

                    <div className="flex w-full items-center justify-between ">
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
              );
            })
          ) : toggle ? (
            <></>
          ) : resultIds.length === 0 ? (
            <button
              className="z-20 my-10 -mt-40 flex h-20 w-full items-center justify-center rounded-2xl bg-stone-500 p-4 text-white lg:absolute lg:top-20 lg:left-20 lg:mt-0 lg:w-1/4"
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
            className="my-10 flex h-10 items-center justify-center rounded-2xl bg-stone-500 p-4 text-white"
            onClick={() => (setTab(1), setToggle(true))}
          >
            Change up your search
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
            <Modal toggle={toggle}>
              <div className="h-1/2 w-full">
                <Map
                  provider={tiler}
                  center={centerRef.current}
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
                  debounceTimeout={200}
                  onChange={(e) => [
                    setLocationQuery(e.target.value),
                    search(e.target.value, foodQuery),
                  ]}
                />
              </div>
              <button
                className="absolute bottom-5 right-5 h-1/4"
                onClick={() => (search("", ""), setTab((p) => p + 1))}
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
            <Modal toggle={toggle}>
              <div className="z-10 flex h-full w-full flex-col items-center justify-start text-lg">
                <div className="h-1/2 w-full">
                  <FoodIcons
                    setToggle={setToggle}
                    setFoodQuery={setFoodQuery}
                  />
                </div>
                <div className="flex h-1/4 w-full flex-col items-center justify-center gap-4 p-4 py-8">
                  <h2 className="w-5/6 text-xl text-black">
                    <b className="italic">What</b>&nbsp;are you craving?
                  </h2>
                  <DebounceInput
                    className="w-5/6 rounded-2xl border-2 border-black p-2 focus:outline-blue-400"
                    value={foodQuery}
                    placeholder="Pizza"
                    debounceTimeout={200}
                    onChange={(e) => [
                      setFoodQuery(e.target.value),
                      search("", e.target.value),
                    ]}
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
                  onClick={() => (setTab(0), setToggle(false))}
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
      </div>
    </>
  );
};

export default Home;
