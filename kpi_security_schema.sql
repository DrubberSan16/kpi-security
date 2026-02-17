--
-- PostgreSQL database dump
--

\restrict wESUKVlMcPfzhV611W0MNZaPQwbPiiCZ2hp4QJfsT8vZ8TaZipgR5PNu4DAG2t3

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.8 (Ubuntu 17.8-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: kpi_security; Type: SCHEMA; Schema: -; Owner: upadmin
--

CREATE SCHEMA kpi_security;


ALTER SCHEMA kpi_security OWNER TO upadmin;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: kpi_security; Owner: upadmin
--

CREATE FUNCTION kpi_security.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION kpi_security.set_updated_at() OWNER TO upadmin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tb_log_transact; Type: TABLE; Schema: kpi_security; Owner: upadmin
--

CREATE TABLE kpi_security.tb_log_transact (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_microservice character varying(100) NOT NULL,
    type_log text,
    description text,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by text
);


ALTER TABLE kpi_security.tb_log_transact OWNER TO upadmin;

--
-- Name: tb_menu; Type: TABLE; Schema: kpi_security; Owner: upadmin
--

CREATE TABLE kpi_security.tb_menu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    menu_id uuid,
    url_component text,
    menu_position bigint NOT NULL,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by text,
    icon text
);


ALTER TABLE kpi_security.tb_menu OWNER TO upadmin;

--
-- Name: tb_menu_role; Type: TABLE; Schema: kpi_security; Owner: upadmin
--

CREATE TABLE kpi_security.tb_menu_role (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    menu_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    is_delete boolean DEFAULT false NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by text,
    is_readed boolean,
    is_created boolean,
    is_edited boolean,
    is_deleted boolean,
    is_reports boolean,
    reports_permit text
);


ALTER TABLE kpi_security.tb_menu_role OWNER TO upadmin;

--
-- Name: tb_menu_user; Type: TABLE; Schema: kpi_security; Owner: upadmin
--

CREATE TABLE kpi_security.tb_menu_user (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    menu_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    is_delete boolean DEFAULT false NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by text,
    is_readed boolean,
    is_created boolean,
    is_edited boolean,
    is_deleted boolean,
    is_reports boolean,
    reports_permit text
);


ALTER TABLE kpi_security.tb_menu_user OWNER TO upadmin;

--
-- Name: tb_role; Type: TABLE; Schema: kpi_security; Owner: upadmin
--

CREATE TABLE kpi_security.tb_role (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by text
);


ALTER TABLE kpi_security.tb_role OWNER TO upadmin;

--
-- Name: tb_user; Type: TABLE; Schema: kpi_security; Owner: upadmin
--

CREATE TABLE kpi_security.tb_user (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_user text NOT NULL,
    pass_user text NOT NULL,
    token_active text,
    name_surname text NOT NULL,
    date_birthday date,
    role_id uuid NOT NULL,
    email text NOT NULL,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_by text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by text
);


ALTER TABLE kpi_security.tb_user OWNER TO upadmin;

--
-- Name: tb_log_transact tb_log_transact_pkey; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_log_transact
    ADD CONSTRAINT tb_log_transact_pkey PRIMARY KEY (id);


--
-- Name: tb_menu tb_menu_nombre_key; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu
    ADD CONSTRAINT tb_menu_nombre_key UNIQUE (nombre);


--
-- Name: tb_menu tb_menu_pkey; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu
    ADD CONSTRAINT tb_menu_pkey PRIMARY KEY (id);


--
-- Name: tb_menu_role tb_menu_role_pkey; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu_role
    ADD CONSTRAINT tb_menu_role_pkey PRIMARY KEY (id);


--
-- Name: tb_menu_user tb_menu_user_pkey; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu_user
    ADD CONSTRAINT tb_menu_user_pkey PRIMARY KEY (id);


--
-- Name: tb_role tb_role_nombre_key; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_role
    ADD CONSTRAINT tb_role_nombre_key UNIQUE (nombre);


--
-- Name: tb_role tb_role_pkey; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_role
    ADD CONSTRAINT tb_role_pkey PRIMARY KEY (id);


--
-- Name: tb_user tb_user_pkey; Type: CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_user
    ADD CONSTRAINT tb_user_pkey PRIMARY KEY (id);


--
-- Name: idx_tb_log_transact_created_at; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_log_transact_created_at ON kpi_security.tb_log_transact USING btree (created_at);


--
-- Name: idx_tb_log_transact_is_deleted; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_log_transact_is_deleted ON kpi_security.tb_log_transact USING btree (is_deleted);


--
-- Name: idx_tb_menu_created_at; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_created_at ON kpi_security.tb_menu USING btree (created_at);


--
-- Name: idx_tb_menu_is_deleted; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_is_deleted ON kpi_security.tb_menu USING btree (is_deleted);


--
-- Name: idx_tb_menu_role_created_at; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_role_created_at ON kpi_security.tb_menu_role USING btree (created_at);


