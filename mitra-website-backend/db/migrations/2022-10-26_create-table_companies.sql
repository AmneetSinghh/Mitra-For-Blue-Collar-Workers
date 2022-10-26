CREATE TABLE public.companies(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    CONSTRAINT pkey_companies PRIMARY KEY (id)
);


CREATE TABLE todo(
    todo_id SERIAL PRIMARY KEY,
    description VARCHAR(255)
)