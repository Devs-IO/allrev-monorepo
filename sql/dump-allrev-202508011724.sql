--
-- PostgreSQL database cluster dump
--

-- Started on 2025-08-01 17:24:53

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE cloud_admin;
ALTER ROLE cloud_admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
CREATE ROLE neon_superuser;
ALTER ROLE neon_superuser WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB NOLOGIN REPLICATION BYPASSRLS;
CREATE ROLE neondb_owner;
ALTER ROLE neondb_owner WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;

--
-- User Configurations
--


--
-- Role memberships
--

GRANT neon_superuser TO neondb_owner WITH INHERIT TRUE GRANTED BY cloud_admin;
GRANT pg_create_subscription TO neon_superuser WITH INHERIT TRUE GRANTED BY cloud_admin;
GRANT pg_monitor TO neon_superuser WITH ADMIN OPTION, INHERIT TRUE GRANTED BY cloud_admin;
GRANT pg_read_all_data TO neon_superuser WITH INHERIT TRUE GRANTED BY cloud_admin;
GRANT pg_write_all_data TO neon_superuser WITH INHERIT TRUE GRANTED BY cloud_admin;






--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17rc1

-- Started on 2025-08-01 17:24:54

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

-- Completed on 2025-08-01 17:25:04

--
-- PostgreSQL database dump complete
--

--
-- Database "allrev" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17rc1

-- Started on 2025-08-01 17:25:04

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
-- TOC entry 3454 (class 1262 OID 16478)
-- Name: allrev; Type: DATABASE; Schema: -; Owner: neondb_owner
--

CREATE DATABASE allrev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = builtin LOCALE = 'C.UTF-8' BUILTIN_LOCALE = 'C.UTF-8';


ALTER DATABASE allrev OWNER TO neondb_owner;

\connect allrev

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
-- TOC entry 2 (class 3079 OID 24576)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3456 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 867 (class 1247 OID 90118)
-- Name: functionalities_clients_status_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.functionalities_clients_status_enum AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE'
);


ALTER TYPE public.functionalities_clients_status_enum OWNER TO neondb_owner;

--
-- TOC entry 864 (class 1247 OID 90113)
-- Name: functionalities_status_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.functionalities_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public.functionalities_status_enum OWNER TO neondb_owner;

--
-- TOC entry 891 (class 1247 OID 57505)
-- Name: tenants_payment_frequency_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.tenants_payment_frequency_enum AS ENUM (
    'monthly',
    'annual'
);


ALTER TYPE public.tenants_payment_frequency_enum OWNER TO neondb_owner;

--
-- TOC entry 894 (class 1247 OID 57518)
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.users_role_enum AS ENUM (
    'admin',
    'user',
    'manager_reviewers',
    'client',
    'assistant_reviewers',
    'none'
);


ALTER TYPE public.users_role_enum OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 57481)
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    email character varying NOT NULL,
    course character varying,
    university character varying,
    phone character varying,
    observation text,
    note text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id uuid NOT NULL,
    description character varying(500),
    deleted_at timestamp without time zone,
    institution character varying
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- TOC entry 3457 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE clients; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.clients IS 'Stores clients and their metadata';


--
-- TOC entry 223 (class 1259 OID 90125)
-- Name: functionalities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.functionalities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    minimum_price numeric(10,2) NOT NULL,
    default_assistant_price numeric(10,2),
    status public.functionalities_status_enum DEFAULT 'ACTIVE'::public.functionalities_status_enum NOT NULL,
    responsible_user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.functionalities OWNER TO neondb_owner;

--
-- TOC entry 3458 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE functionalities; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.functionalities IS 'Stores available functionalities/services offered by tenants';


--
-- TOC entry 225 (class 1259 OID 90146)
-- Name: functionalities_clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.functionalities_clients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    functionality_id uuid NOT NULL,
    client_id uuid NOT NULL,
    client_deadline date NOT NULL,
    total_price numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    status public.functionalities_clients_status_enum DEFAULT 'PENDING'::public.functionalities_clients_status_enum NOT NULL,
    paid_at date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    order_number character varying(50) NOT NULL,
    order_description character varying(1000),
    description character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.functionalities_clients OWNER TO neondb_owner;

--
-- TOC entry 3459 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE functionalities_clients; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.functionalities_clients IS 'Stores service orders and client-functionality relationships';


--
-- TOC entry 224 (class 1259 OID 90137)
-- Name: functionalities_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.functionalities_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    functionality_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assistant_deadline date NOT NULL,
    amount numeric(10,2) NOT NULL,
    paid_at date,
    is_delivered boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    order_number character varying(50),
    functionality_client_id uuid,
    description character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.functionalities_users OWNER TO neondb_owner;

