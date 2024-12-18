-- create postgis extension
CREATE EXTENSION postgis;

-- CreateTable
CREATE TABLE "Line" (
    "id" SERIAL NOT NULL,
    "number" TEXT,
    "name" TEXT,
    "icoCarrier" TEXT,
    "lineType" TEXT,
    "vehicleType" TEXT,
    "isDetour" BOOLEAN,
    "isGrouped" BOOLEAN,
    "isCoded" BOOLEAN,
    "reserve" TEXT,
    "license" TEXT,
    "licenseValidFrom" TIMESTAMP(3),
    "licenseValidTo" TIMESTAMP(3),
    "scheduleValidFrom" TIMESTAMP(3),
    "scheduleValidTo" TIMESTAMP(3),
    "carrierId" INTEGER,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" SERIAL NOT NULL,
    "number" INTEGER,
    "name" TEXT,
    "district" TEXT,
    "nearPoint" TEXT,
    "nearCity" TEXT,
    "country" TEXT,
    "nameNormalized" TEXT,
    "duplicateRootId" INTEGER,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "coords" geometry(Point, 4326) NOT NULL,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopConnection" (
    "id" SERIAL NOT NULL,
    "lineNumber" INTEGER,
    "connectionNumber" INTEGER,
    "tariffNumber" INTEGER,
    "stopNumber" INTEGER,
    "markerCode" TEXT,
    "stationNumber" TEXT,
    "code1" TEXT,
    "code2" TEXT,
    "kilometers" INTEGER,
    "arrival" TEXT,
    "departure" TEXT,
    "lineId" INTEGER,
    "stopId" INTEGER,
    "arrivalTime" TIMESTAMP(3),
    "departureTime" TIMESTAMP(3),

    CONSTRAINT "StopConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" SERIAL NOT NULL,
    "lineNumber" INTEGER,
    "connectionNumber" INTEGER,
    "code1" TEXT,
    "code2" TEXT,
    "code3" TEXT,
    "code4" TEXT,
    "code5" TEXT,
    "code6" TEXT,
    "code7" TEXT,
    "code8" TEXT,
    "code9" TEXT,
    "code10" TEXT,
    "connectionGroupId" INTEGER,
    "lineId" INTEGER,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Code" (
    "id" SERIAL NOT NULL,
    "internalCode" TEXT,
    "code" TEXT,
    "internal" TEXT,

    CONSTRAINT "Code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" SERIAL NOT NULL,
    "ico" TEXT,
    "dic" TEXT,
    "name" TEXT,
    "firmType" TEXT,
    "personName" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "dispatchPhone" TEXT,
    "infoPhone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_idx" ON "Stop" USING GIST ("coords");

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StopConnection" ADD CONSTRAINT "StopConnection_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StopConnection" ADD CONSTRAINT "StopConnection_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
