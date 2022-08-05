export default function FoodIcons({
  setFoodQuery,
  setToggle,
}: {
  setFoodQuery: (query: string) => void;
  setToggle: (toggle: boolean) => void;
}) {
  const foods = [
    "Pizza",
    "Taco",
    "Hamburger",
    "Wrap",
    "Noodles",
    "Pancake",
    "Hot Dog",
    "Doughnut",
    "Steak",
    "French Fries",
    "Bacon",
    "Rice Bowl",
    "Vegan Food",
    "Dim Sum", 
    "Coffee To Go"
  ];
  return (
    <div className="w-full h-full grid grid-rows-2 gap-1 grid-flow-col overflow-x-scroll overflow-y-hidden pt-10 pl-4 ">
      {foods.map((food, index) => (
        <div className="w-20 h-20 hover:cursor-pointer hover:bg-blue-200 hover:rounded-2xl p-1 flex flex-col items-center justify-center" key={index}>
          <img
            src={`/${food}.svg`}
            alt={food}
            className="h-full aspect-square"
            onClick={() => (setFoodQuery(food), setToggle(false))}
          />
          <p className="text-xs font-bold">{food}</p>
        </div>
      ))}
    </div>
  );
}