--
-- TOC entry 3460 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE functionalities_users; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.functionalities_users IS 'Stores user assignments to functionalities and their payment details';


--
-- TOC entry 219 (class 1259 OID 57426)
-- Name: migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO neondb_owner;

--
-- TOC entry 218 (class 1259 OID 57425)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3461 (class 0 OID 0)
-- Dependencies: 218
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 220 (class 1259 OID 57439)
-- Name: tenants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying NOT NULL,
    company_name character varying NOT NULL,
    address character varying NOT NULL,
    phone character varying NOT NULL,
    payment_status character varying DEFAULT 'unpaid'::character varying NOT NULL,
    payment_method character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    payment_frequency public.tenants_payment_frequency_enum DEFAULT 'monthly'::public.tenants_payment_frequency_enum NOT NULL,
    payment_due_date date NOT NULL,
    logo character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    description character varying(500),
    deleted_at timestamp without time zone
);


ALTER TABLE public.tenants OWNER TO neondb_owner;

--
-- TOC entry 3462 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE tenants; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.tenants IS 'Stores tenant organizations and their subscription details';


--
-- TOC entry 221 (class 1259 OID 57467)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    photo character varying,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying NOT NULL,
    address character varying NOT NULL,
    password character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    role public.users_role_enum DEFAULT 'user'::public.users_role_enum NOT NULL,
    refresh_token character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    description character varying(500),
    deleted_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 3463 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.users IS 'Stores system users and their roles within tenants';


--
-- TOC entry 3234 (class 2604 OID 57429)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 3445 (class 0 OID 57481)
-- Dependencies: 222
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, name, email, course, university, phone, observation, note, is_active, created_at, updated_at, tenant_id, description, deleted_at, institution) FROM stdin;
c944b16d-545d-4027-b153-58b47b6502ac	Rebeca Nonato	rebecanonato89@gmail.com	Ciência Da Computação	UFLA	31994298913			t	2025-07-26 15:15:57.291	2025-07-26 15:15:57.291	7440bb28-868b-47fe-8221-24d503f05162	\N	\N	\N
\.


--
-- TOC entry 3446 (class 0 OID 90125)
-- Dependencies: 223
-- Data for Name: functionalities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.functionalities (id, tenant_id, name, description, minimum_price, default_assistant_price, status, responsible_user_id, created_at, updated_at, is_active, deleted_at) FROM stdin;
\.


--
-- TOC entry 3448 (class 0 OID 90146)
-- Dependencies: 225
-- Data for Name: functionalities_clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.functionalities_clients (id, functionality_id, client_id, client_deadline, total_price, payment_method, status, paid_at, created_at, updated_at, order_number, order_description, description, is_active, deleted_at) FROM stdin;
\.


--
-- TOC entry 3447 (class 0 OID 90137)
-- Dependencies: 224
-- Data for Name: functionalities_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.functionalities_users (id, functionality_id, user_id, assistant_deadline, amount, paid_at, is_delivered, created_at, updated_at, order_number, functionality_client_id, description, is_active, deleted_at) FROM stdin;
\.


--
-- TOC entry 3442 (class 0 OID 57426)
-- Dependencies: 219
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1747412658531	Initial1747412658531
3	1747412900000	AddFunctionalityTables1747412900000
4	1732582800000	AddOrderNumberToFunctionalityClientAndStandardizeFields1732582800000
\.


--
-- TOC entry 3443 (class 0 OID 57439)
-- Dependencies: 220
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenants (id, code, company_name, address, phone, payment_status, payment_method, is_active, payment_frequency, payment_due_date, logo, created_at, updated_at, description, deleted_at) FROM stdin;
88576f42-0fd1-4bf5-adee-a94f4a43fdc9	ALL-7687	AllRev	Lavras	31994298913	true	pix	t	annual	2099-01-01	\N	2025-07-21 19:48:11.007111	2025-07-21 19:48:11.007111	\N	\N
7440bb28-868b-47fe-8221-24d503f05162	FN456	FN Monografias	Rua Léo Rogério de Oliveira, 456, Colinas da Serra - Lavras MG		true	pix	t	annual	2041-12-26		2025-07-26 14:50:01.439	2025-07-26 14:50:01.439	\N	\N
e771ecee-0cb8-4542-bc1b-59897f363aa2	001	GMV Editora	São Paulo		QUITADO 	PIX R$ 3.000,00 (investimento)	t	annual	2026-12-31		2025-07-30 18:35:10.188	2025-07-30 18:35:10.188		\N
\.


