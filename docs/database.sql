-- =============================================
-- 1. PROFILES (расширение встроенного auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL,
  full_name TEXT,
  role      TEXT NOT NULL DEFAULT 'admin'
              CHECK (role IN ('admin', 'chef', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 2. PRODUCTS (ингредиенты / товары на складе)
-- =============================================
CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  unit        TEXT NOT NULL CHECK (unit IN ('кг', 'л', 'шт', 'г', 'мл')),
  min_stock   NUMERIC(10, 3) NOT NULL DEFAULT 0,
  quantity    NUMERIC(10, 3) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 3. SUPPLIES (поставки)
-- =============================================
CREATE TABLE public.supplies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity     NUMERIC(10, 3) NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(10, 2) NOT NULL CHECK (price_per_unit >= 0),
  total_price  NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  supplier     TEXT,
  arrived_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes        TEXT,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_supply_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.products
  SET quantity = quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_supply_inserted
  AFTER INSERT ON public.supplies
  FOR EACH ROW EXECUTE FUNCTION handle_supply_insert();


-- =============================================
-- 4. DISHES (блюда в меню)
-- =============================================
CREATE TABLE public.dishes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  photo_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE, 
  category    TEXT DEFAULT 'основное',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER dishes_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 5. DISH_INGREDIENTS (рецепты: связь блюд и продуктов)
-- =============================================
CREATE TABLE public.dish_ingredients (
  dish_id    UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity   NUMERIC(10, 3) NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (dish_id, product_id)
);


-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON public.profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON public.supplies
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON public.dishes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON public.dish_ingredients
  FOR ALL USING (auth.role() = 'authenticated');