export interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  calories: number | null;
  proteins: number | null;
  fats: number | null;
  carbs: number | null;
  weight_grams: number | null;
  tags: string[] | null;
  is_active: boolean;
}

export interface OrderItemInput {
  dish_id: string;
  quantity: number;
}

export type CreateOrderResult = {
  order_id: string;
  status: string;
  total_price: number;
  [key: string]: unknown;
};

export interface MenuResourcePayload {
  updated_at: string;
  dishes_count: number;
  dishes: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    nutrition: {
      calories: number | null;
      proteins: number | null;
      fats: number | null;
      carbs: number | null;
      weight_grams: number | null;
    };
    tags: string[];
  }>;
}
