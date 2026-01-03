-- =========================
-- EXTENSIONES (UUID) - ¡ESTO VA PRIMERO!
-- =========================
-- Instalamos la extensión como Superusuario para que esté disponible globalmente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- VARIABLES DE ENTORNO
-- =========================
-- Requiere: POSTGRES_DB, WASIGO_APP_PASSWORD, WASIGO_MIGRATOR_PASSWORD
\set ON_ERROR_STOP on
\getenv POSTGRES_DB POSTGRES_DB
\getenv WASIGO_APP_PASSWORD WASIGO_APP_PASSWORD
\getenv WASIGO_MIGRATOR_PASSWORD WASIGO_MIGRATOR_PASSWORD

\if :{?POSTGRES_DB}
\else
\echo 'POSTGRES_DB no está definido'
\quit 1
\endif
\if :{?WASIGO_APP_PASSWORD}
\else
\echo 'WASIGO_APP_PASSWORD no está definido'
\quit 1
\endif
\if :{?WASIGO_MIGRATOR_PASSWORD}
\else
\echo 'WASIGO_MIGRATOR_PASSWORD no está definido'
\quit 1
\endif

-- =========================
-- SCHEMAS
-- =========================
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS business;
CREATE SCHEMA IF NOT EXISTS audit;

-- =========================
-- ROLES
-- =========================
-- Creamos roles usando SELECT para verificar existencia (compatible con psql variables)
SELECT 'CREATE ROLE wasigo_app LOGIN PASSWORD ' || quote_literal(:'WASIGO_APP_PASSWORD')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wasigo_app') \gexec

SELECT 'CREATE ROLE wasigo_migrator LOGIN PASSWORD ' || quote_literal(:'WASIGO_MIGRATOR_PASSWORD')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wasigo_migrator') \gexec

-- =========================
-- PERMISOS DATABASE
-- =========================

GRANT CONNECT ON DATABASE :"POSTGRES_DB" TO wasigo_app, wasigo_migrator;

-- =========================
-- PERMISOS PUBLIC (CRÍTICO PARA UUID)
-- =========================
GRANT USAGE ON SCHEMA public TO wasigo_app, wasigo_migrator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO wasigo_app, wasigo_migrator;
GRANT CREATE ON SCHEMA public TO wasigo_migrator;

-- =========================
-- PERMISOS SCHEMAS & SEQUENCIAS
-- =========================

-- AUTH
GRANT USAGE ON SCHEMA auth TO wasigo_app;
GRANT USAGE, CREATE ON SCHEMA auth TO wasigo_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO wasigo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO wasigo_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO wasigo_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO wasigo_migrator;

-- BUSINESS
GRANT USAGE ON SCHEMA business TO wasigo_app;
GRANT USAGE, CREATE ON SCHEMA business TO wasigo_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA business TO wasigo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA business TO wasigo_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA business TO wasigo_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA business TO wasigo_migrator;

-- AUDIT (Solo Insert para la App)
GRANT USAGE ON SCHEMA audit TO wasigo_app;
GRANT USAGE, CREATE ON SCHEMA audit TO wasigo_migrator;

GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO wasigo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO wasigo_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO wasigo_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO wasigo_migrator;

-- PUBLIC (NECESARIO PARA TYPEORM MIGRATIONS TABLE)
-- TypeORM guarda su historial en public.migrations, así que el migrador necesita permiso aquí.
GRANT USAGE, CREATE ON SCHEMA public TO wasigo_migrator;

-- =========================
-- DEFAULT PRIVILEGES (EL FIX MAESTRO)
-- =========================
-- Esto garantiza que las tablas nuevas creadas por el Migrador sean accesibles por la App

ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA auth GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wasigo_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA auth GRANT USAGE, SELECT ON SEQUENCES TO wasigo_app;

ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA business GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wasigo_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA business GRANT USAGE, SELECT ON SEQUENCES TO wasigo_app;

-- AUDIT: SELECT + INSERT (necesario para INSERT RETURNING)
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA audit GRANT SELECT, INSERT ON TABLES TO wasigo_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA audit GRANT USAGE, SELECT ON SEQUENCES TO wasigo_app;

-- =========================
-- HARDENING
-- =========================
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE :"POSTGRES_DB" FROM PUBLIC;

-- =========================
-- TEST DATABASE SETUP
-- =========================
SELECT 'CREATE DATABASE wasigo_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wasigo_test') \gexec

\connect wasigo_test

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS business;
CREATE SCHEMA IF NOT EXISTS audit;

GRANT CONNECT ON DATABASE wasigo_test TO wasigo_app, wasigo_migrator;

GRANT USAGE ON SCHEMA public TO wasigo_app, wasigo_migrator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO wasigo_app, wasigo_migrator;
GRANT CREATE ON SCHEMA public TO wasigo_migrator;

GRANT USAGE ON SCHEMA auth TO wasigo_app;
GRANT USAGE, CREATE ON SCHEMA auth TO wasigo_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO wasigo_app;
GRANT TRUNCATE ON ALL TABLES IN SCHEMA auth TO wasigo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO wasigo_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO wasigo_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO wasigo_migrator;

GRANT USAGE ON SCHEMA business TO wasigo_app;
GRANT USAGE, CREATE ON SCHEMA business TO wasigo_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA business TO wasigo_app;
GRANT TRUNCATE ON ALL TABLES IN SCHEMA business TO wasigo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA business TO wasigo_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA business TO wasigo_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA business TO wasigo_migrator;

GRANT USAGE ON SCHEMA audit TO wasigo_app;
GRANT USAGE, CREATE ON SCHEMA audit TO wasigo_migrator;

GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO wasigo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO wasigo_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO wasigo_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO wasigo_migrator;

GRANT USAGE, CREATE ON SCHEMA public TO wasigo_migrator;

ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA auth GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO wasigo_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA auth GRANT USAGE, SELECT ON SEQUENCES TO wasigo_app;

ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA business GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO wasigo_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA business GRANT USAGE, SELECT ON SEQUENCES TO wasigo_app;

-- AUDIT: SELECT + INSERT (necesario para INSERT RETURNING)
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA audit GRANT SELECT, INSERT ON TABLES TO wasigo_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wasigo_migrator IN SCHEMA audit GRANT USAGE, SELECT ON SEQUENCES TO wasigo_app;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE wasigo_test FROM PUBLIC;
