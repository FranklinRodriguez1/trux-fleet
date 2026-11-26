-- Row Level Security de TRUX
--
-- La app abre una transacción por petición y fija el contexto con
-- set_config(..., true) (local a la transacción):
--   app.company_id  empresa del usuario en sesión
--   app.user_id     usuario en sesión
--   app.role        EMPRESA | CONDUCTOR
--   app.login_email solo durante el login, para leer ese único usuario
--
-- Sin contexto, las tablas devuelven cero filas. FORCE hace que las
-- políticas apliquen también al dueño de las tablas. El usuario de la base
-- NO debe ser superusuario ni tener BYPASSRLS.

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.company_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.company_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.user_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.role', true), '') $$;

CREATE OR REPLACE FUNCTION app.is_empresa() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT coalesce(app.role() = 'EMPRESA', false) $$;

-- companies ---------------------------------------------------------------
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" FORCE ROW LEVEL SECURITY;

CREATE POLICY companies_select ON "companies" FOR SELECT
  USING (id = app.company_id());
CREATE POLICY companies_insert ON "companies" FOR INSERT
  WITH CHECK (id = app.company_id() AND app.is_empresa());
CREATE POLICY companies_update ON "companies" FOR UPDATE
  USING (id = app.company_id() AND app.is_empresa())
  WITH CHECK (id = app.company_id());

-- users -------------------------------------------------------------------
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

-- Login: solo la fila cuyo email coincide con el que se está validando.
CREATE POLICY users_login ON "users" FOR SELECT
  USING (email = nullif(current_setting('app.login_email', true), ''));
-- Empresa ve a todo su personal; el conductor solo a sí mismo.
CREATE POLICY users_select ON "users" FOR SELECT
  USING (company_id = app.company_id() AND (app.is_empresa() OR id = app.user_id()));
CREATE POLICY users_insert ON "users" FOR INSERT
  WITH CHECK (company_id = app.company_id() AND app.is_empresa());
CREATE POLICY users_update ON "users" FOR UPDATE
  USING (company_id = app.company_id() AND app.is_empresa())
  WITH CHECK (company_id = app.company_id());
CREATE POLICY users_delete ON "users" FOR DELETE
  USING (company_id = app.company_id() AND app.is_empresa());

-- vehicles ----------------------------------------------------------------
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" FORCE ROW LEVEL SECURITY;

-- El conductor solo ve los vehículos de sus propios viajes.
CREATE POLICY vehicles_select ON "vehicles" FOR SELECT
  USING (
    company_id = app.company_id()
    AND (
      app.is_empresa()
      OR EXISTS (SELECT 1 FROM "trips" t WHERE t.vehicle_id = "vehicles".id AND t.driver_id = app.user_id())
    )
  );
CREATE POLICY vehicles_insert ON "vehicles" FOR INSERT
  WITH CHECK (company_id = app.company_id() AND app.is_empresa());
CREATE POLICY vehicles_update ON "vehicles" FOR UPDATE
  USING (company_id = app.company_id() AND app.is_empresa())
  WITH CHECK (company_id = app.company_id());
CREATE POLICY vehicles_delete ON "vehicles" FOR DELETE
  USING (company_id = app.company_id() AND app.is_empresa());

-- trips -------------------------------------------------------------------
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trips" FORCE ROW LEVEL SECURITY;

CREATE POLICY trips_select ON "trips" FOR SELECT
  USING (company_id = app.company_id() AND (app.is_empresa() OR driver_id = app.user_id()));
CREATE POLICY trips_insert ON "trips" FOR INSERT
  WITH CHECK (company_id = app.company_id() AND app.is_empresa());
-- El conductor puede actualizar solo sus viajes (qué columnas, lo decide la
-- capa de aplicación; el trigger de abajo lo refuerza).
CREATE POLICY trips_update ON "trips" FOR UPDATE
  USING (company_id = app.company_id() AND (app.is_empresa() OR driver_id = app.user_id()))
  WITH CHECK (company_id = app.company_id() AND (app.is_empresa() OR driver_id = app.user_id()));
CREATE POLICY trips_delete ON "trips" FOR DELETE
  USING (company_id = app.company_id() AND app.is_empresa());

-- Un conductor solo puede cambiar el estado y las marcas de tiempo.
CREATE OR REPLACE FUNCTION app.trips_driver_columns_guard() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NOT app.is_empresa() AND (
       NEW.origin IS DISTINCT FROM OLD.origin
    OR NEW.destination IS DISTINCT FROM OLD.destination
    OR NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id
    OR NEW.driver_id IS DISTINCT FROM OLD.driver_id
    OR NEW.company_id IS DISTINCT FROM OLD.company_id
    OR NEW.scheduled_departure IS DISTINCT FROM OLD.scheduled_departure
    OR NEW.expected_arrival IS DISTINCT FROM OLD.expected_arrival
  ) THEN
    RAISE EXCEPTION 'conductor solo puede actualizar el estado del viaje' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trips_driver_columns_guard
  BEFORE UPDATE ON "trips"
  FOR EACH ROW EXECUTE FUNCTION app.trips_driver_columns_guard();

-- trip_status_changes (auditoría, solo inserción) -------------------------
ALTER TABLE "trip_status_changes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_status_changes" FORCE ROW LEVEL SECURITY;

CREATE POLICY tsc_select ON "trip_status_changes" FOR SELECT
  USING (
    company_id = app.company_id()
    AND (
      app.is_empresa()
      OR EXISTS (SELECT 1 FROM "trips" t WHERE t.id = trip_id AND t.driver_id = app.user_id())
    )
  );
CREATE POLICY tsc_insert ON "trip_status_changes" FOR INSERT
  WITH CHECK (
    company_id = app.company_id()
    AND changed_by_id = app.user_id()
    AND (
      app.is_empresa()
      OR EXISTS (SELECT 1 FROM "trips" t WHERE t.id = trip_id AND t.driver_id = app.user_id())
    )
  );
-- Sin políticas de UPDATE ni DELETE: el historial es inmutable.