--
-- TOC entry 3444 (class 0 OID 57467)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, tenant_id, photo, name, email, phone, address, password, is_active, role, refresh_token, created_at, updated_at, description, deleted_at) FROM stdin;
4d417f5b-9990-4733-958b-2451fecb0549	e771ecee-0cb8-4542-bc1b-59897f363aa2		Guilherme	gui@gmail.com	31998787877	São Paulo	$2b$10$JijHF/UCNmb6z2f4yepDJewEF/Q.nKCxU00iuM9ktmFf4V1x2exQq	t	manager_reviewers	$2b$10$q9SKCC40owEis6h/MbZ/S.iGLZroefx7kVvzHBGYR7PGaaXq47jz2	2025-07-30 18:58:22.128	2025-07-30 18:58:22.674144		\N
bb5fed70-198b-4b43-84bf-df3a038c217b	7440bb28-868b-47fe-8221-24d503f05162		Carolina 	carol@gmail.com	318765767676	Rua Um - São Paulo	$2b$10$pACopuU6N.C1j7q/LT3VPOLp6cC/586ZkAijPKnhmZ0cLSP148I.O	t	assistant_reviewers	$2b$10$yBP.f.Qnf1lYTt28nwUa4.LcRQkqgoT/8ij6sBNxTKrkAH0L7yrYe	2025-07-26 15:15:06.188	2025-07-26 15:15:06.732764	\N	\N
951e62b6-b96d-489b-94d5-8930ef1af18f	e771ecee-0cb8-4542-bc1b-59897f363aa2		Guilherme Mapelli Venturi	gmveditorarevnorm@gmail.com	16 98819-5555	sao paulo	$2b$10$kMHryLK6nbO/m/F89ljK4OQeL6EEAl/ph0LQKEzutjzz7g0YpL2Di	t	manager_reviewers	$2b$10$6BpkeJyr/WArSFbS2mxECO7I.PWgt4IyLRoFkGYFlOvFBQttmlE2S	2025-07-30 19:00:51.728	2025-07-30 20:51:00.763876		\N
bcefd92b-535e-4c0c-80cc-e859b951dc98	88576f42-0fd1-4bf5-adee-a94f4a43fdc9		AllRev	allrev@gmail.com	31994298913	Lavras-MG	$2b$10$bBQOu/17KyOTJx7q0NWJd.4RWI3yUOfDvfuBGUlOwbFHw5pZDeXWq	t	admin	$2b$10$tKCuAlzyxT5ORSTcPE2KO.L422XahSwi/C7w3Y0bxben4izaTRicm	2025-01-23 15:13:20.176	2025-08-01 15:59:43.480711	\N	\N
b707db3a-58b1-4389-be4c-ad9c96929090	7440bb28-868b-47fe-8221-24d503f05162		Fernanda Nonato	fnmonografias@gmail.com	31998787877	Rua Léo Rogério de Oliveira, 456	$2b$10$uzow5bbQpidcZWpNsFdfuuhU/zB9sx/ubfN0GJY7DocY6ADtHHIuu	t	manager_reviewers	$2b$10$ZJHL/HuyfCQAMmhi4vLx0ePkBHlkJUpKwa85Tedo91vQKCAVvSPNm	2025-07-26 14:50:50.435	2025-07-30 18:11:27.864839	\N	\N
\.


--
-- TOC entry 3464 (class 0 OID 0)
-- Dependencies: 218
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.migrations_id_seq', 4, true);


--
-- TOC entry 3266 (class 2606 OID 57433)
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- TOC entry 3276 (class 2606 OID 57491)
-- Name: clients PK_96da49381769303a6515a8785c7; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY (id);


--
-- TOC entry 3272 (class 2606 OID 57478)
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- TOC entry 3283 (class 2606 OID 90135)
-- Name: functionalities PK_b4e7dc4e3d4c2a1c4c7f42b5d24; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities
    ADD CONSTRAINT "PK_b4e7dc4e3d4c2a1c4c7f42b5d24" PRIMARY KEY (id);


--
-- TOC entry 3268 (class 2606 OID 57451)
-- Name: tenants PK_da8c6efd67bb301e810e56ac139; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY (id);


--
-- TOC entry 3287 (class 2606 OID 90154)
-- Name: functionalities_clients PK_functionalities_clients_id; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities_clients
    ADD CONSTRAINT "PK_functionalities_clients_id" PRIMARY KEY (id);


