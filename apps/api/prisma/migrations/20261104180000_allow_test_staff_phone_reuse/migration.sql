DROP INDEX IF EXISTS "User_staffPhoneNumber_key";

CREATE UNIQUE INDEX "User_staffPhoneNumber_unique_non_test"
ON "User" ("staffPhoneNumber")
WHERE
  "staffPhoneNumber" IS NOT NULL
  AND "staffPhoneNumber" <> '09090052208';
