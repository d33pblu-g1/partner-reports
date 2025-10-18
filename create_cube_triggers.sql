-- Triggers to Auto-Update Data Cubes on Data Changes
-- Only refreshes cubes when relevant data is modified

USE partner_report;

-- ============================================================================
-- TRIGGERS FOR CLIENTS TABLE
-- ============================================================================

DROP TRIGGER IF EXISTS after_client_insert;
DELIMITER //
CREATE TRIGGER after_client_insert
AFTER INSERT ON clients
FOR EACH ROW
BEGIN
    CALL refresh_partner_cubes(NEW.partnerId);
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_client_update;
DELIMITER //
CREATE TRIGGER after_client_update
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
    -- Refresh old partner's cubes if partner changed
    IF OLD.partnerId != NEW.partnerId THEN
        CALL refresh_partner_cubes(OLD.partnerId);
    END IF;
    -- Refresh new partner's cubes
    CALL refresh_partner_cubes(NEW.partnerId);
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_client_delete;
DELIMITER //
CREATE TRIGGER after_client_delete
AFTER DELETE ON clients
FOR EACH ROW
BEGIN
    CALL refresh_partner_cubes(OLD.partnerId);
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS FOR TRADES TABLE
-- ============================================================================

DROP TRIGGER IF EXISTS after_trade_insert;
DELIMITER //
CREATE TRIGGER after_trade_insert
AFTER INSERT ON trades
FOR EACH ROW
BEGIN
    DECLARE v_partner_id VARCHAR(20);
    
    -- Get partner_id from client
    SELECT partnerId INTO v_partner_id
    FROM clients
    WHERE binary_user_id = NEW.binary_user_id
    LIMIT 1;
    
    IF v_partner_id IS NOT NULL THEN
        CALL refresh_partner_cubes(v_partner_id);
        CALL refresh_commissions_cubes(v_partner_id);
    END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_trade_update;
DELIMITER //
CREATE TRIGGER after_trade_update
AFTER UPDATE ON trades
FOR EACH ROW
BEGIN
    DECLARE v_partner_id VARCHAR(20);
    
    -- Get partner_id from client
    SELECT partnerId INTO v_partner_id
    FROM clients
    WHERE binary_user_id = NEW.binary_user_id
    LIMIT 1;
    
    IF v_partner_id IS NOT NULL THEN
        CALL refresh_partner_cubes(v_partner_id);
        CALL refresh_commissions_cubes(v_partner_id);
    END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_trade_delete;
DELIMITER //
CREATE TRIGGER after_trade_delete
AFTER DELETE ON trades
FOR EACH ROW
BEGIN
    DECLARE v_partner_id VARCHAR(20);
    
    -- Get partner_id from client
    SELECT partnerId INTO v_partner_id
    FROM clients
    WHERE binary_user_id = OLD.binary_user_id
    LIMIT 1;
    
    IF v_partner_id IS NOT NULL THEN
        CALL refresh_partner_cubes(v_partner_id);
        CALL refresh_commissions_cubes(v_partner_id);
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS FOR DEPOSITS TABLE
-- ============================================================================

DROP TRIGGER IF EXISTS after_deposit_insert;
DELIMITER //
CREATE TRIGGER after_deposit_insert
AFTER INSERT ON deposits
FOR EACH ROW
BEGIN
    IF NEW.affiliate_id IS NOT NULL THEN
        CALL refresh_partner_cubes(NEW.affiliate_id);
    END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_deposit_update;
DELIMITER //
CREATE TRIGGER after_deposit_update
AFTER UPDATE ON deposits
FOR EACH ROW
BEGIN
    -- Refresh old affiliate if changed
    IF OLD.affiliate_id != NEW.affiliate_id THEN
        IF OLD.affiliate_id IS NOT NULL THEN
            CALL refresh_partner_cubes(OLD.affiliate_id);
        END IF;
    END IF;
    -- Refresh new affiliate
    IF NEW.affiliate_id IS NOT NULL THEN
        CALL refresh_partner_cubes(NEW.affiliate_id);
    END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_deposit_delete;
DELIMITER //
CREATE TRIGGER after_deposit_delete
AFTER DELETE ON deposits
FOR EACH ROW
BEGIN
    IF OLD.affiliate_id IS NOT NULL THEN
        CALL refresh_partner_cubes(OLD.affiliate_id);
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS FOR PARTNER_BADGES TABLE
-- ============================================================================

DROP TRIGGER IF EXISTS after_badge_insert;
DELIMITER //
CREATE TRIGGER after_badge_insert
AFTER INSERT ON partner_badges
FOR EACH ROW
BEGIN
    -- Only update badge progress cube (lighter operation)
    UPDATE cube_badge_progress
    SET badges_earned = badges_earned + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE partner_id = NEW.partner_id;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_badge_delete;
DELIMITER //
CREATE TRIGGER after_badge_delete
AFTER DELETE ON partner_badges
FOR EACH ROW
BEGIN
    -- Only update badge progress cube (lighter operation)
    UPDATE cube_badge_progress
    SET badges_earned = badges_earned - 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE partner_id = OLD.partner_id;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS FOR PARTNERS TABLE
-- ============================================================================

DROP TRIGGER IF EXISTS after_partner_update;
DELIMITER //
CREATE TRIGGER after_partner_update
AFTER UPDATE ON partners
FOR EACH ROW
BEGIN
    -- Update partner info in dashboard cube
    UPDATE cube_partner_dashboard
    SET partner_name = NEW.name,
        partner_tier = NEW.tier,
        last_updated = CURRENT_TIMESTAMP
    WHERE partner_id = NEW.partner_id;
END //
DELIMITER ;

-- Show created triggers
SELECT 'All cube triggers created successfully' as status;
SHOW TRIGGERS WHERE `Table` IN ('clients', 'trades', 'deposits', 'partner_badges', 'partners');