--
-- Name: idx_tb_menu_role_is_deleted; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_role_is_deleted ON kpi_security.tb_menu_role USING btree (is_delete);


--
-- Name: idx_tb_menu_role_menu_id; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_role_menu_id ON kpi_security.tb_menu_role USING btree (menu_id);


--
-- Name: idx_tb_menu_role_role_id; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_role_role_id ON kpi_security.tb_menu_role USING btree (role_id);


--
-- Name: idx_tb_menu_user_created_at; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_user_created_at ON kpi_security.tb_menu_user USING btree (created_at);


--
-- Name: idx_tb_menu_user_is_deleted; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_user_is_deleted ON kpi_security.tb_menu_user USING btree (is_delete);


--
-- Name: idx_tb_menu_user_menu_id; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_user_menu_id ON kpi_security.tb_menu_user USING btree (menu_id);


--
-- Name: idx_tb_menu_user_user_id; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_menu_user_user_id ON kpi_security.tb_menu_user USING btree (user_id);


--
-- Name: idx_tb_role_created_at; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_role_created_at ON kpi_security.tb_role USING btree (created_at);


--
-- Name: idx_tb_role_is_deleted; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_role_is_deleted ON kpi_security.tb_role USING btree (is_deleted);


--
-- Name: idx_tb_user_created_at; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_user_created_at ON kpi_security.tb_user USING btree (created_at);


--
-- Name: idx_tb_user_is_deleted; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_user_is_deleted ON kpi_security.tb_user USING btree (is_deleted);


--
-- Name: idx_tb_user_role_id; Type: INDEX; Schema: kpi_security; Owner: upadmin
--

CREATE INDEX idx_tb_user_role_id ON kpi_security.tb_user USING btree (role_id);


--
-- Name: tb_log_transact trg_tb_log_transact_updated_at; Type: TRIGGER; Schema: kpi_security; Owner: upadmin
--

CREATE TRIGGER trg_tb_log_transact_updated_at BEFORE UPDATE ON kpi_security.tb_log_transact FOR EACH ROW EXECUTE FUNCTION kpi_security.set_updated_at();


--
-- Name: tb_menu_role trg_tb_menu_role_updated_at; Type: TRIGGER; Schema: kpi_security; Owner: upadmin
--

CREATE TRIGGER trg_tb_menu_role_updated_at BEFORE UPDATE ON kpi_security.tb_menu_role FOR EACH ROW EXECUTE FUNCTION kpi_security.set_updated_at();


--
-- Name: tb_menu trg_tb_menu_updated_at; Type: TRIGGER; Schema: kpi_security; Owner: upadmin
--

CREATE TRIGGER trg_tb_menu_updated_at BEFORE UPDATE ON kpi_security.tb_menu FOR EACH ROW EXECUTE FUNCTION kpi_security.set_updated_at();


--
-- Name: tb_menu_user trg_tb_menu_user_updated_at; Type: TRIGGER; Schema: kpi_security; Owner: upadmin
--

CREATE TRIGGER trg_tb_menu_user_updated_at BEFORE UPDATE ON kpi_security.tb_menu_user FOR EACH ROW EXECUTE FUNCTION kpi_security.set_updated_at();


--
-- Name: tb_role trg_tb_role_updated_at; Type: TRIGGER; Schema: kpi_security; Owner: upadmin
--

CREATE TRIGGER trg_tb_role_updated_at BEFORE UPDATE ON kpi_security.tb_role FOR EACH ROW EXECUTE FUNCTION kpi_security.set_updated_at();


--
-- Name: tb_user trg_tb_user_updated_at; Type: TRIGGER; Schema: kpi_security; Owner: upadmin
--

CREATE TRIGGER trg_tb_user_updated_at BEFORE UPDATE ON kpi_security.tb_user FOR EACH ROW EXECUTE FUNCTION kpi_security.set_updated_at();


--
-- Name: tb_menu_role fk_menu_role_menu; Type: FK CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu_role
    ADD CONSTRAINT fk_menu_role_menu FOREIGN KEY (menu_id) REFERENCES kpi_security.tb_menu(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tb_menu_role fk_menu_role_role; Type: FK CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu_role
    ADD CONSTRAINT fk_menu_role_role FOREIGN KEY (role_id) REFERENCES kpi_security.tb_role(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tb_menu_user fk_menu_user_menu; Type: FK CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu_user
    ADD CONSTRAINT fk_menu_user_menu FOREIGN KEY (menu_id) REFERENCES kpi_security.tb_menu(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tb_menu_user fk_menu_user_user; Type: FK CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_menu_user
    ADD CONSTRAINT fk_menu_user_user FOREIGN KEY (user_id) REFERENCES kpi_security.tb_user(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tb_user fk_user_role; Type: FK CONSTRAINT; Schema: kpi_security; Owner: upadmin
--

ALTER TABLE ONLY kpi_security.tb_user
    ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES kpi_security.tb_role(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict wESUKVlMcPfzhV611W0MNZaPQwbPiiCZ2hp4QJfsT8vZ8TaZipgR5PNu4DAG2t3

