export interface InfusionColor {
  id: string;
  name: string;
  hex: string;
  finish: "gloss" | "matte" | "satin";
  hasMetallicFlakes: boolean;
  category: string;
}

export const INFUSION_COLORS: InfusionColor[] = [
  // Reds
  { id: "red-001", name: "Racing Red", hex: "#E31E24", finish: "gloss", hasMetallicFlakes: false, category: "red" },
  { id: "red-002", name: "Crimson Metallic", hex: "#B22222", finish: "gloss", hasMetallicFlakes: true, category: "red" },
  { id: "red-003", name: "Cherry Red", hex: "#990000", finish: "gloss", hasMetallicFlakes: false, category: "red" },
  { id: "red-004", name: "Candy Apple", hex: "#FF0800", finish: "gloss", hasMetallicFlakes: true, category: "red" },
  { id: "red-005", name: "Matte Red", hex: "#C41E3A", finish: "matte", hasMetallicFlakes: false, category: "red" },
  
  // Blues
  { id: "blue-001", name: "Electric Blue", hex: "#00B4D8", finish: "gloss", hasMetallicFlakes: false, category: "blue" },
  { id: "blue-002", name: "Navy Blue", hex: "#000080", finish: "matte", hasMetallicFlakes: false, category: "blue" },
  { id: "blue-003", name: "Sky Blue Metallic", hex: "#87CEEB", finish: "gloss", hasMetallicFlakes: true, category: "blue" },
  { id: "blue-004", name: "Royal Blue", hex: "#4169E1", finish: "gloss", hasMetallicFlakes: false, category: "blue" },
  { id: "blue-005", name: "Midnight Blue", hex: "#191970", finish: "satin", hasMetallicFlakes: true, category: "blue" },
  
  // Blacks & Grays
  { id: "black-001", name: "Gloss Black", hex: "#000000", finish: "gloss", hasMetallicFlakes: false, category: "black" },
  { id: "black-002", name: "Matte Black", hex: "#1C1C1C", finish: "matte", hasMetallicFlakes: false, category: "black" },
  { id: "black-003", name: "Satin Black", hex: "#0A0A0A", finish: "satin", hasMetallicFlakes: false, category: "black" },
  { id: "gray-001", name: "Gunmetal Gray", hex: "#2C3539", finish: "satin", hasMetallicFlakes: true, category: "gray" },
  { id: "gray-002", name: "Silver Metallic", hex: "#C0C0C0", finish: "gloss", hasMetallicFlakes: true, category: "gray" },
  { id: "gray-003", name: "Charcoal Matte", hex: "#36454F", finish: "matte", hasMetallicFlakes: false, category: "gray" },
  { id: "gray-004", name: "Titanium", hex: "#878681", finish: "satin", hasMetallicFlakes: true, category: "gray" },
  
  // Whites
  { id: "white-001", name: "Pearl White", hex: "#FFFAF0", finish: "gloss", hasMetallicFlakes: true, category: "white" },
  { id: "white-002", name: "Gloss White", hex: "#FFFFFF", finish: "gloss", hasMetallicFlakes: false, category: "white" },
  { id: "white-003", name: "Matte White", hex: "#F5F5F5", finish: "matte", hasMetallicFlakes: false, category: "white" },
  { id: "white-004", name: "Satin White", hex: "#FAF9F6", finish: "satin", hasMetallicFlakes: false, category: "white" },
  
  // Greens
  { id: "green-001", name: "British Racing Green", hex: "#004225", finish: "gloss", hasMetallicFlakes: false, category: "green" },
  { id: "green-002", name: "Lime Green", hex: "#32CD32", finish: "gloss", hasMetallicFlakes: false, category: "green" },
  { id: "green-003", name: "Forest Green Metallic", hex: "#228B22", finish: "gloss", hasMetallicFlakes: true, category: "green" },
  { id: "green-004", name: "Mint Green", hex: "#98FF98", finish: "matte", hasMetallicFlakes: false, category: "green" },
  { id: "green-005", name: "Army Green", hex: "#4B5320", finish: "matte", hasMetallicFlakes: false, category: "green" },
  
  // Yellows & Golds
  { id: "yellow-001", name: "Bright Yellow", hex: "#FFFF00", finish: "gloss", hasMetallicFlakes: false, category: "yellow" },
  { id: "yellow-002", name: "Gold Metallic", hex: "#FFD700", finish: "gloss", hasMetallicFlakes: true, category: "yellow" },
  { id: "yellow-003", name: "Matte Yellow", hex: "#FFF44F", finish: "matte", hasMetallicFlakes: false, category: "yellow" },
  { id: "gold-001", name: "Rose Gold", hex: "#B76E79", finish: "gloss", hasMetallicFlakes: true, category: "gold" },
  { id: "gold-002", name: "Bronze", hex: "#CD7F32", finish: "satin", hasMetallicFlakes: true, category: "gold" },
  
  // Oranges
  { id: "orange-001", name: "Bright Orange", hex: "#FF6600", finish: "gloss", hasMetallicFlakes: false, category: "orange" },
  { id: "orange-002", name: "Burnt Orange", hex: "#CC5500", finish: "matte", hasMetallicFlakes: false, category: "orange" },
  { id: "orange-003", name: "Copper Metallic", hex: "#B87333", finish: "gloss", hasMetallicFlakes: true, category: "orange" },
  
  // Purples
  { id: "purple-001", name: "Deep Purple", hex: "#663399", finish: "gloss", hasMetallicFlakes: false, category: "purple" },
  { id: "purple-002", name: "Violet Metallic", hex: "#8B00FF", finish: "gloss", hasMetallicFlakes: true, category: "purple" },
  { id: "purple-003", name: "Plum", hex: "#8E4585", finish: "satin", hasMetallicFlakes: false, category: "purple" },
  
  // Pinks
  { id: "pink-001", name: "Hot Pink", hex: "#FF69B4", finish: "gloss", hasMetallicFlakes: false, category: "pink" },
  { id: "pink-002", name: "Matte Pink", hex: "#FFB6C1", finish: "matte", hasMetallicFlakes: false, category: "pink" },
  { id: "pink-003", name: "Magenta", hex: "#FF00FF", finish: "gloss", hasMetallicFlakes: true, category: "pink" },
  
  // Browns
  { id: "brown-001", name: "Chocolate Brown", hex: "#3B2414", finish: "matte", hasMetallicFlakes: false, category: "brown" },
  { id: "brown-002", name: "Mahogany", hex: "#C04000", finish: "satin", hasMetallicFlakes: true, category: "brown" },
  
  // Special
  { id: "special-001", name: "Chrome Silver", hex: "#E5E4E2", finish: "gloss", hasMetallicFlakes: true, category: "special" },
  { id: "special-002", name: "Carbon Fiber", hex: "#2C2C2C", finish: "satin", hasMetallicFlakes: false, category: "special" },
  { id: "special-003", name: "Rainbow Shift", hex: "#8B7EB5", finish: "gloss", hasMetallicFlakes: true, category: "special" },
];

export const getColorsByCategory = (category: string) => {
  return INFUSION_COLORS.filter(color => color.category === category);
};

export const getColorById = (id: string) => {
  return INFUSION_COLORS.find(color => color.id === id);
};
