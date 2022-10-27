CREATE TABLE public.referrals(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"referreruserid" UUID REFERENCES public.users (id),
	"referralphonenumber" character varying(255) NOT NULL,
    "status" character varying(255) NOT NULL,
    "createdat" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedat" timestamp with time zone NOT NULL,
    "deletedat" timestamp with time zone,
    CONSTRAINT pkey_referrals PRIMARY KEY (id)
);