--
-- TOC entry 3285 (class 2606 OID 90145)
-- Name: functionalities_users PK_functionalities_users_id; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities_users
    ADD CONSTRAINT "PK_functionalities_users_id" PRIMARY KEY (id);


--
-- TOC entry 3278 (class 2606 OID 57493)
-- Name: clients UQ_6436cc6b79593760b9ef921ef12; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "UQ_6436cc6b79593760b9ef921ef12" UNIQUE (email);


--
-- TOC entry 3274 (class 2606 OID 57480)
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- TOC entry 3280 (class 2606 OID 57540)
-- Name: clients UQ_aa22377d7d3e794ae4cd39cd9e5; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "UQ_aa22377d7d3e794ae4cd39cd9e5" UNIQUE (phone);


--
-- TOC entry 3270 (class 2606 OID 57453)
-- Name: tenants UQ_b1bb8505abe259d04b317bd7999; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "UQ_b1bb8505abe259d04b317bd7999" UNIQUE (code);


--
-- TOC entry 3281 (class 1259 OID 90180)
-- Name: IDX_a8e42376b290fea2ad1463b303; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "IDX_a8e42376b290fea2ad1463b303" ON public.functionalities USING btree (tenant_id, name);


--
-- TOC entry 3288 (class 2606 OID 57541)
-- Name: users FK_109638590074998bb72a2f2cf08; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- TOC entry 3290 (class 2606 OID 90201)
-- Name: functionalities FK_27adf710e7a49a7a4dcc937e56e; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities
    ADD CONSTRAINT "FK_27adf710e7a49a7a4dcc937e56e" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- TOC entry 3294 (class 2606 OID 90191)
-- Name: functionalities_clients FK_4aac5123c153a72bd68b593b0e2; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities_clients
    ADD CONSTRAINT "FK_4aac5123c153a72bd68b593b0e2" FOREIGN KEY (functionality_id) REFERENCES public.functionalities(id);


--
-- TOC entry 3291 (class 2606 OID 90181)
-- Name: functionalities_users FK_84921423a64e913962944f49fa7; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities_users
    ADD CONSTRAINT "FK_84921423a64e913962944f49fa7" FOREIGN KEY (functionality_id) REFERENCES public.functionalities(id);


--
-- TOC entry 3292 (class 2606 OID 90186)
-- Name: functionalities_users FK_87e04f2c9305f4cc32c927f7fb8; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities_users
    ADD CONSTRAINT "FK_87e04f2c9305f4cc32c927f7fb8" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3293 (class 2606 OID 114695)
-- Name: functionalities_users FK_984239c8e54291d05413fc7bc67; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities_users
    ADD CONSTRAINT "FK_984239c8e54291d05413fc7bc67" FOREIGN KEY (functionality_client_id) REFERENCES public.functionalities_clients(id);


--
-- TOC entry 3295 (class 2606 OID 90196)
-- Name: functionalities_clients FK_d62f6319f7f5d259133fb5dadcf; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.functionalities_clients
    ADD CONSTRAINT "FK_d62f6319f7f5d259133fb5dadcf" FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 3289 (class 2606 OID 57546)
-- Name: clients FK_e7d8b637725986e7b5fa774a3fd; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "FK_e7d8b637725986e7b5fa774a3fd" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- TOC entry 3455 (class 0 OID 0)
-- Dependencies: 3454
-- Name: DATABASE allrev; Type: ACL; Schema: -; Owner: neondb_owner
--

GRANT ALL ON DATABASE allrev TO neon_superuser;


--
-- TOC entry 2092 (class 826 OID 16480)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2091 (class 826 OID 16479)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-08-01 17:25:16

--
-- PostgreSQL database dump complete
--

--
-- Database "neondb" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17rc1

-- Started on 2025-08-01 17:25:16

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
-- TOC entry 3332 (class 1262 OID 16389)
-- Name: neondb; Type: DATABASE; Schema: -; Owner: neondb_owner
--

CREATE DATABASE neondb WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = builtin LOCALE = 'C.UTF-8' BUILTIN_LOCALE = 'C.UTF-8';


ALTER DATABASE neondb OWNER TO neondb_owner;

\connect neondb

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
-- TOC entry 3333 (class 0 OID 0)
-- Dependencies: 3332
-- Name: DATABASE neondb; Type: ACL; Schema: -; Owner: neondb_owner
--

GRANT ALL ON DATABASE neondb TO neon_superuser;


--
-- TOC entry 2040 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2039 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-08-01 17:25:26

--
-- PostgreSQL database dump complete
--

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17rc1

-- Started on 2025-08-01 17:25:26

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
-- TOC entry 8 (class 2615 OID 16390)
-- Name: neon; Type: SCHEMA; Schema: -; Owner: cloud_admin
--

