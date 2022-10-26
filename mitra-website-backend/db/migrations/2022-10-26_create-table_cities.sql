CREATE TABLE public.cities(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" character varying(255) NOT NULL,
    "pincode" character varying(255) NOT NULL,
    "stateName" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    CONSTRAINT pkey_cities PRIMARY KEY (id)
);