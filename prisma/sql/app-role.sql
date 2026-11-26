-- Crea el rol con el que corre la app (DATABASE_URL). Ejecutar UNA vez como
-- dueño de la base, después de `npm run db:migrate`:
--
--   psql "$MIGRATION_DATABASE_URL" -v app_password="'una-clave-larga'" -f prisma/sql/app-role.sql
--
-- Por qué: en servicios gestionados (Neon, Supabase) el rol por defecto suele
-- tener BYPASSRLS, y con él las políticas no se aplican. trux_app no lo tiene.

CREATE ROLE trux_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD :app_password;

GRANT USAGE ON SCHEMA public, app TO trux_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO trux_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO trux_app;
REVOKE ALL ON TABLE "_prisma_migrations" FROM trux_app;

-- Tablas y funciones de migraciones futuras.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO trux_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT EXECUTE ON FUNCTIONS TO trux_app;