CREATE SCHEMA neon;


ALTER SCHEMA neon OWNER TO cloud_admin;

--
-- TOC entry 9 (class 2615 OID 16469)
-- Name: neon_migration; Type: SCHEMA; Schema: -; Owner: cloud_admin
--

CREATE SCHEMA neon_migration;


ALTER SCHEMA neon_migration OWNER TO cloud_admin;

--
-- TOC entry 3 (class 3079 OID 16430)
-- Name: neon; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS neon WITH SCHEMA neon;


--
-- TOC entry 3399 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION neon; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION neon IS 'cloud storage for PostgreSQL';


--
-- TOC entry 2 (class 3079 OID 16393)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- TOC entry 3400 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 16470)
-- Name: migration_id; Type: TABLE; Schema: neon_migration; Owner: cloud_admin
--

CREATE TABLE neon_migration.migration_id (
    key integer NOT NULL,
    id bigint DEFAULT 0 NOT NULL
);


ALTER TABLE neon_migration.migration_id OWNER TO cloud_admin;

--
-- TOC entry 229 (class 1259 OID 16462)
-- Name: health_check; Type: TABLE; Schema: public; Owner: cloud_admin
--

CREATE TABLE public.health_check (
    id integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.health_check OWNER TO cloud_admin;

--
-- TOC entry 228 (class 1259 OID 16461)
-- Name: health_check_id_seq; Type: SEQUENCE; Schema: public; Owner: cloud_admin
--

CREATE SEQUENCE public.health_check_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_check_id_seq OWNER TO cloud_admin;

--
-- TOC entry 3404 (class 0 OID 0)
-- Dependencies: 228
-- Name: health_check_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloud_admin
--

ALTER SEQUENCE public.health_check_id_seq OWNED BY public.health_check.id;


--
-- TOC entry 3232 (class 2604 OID 16465)
-- Name: health_check id; Type: DEFAULT; Schema: public; Owner: cloud_admin
--

ALTER TABLE ONLY public.health_check ALTER COLUMN id SET DEFAULT nextval('public.health_check_id_seq'::regclass);


--
-- TOC entry 3393 (class 0 OID 16470)
-- Dependencies: 230
-- Data for Name: migration_id; Type: TABLE DATA; Schema: neon_migration; Owner: cloud_admin
--

COPY neon_migration.migration_id (key, id) FROM stdin;
0	11
\.


--
-- TOC entry 3392 (class 0 OID 16462)
-- Dependencies: 229
-- Data for Name: health_check; Type: TABLE DATA; Schema: public; Owner: cloud_admin
--

COPY public.health_check (id, updated_at) FROM stdin;
1	2025-07-31 04:53:10.119964+00
\.


--
-- TOC entry 3405 (class 0 OID 0)
-- Dependencies: 228
-- Name: health_check_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloud_admin
--

SELECT pg_catalog.setval('public.health_check_id_seq', 1, false);


--
-- TOC entry 3238 (class 2606 OID 16475)
-- Name: migration_id migration_id_pkey; Type: CONSTRAINT; Schema: neon_migration; Owner: cloud_admin
--

ALTER TABLE ONLY neon_migration.migration_id
    ADD CONSTRAINT migration_id_pkey PRIMARY KEY (key);


--
-- TOC entry 3236 (class 2606 OID 16468)
-- Name: health_check health_check_pkey; Type: CONSTRAINT; Schema: public; Owner: cloud_admin
--

ALTER TABLE ONLY public.health_check
    ADD CONSTRAINT health_check_pkey PRIMARY KEY (id);


--
-- TOC entry 3401 (class 0 OID 0)
-- Dependencies: 236
-- Name: FUNCTION pg_export_snapshot(); Type: ACL; Schema: pg_catalog; Owner: cloud_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_export_snapshot() TO neon_superuser;


--
-- TOC entry 3402 (class 0 OID 0)
-- Dependencies: 235
-- Name: FUNCTION pg_log_standby_snapshot(); Type: ACL; Schema: pg_catalog; Owner: cloud_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_log_standby_snapshot() TO neon_superuser;


--
-- TOC entry 3403 (class 0 OID 0)
-- Dependencies: 231
-- Name: FUNCTION pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn); Type: ACL; Schema: pg_catalog; Owner: cloud_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn) TO neon_superuser;


-- Completed on 2025-08-01 17:25:37

--
-- PostgreSQL database dump complete
--

-- Completed on 2025-08-01 17:25:37

--
-- PostgreSQL database cluster dump complete
--

