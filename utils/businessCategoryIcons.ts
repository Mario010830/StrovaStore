import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Beef,
  CalendarDays,
  Candy,
  Coffee,
  Cpu,
  Croissant,
  Dumbbell,
  Fish,
  Flower,
  Gamepad,
  Gamepad2,
  Gem,
  Glasses,
  GraduationCap,
  IceCream,
  Lamp,
  LayoutGrid,
  Leaf,
  Megaphone,
  Monitor,
  PawPrint,
  Pill,
  Pizza,
  Scissors,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wine,
  Wrench,
} from "lucide-react";

/**
 * Mapeo nombre de categoría → nombre del componente Lucide.
 * Fuente única de verdad (alineado con admin).
 */
export const businessCategoryIcons: Record<string, string> = {
  Perfumería: "Sparkles",
  "Tienda general": "Store",
  "Ropa y accesorios": "Shirt",
  Restaurante: "UtensilsCrossed",
  Heladería: "IceCream",
  Farmacia: "Pill",
  Electrónica: "Cpu",
  "Hogar y decoración": "Lamp",
  "Belleza y cuidado personal": "Scissors",
  Panadería: "Croissant",
  Dulcería: "Candy",
  Cafetería: "Coffee",
  Bar: "Wine",
  Pizzería: "Pizza",
  Floristería: "Flower",
  "Joyería y relojería": "Gem",
  Ferretería: "Wrench",
  Juguetería: "Gamepad",
  "Tienda de mascotas": "PawPrint",
  Óptica: "Glasses",
  "Artículos para bebés": "Baby",
  Gimnasio: "Dumbbell",
  Academia: "GraduationCap",
  "Tiendas de videojuegos": "Gamepad2",
  "Servicio informático": "Monitor",
  "Móviles y accesorios": "Smartphone",
  "Marketing y publicidad": "Megaphone",
  "Organización de eventos": "CalendarDays",
  Carnicería: "Beef",
  Pescadería: "Fish",
  "Productos naturales": "Leaf",
  Otros: "LayoutGrid",
};

const LUCIDE_BY_NAME: Record<string, LucideIcon> = {
  Sparkles,
  Store,
  Shirt,
  UtensilsCrossed,
  IceCream,
  Pill,
  Cpu,
  Lamp,
  Scissors,
  Croissant,
  Candy,
  Coffee,
  Wine,
  Pizza,
  Flower,
  Gem,
  Wrench,
  Gamepad,
  PawPrint,
  Glasses,
  Baby,
  Dumbbell,
  GraduationCap,
  Gamepad2,
  Monitor,
  Smartphone,
  Megaphone,
  CalendarDays,
  Beef,
  Fish,
  Leaf,
  LayoutGrid,
};

/** Slug estable para URL (?category=). */
export function slugifyBusinessCategoryName(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "categoria";
}

/** Resuelve el componente Lucide; si no hay nombre o no está mapeado → Store. */
export function getBusinessCategoryLucideIcon(categoryName: string | null | undefined): LucideIcon {
  if (!categoryName?.trim()) return Store;
  const lucideKey = businessCategoryIcons[categoryName.trim()];
  if (lucideKey && LUCIDE_BY_NAME[lucideKey]) {
    return LUCIDE_BY_NAME[lucideKey];
  }
  return Store;
}
