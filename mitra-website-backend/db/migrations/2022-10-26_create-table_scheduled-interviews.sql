CREATE TABLE public.scheduled_interviews(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"userId" UUID REFERENCES public.users (id),
	"jobId" UUID REFERENCES public.jobs (id),
	"status" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    CONSTRAINT pkey_scheduled_interviews PRIMARY KEY (id)
);