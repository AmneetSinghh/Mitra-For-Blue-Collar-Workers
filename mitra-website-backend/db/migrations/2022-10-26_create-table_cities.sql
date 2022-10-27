CREATE TABLE public.cities(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" character varying(255) NOT NULL,
    "pincode" character varying(255) NOT NULL,
    "statename" character varying(255) NOT NULL,
    "createdat" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedat" timestamp with time zone NOT NULL,
    "deletedat" timestamp with time zone,
    CONSTRAINT pkey_cities PRIMARY KEY (id)
);