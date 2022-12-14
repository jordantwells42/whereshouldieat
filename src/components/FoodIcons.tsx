import {motion} from 'framer-motion'

export default function FoodIcons({
  setFoodQuery,
  setToggle,
  search
}: {
  setFoodQuery: (query: string) => void;
  setToggle: (toggle: boolean) => void;
  search: (locationStr: string, foodStr: string) => void;
}) {
  const foods = [
    "Pizza",
    "Taco",
    "Noodles",
    "Hamburger",
    "Hot Dog",
    "Sushi",
    "Spaghetti",
    "Fish",
    "Cafe",
    "Cookies",
    "Kebab",
    "Pie",
    "Quesadilla",
    "Steak",
    "Pancake",
    "Wrap",
    "Doughnut",
    "French Fries",
    "Bacon",
    "Rice Bowl",
    "Vegan Food",
    "Dim Sum", 
  ];
  return (
    <div className="w-full h-full grid grid-rows-2  grid-flow-col overflow-x-scroll overflow-y-hidden pt-10 pl-5 md:pl-10 ">
      {foods.map((food, index) => (
        <motion.div
        initial={{rotate:0}}
        animate={{rotate:0}}
        whileHover={{rotate:[5,-5,0], scale:1.1}} 
        className="w-20 h-20 hover:cursor-pointer hover:bg-blue-50 hover:rounded-2xl p-1 flex flex-col items-center justify-center" key={index}>
          <img
            src={`/${food}.svg`}
            alt={food}
            className="h-full aspect-square"
            onClick={() => (search("", food), setFoodQuery(food), setToggle(false))}
          />
          <p className="text-sm font-bold">{food}</p>
        </motion.div>
      ))}
    </div>
  );
}
