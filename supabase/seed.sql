-- Demo seed data for "Паспорт дома"
-- Run this after creating a test user in Supabase Auth
-- Replace 'YOUR_USER_ID' with the actual user UUID

-- To use: after registering a user, get their UUID from auth.users table
-- and replace all instances of 'YOUR_USER_ID' below

DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID'; -- Replace with actual user UUID
  v_house_id uuid := gen_random_uuid();
  v_system_boiler_id uuid := gen_random_uuid();
  v_system_septic_id uuid := gen_random_uuid();
  v_system_water_filter_id uuid := gen_random_uuid();
  v_master_id uuid := gen_random_uuid();
  v_log1_id uuid := gen_random_uuid();
  v_log2_id uuid := gen_random_uuid();
  v_log3_id uuid := gen_random_uuid();
  v_log4_id uuid := gen_random_uuid();
BEGIN

-- House: Дом родителей
INSERT INTO houses (id, user_id, name, address, city, house_type, area, year_built)
VALUES (
  v_house_id,
  v_user_id,
  'Дом родителей',
  'ул. Садовая, 15',
  'Краснодар',
  'house',
  180,
  2015
);

-- System: Котёл
INSERT INTO systems (id, house_id, category, name, model, installed_at, last_maintenance_at, maintenance_interval_months, status, notes)
VALUES (
  v_system_boiler_id,
  v_house_id,
  'heating',
  'Газовый котёл',
  'Baxi ECO Four 24F',
  '2020-09-15',
  '2025-10-10',
  12,
  'ok',
  'Двухконтурный, настенный. Обслуживать ежегодно перед отопительным сезоном.'
);

-- System: Септик
INSERT INTO systems (id, house_id, category, name, model, installed_at, last_maintenance_at, maintenance_interval_months, status, notes)
VALUES (
  v_system_septic_id,
  v_house_id,
  'sewage',
  'Септик',
  'Топас-8',
  '2018-06-01',
  '2025-06-15',
  6,
  'attention',
  'Откачка ила каждые 6 месяцев. Проверять компрессор.'
);

-- System: Фильтр воды
INSERT INTO systems (id, house_id, category, name, model, installed_at, last_maintenance_at, maintenance_interval_months, status, notes)
VALUES (
  v_system_water_filter_id,
  v_house_id,
  'water',
  'Система фильтрации воды',
  'Аквафор Викинг 3',
  '2022-03-20',
  '2025-09-01',
  6,
  'ok',
  'Менять картриджи каждые 6 месяцев.'
);

-- Master
INSERT INTO masters (id, user_id, name, phone, specialization, notes)
VALUES (
  v_master_id,
  v_user_id,
  'Иванов Сергей',
  '+7 (918) 123-45-67',
  'Отопление, газовое оборудование',
  'Надёжный мастер, работает быстро. Рекомендован соседями.'
);

-- Maintenance logs
INSERT INTO maintenance_logs (id, house_id, system_id, master_id, date, type, comment, cost)
VALUES
  (v_log1_id, v_house_id, v_system_boiler_id, v_master_id, '2025-10-10', 'maintenance', 'Ежегодное ТО котла. Промывка теплообменника, проверка давления газа, чистка горелки.', 8500),
  (v_log2_id, v_house_id, v_system_boiler_id, v_master_id, '2024-10-05', 'maintenance', 'Плановое ТО. Замена уплотнителей, проверка автоматики.', 7000),
  (v_log3_id, v_house_id, v_system_septic_id, NULL, '2025-06-15', 'maintenance', 'Откачка ила, проверка компрессора, промывка форсунок.', 5500),
  (v_log4_id, v_house_id, v_system_water_filter_id, NULL, '2025-09-01', 'replacement', 'Замена всех трёх картриджей.', 4200);

-- Expenses (linked to maintenance logs)
INSERT INTO expenses (house_id, system_id, maintenance_log_id, date, amount, category, comment)
VALUES
  (v_house_id, v_system_boiler_id, v_log1_id, '2025-10-10', 8500, 'Обслуживание', 'ТО котла 2025'),
  (v_house_id, v_system_boiler_id, v_log2_id, '2024-10-05', 7000, 'Обслуживание', 'ТО котла 2024'),
  (v_house_id, v_system_septic_id, v_log3_id, '2025-06-15', 5500, 'Обслуживание', 'Откачка септика'),
  (v_house_id, v_system_water_filter_id, v_log4_id, '2025-09-01', 4200, 'Замена', 'Картриджи для фильтра'),
  (v_house_id, NULL, NULL, '2025-11-15', 12000, 'Материалы', 'Утепление труб на участке');

-- Reminder
INSERT INTO reminders (house_id, system_id, title, description, due_date, is_auto)
VALUES
  (v_house_id, v_system_septic_id, 'Обслуживание септика', 'Запланировать откачку ила и проверку компрессора', '2025-12-15', true),
  (v_house_id, v_system_water_filter_id, 'Замена картриджей фильтра', 'Купить и заменить картриджи Аквафор', '2026-03-01', true),
  (v_house_id, NULL, 'Проверить крышу после зимы', 'Осмотреть кровлю на предмет повреждений после снега', '2026-04-01', false);

END $$;
