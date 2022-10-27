CREATE TABLE public.user_sessions(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"userid" UUID REFERENCES public.users (id),
	"status" character varying(255) NOT NULL,
    "createdat" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedat" timestamp with time zone NOT NULL,
    "deletedat" timestamp with time zone,
    CONSTRAINT pkey_user_sessions PRIMARY KEY (id)
);