-- Check if teachers table exists and has the correct schema
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'university_portal' 
AND TABLE_NAME = 'teachers'
ORDER BY ORDINAL_POSITION;

-- Check if there are any test teachers in the database
SELECT id, teacherId, name, email, status, isEmailVerified, registrationDate
FROM teachers
ORDER BY id DESC
LIMIT 5;
