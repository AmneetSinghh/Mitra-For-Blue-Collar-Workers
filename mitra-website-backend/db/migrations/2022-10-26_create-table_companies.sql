CREATE TABLE public.companies(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" character varying(255) NOT NULL,
    "createdat" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedat" timestamp with time zone NOT NULL,
    "deletedat" timestamp with time zone,
    CONSTRAINT pkey_companies PRIMARY KEY (id)
);