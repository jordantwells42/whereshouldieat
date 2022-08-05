export default function FoodIcons({
  setFoodQuery,
}: {
  setFoodQuery: (query: string) => void;
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
    <div className="grid grid-rows-2 gap-4 grid-flow-col overflow-x-scroll overflow-y-hidden pt-4 pl-10 ">
      {foods.map((food, index) => (
        <div className="hover:cursor-pointer hover:bg-blue-200 hover:rounded-2xl p-1 w-20 aspect-square flex flex-col items-center justify-center" key={index}>
          <img
            src={`/${food}.svg`}
            alt={food}
            className="aspect-square w-20"
            onClick={() => setFoodQuery(food)}
          />
          <p className="text-xs font-bold">{food}</p>
        </div>
      ))}
    </div>
  );
}
