-- Create procedure to populate cube_partner_countries
DELIMITER //

CREATE PROCEDURE populate_cube_partner_countries()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clear existing data
    TRUNCATE TABLE cube_partner_countries;
    
    -- Insert partner countries data
    INSERT INTO cube_partner_countries (partner_id, country, client_count)
    SELECT 
        partnerId as partner_id,
        country,
        COUNT(*) as client_count
    FROM clients 
    WHERE country IS NOT NULL AND country != ''
    GROUP BY partnerId, country
    ORDER BY partnerId, client_count DESC;
    
    COMMIT;
    
    SELECT 'Partner countries cube populated successfully!' as message;
END //

DELIMITER ;

-- Populate the cube
CALL populate_cube_partner_countries();
