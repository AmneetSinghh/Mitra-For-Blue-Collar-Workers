CREATE TABLE public.user_job_level_failures(
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	"userid" UUID REFERENCES public.users (id),
    "jobid" UUID REFERENCES public.jobs (id),
    "failurelevel" character varying(255) NOT NULL,
    "reasonoffailure" character varying(255) NOT NULL,
    "createdat" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedat" timestamp with time zone NOT NULL,
    "deletedat" timestamp with time zone,
    CONSTRAINT pkey_user_job_level_failures PRIMARY KEY (id)
);