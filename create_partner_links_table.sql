-- ============================================================================
-- PARTNER LINKS TABLE FOR SOCIAL MEDIA AND PROMOTIONAL CONTENT
-- ============================================================================
-- This table stores partner social media links, YouTube channels, websites, etc.
-- Used for enhanced partner recommendations and promotional tracking
-- ============================================================================

USE partner_report;

-- CUBE: Partner Links and Social Media
DROP TABLE IF EXISTS partner_links;
CREATE TABLE partner_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20) NOT NULL,
    link_type ENUM('website', 'youtube', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'telegram', 'discord', 'other') NOT NULL,
    link_url VARCHAR(500) NOT NULL,
    link_title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    follower_count INT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE CASCADE,
    INDEX idx_partner_id (partner_id),
    INDEX idx_link_type (link_type),
    INDEX idx_is_active (is_active),
    UNIQUE KEY unique_partner_link (partner_id, link_type, link_url)
) ENGINE=InnoDB;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample links for existing partners
INSERT INTO partner_links (partner_id, link_type, link_url, link_title, description, follower_count, engagement_rate) VALUES
('P-0001', 'website', 'https://apexaffiliates.com', 'Apex Affiliates Official Website', 'Main website for Apex Affiliates trading education', 0, 0.00),
('P-0001', 'youtube', 'https://youtube.com/@apexaffiliates', 'Apex Affiliates YouTube', 'Educational trading videos and market analysis', 15000, 3.2),
('P-0001', 'telegram', 'https://t.me/apexaffiliates', 'Apex Affiliates Telegram', 'Daily market updates and trading signals', 5000, 5.8),
('P-0001', 'instagram', 'https://instagram.com/apexaffiliates', 'Apex Affiliates Instagram', 'Trading tips and market insights', 8500, 2.1),

('P-0002', 'website', 'https://brightreachmedia.com', 'BrightReach Media Website', 'Digital marketing and trading education platform', 0, 0.00),
('P-0002', 'youtube', 'https://youtube.com/@brightreachmedia', 'BrightReach Media YouTube', 'Marketing strategies and trading tutorials', 22000, 4.1),
('P-0002', 'facebook', 'https://facebook.com/brightreachmedia', 'BrightReach Media Facebook', 'Community discussions and market updates', 12000, 2.8),
('P-0002', 'linkedin', 'https://linkedin.com/company/brightreachmedia', 'BrightReach Media LinkedIn', 'Professional networking and B2B content', 3500, 1.9),

('162153', 'website', 'https://mirzatrading.com', 'Mirza Trading Website', 'Personal trading blog and educational content', 0, 0.00),
('162153', 'youtube', 'https://youtube.com/@mirzatrading', 'Mirza Trading YouTube', 'Personal trading journey and market analysis', 8500, 6.2),
('162153', 'instagram', 'https://instagram.com/mirzatrading', 'Mirza Trading Instagram', 'Daily trading updates and lifestyle content', 12000, 4.5),
('162153', 'telegram', 'https://t.me/mirzatrading', 'Mirza Trading Telegram', 'Exclusive trading signals and analysis', 3000, 8.1);

-- ============================================================================
-- USEFUL QUERIES FOR TESTING
-- ============================================================================

-- Test query: Get all links for a specific partner
-- SELECT * FROM partner_links WHERE partner_id = 'P-0001' AND is_active = TRUE;

-- Test query: Get partners with YouTube channels
-- SELECT p.name, pl.link_url, pl.follower_count, pl.engagement_rate 
-- FROM partners p 
-- JOIN partner_links pl ON p.partner_id = pl.partner_id 
-- WHERE pl.link_type = 'youtube' AND pl.is_active = TRUE;

-- Test query: Get top performing social media partners
-- SELECT p.name, pl.link_type, pl.follower_count, pl.engagement_rate
-- FROM partners p 
-- JOIN partner_links pl ON p.partner_id = pl.partner_id 
-- WHERE pl.is_active = TRUE 
-- ORDER BY pl.follower_count DESC;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
    'Partner Links Table Created Successfully' as status,
    COUNT(*) as total_links,
    COUNT(DISTINCT partner_id) as partners_with_links,
    COUNT(CASE WHEN link_type = 'youtube' THEN 1 END) as youtube_channels,
    COUNT(CASE WHEN link_type = 'website' THEN 1 END) as websites
FROM partner_links;
