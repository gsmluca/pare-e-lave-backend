CREATE TYPE "public"."role" AS ENUM('user', 'admin');
CREATE TYPE "public"."vehicleType" AS ENUM('car', 'motorcycle', 'suv', 'truck', 'other');
CREATE TYPE "public"."paymentMethod" AS ENUM('pix', 'cash', 'card', 'other');

CREATE TABLE "users" (
"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
"openId" varchar(64) NOT NULL UNIQUE,
"name" text,
"email" varchar(320),
"loginMethod" varchar(64),
"role" "public"."role" DEFAULT 'user' NOT NULL,
"createdAt" timestamp DEFAULT now() NOT NULL,
"updatedAt" timestamp DEFAULT now() NOT NULL,
"lastSignedIn" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "services" (
"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
"userId" integer NOT NULL REFERENCES "users"("id"),
"vehicleType" "public"."vehicleType" NOT NULL,
"clientName" varchar(255),
"description" text,
"value" numeric(10, 2) NOT NULL,
"paymentMethod" "public"."paymentMethod" NOT NULL,
"createdAt" timestamp DEFAULT now() NOT NULL,
"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "expenses" (
"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
"userId" integer NOT NULL REFERENCES "users"("id"),
"category" varchar(100) NOT NULL,
"description" text,
"amount" numeric(10, 2) NOT NULL,
"createdAt" timestamp DEFAULT now() NOT NULL,
"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ownerProfile" (
"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
"userId" integer NOT NULL UNIQUE REFERENCES "users"("id"),
"businessName" varchar(255),
"ownerFirstName" varchar(100),
"ownerLastName" varchar(100),
"phone" varchar(20),
"createdAt" timestamp DEFAULT now() NOT NULL,
"updatedAt" timestamp DEFAULT now() NOT NULL
);
