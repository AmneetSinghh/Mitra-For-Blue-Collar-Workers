CREATE TABLE public.referrals(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"referrerUserId" UUID REFERENCES public.users (id),
	"referralPhoneNumber" character varying(255) NOT NULL,
    "status" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    CONSTRAINT pkey_referrals PRIMARY KEY (id)
);