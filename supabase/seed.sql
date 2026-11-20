-- ==============================================================================
-- AquaSustain Development & Demonstration Seed Data Script
-- NOTE: For local / staging development testing only.
-- Do NOT execute this in production environments.
-- ==============================================================================

-- 1. Insert Demo Articles
INSERT INTO public.learning_articles (
    id, slug, category, reading_time_minutes, published_date,
    author, author_role, verified_by_expert, expert_name,
    title, summary, content_markdown, tags, banner_gradient
)
VALUES
(
    '00000000-0000-0000-0000-000000000101',
    'dissolved-oxygen-predawn-drop',
    'water_management',
    6,
    CURRENT_DATE - INTERVAL '12 days',
    'Dr. K. Srinivas Rao',
    'Chief Aquaculture Extension Scientist',
    true,
    'CIBA Aquaculture Expert Panel',
    '{"en": "Managing the Critical Predawn Oxygen Dip in High-Density Shrimp Ponds", "te": "అధిక సాంద్రత రొయ్యల చెరువుల్లో వేకువజాము ఆక్సిజన్ క్షీణత నిర్వహణ", "hi": "सघन झींगा तालाबों में सुबह के समय ऑक्सीजन की गंभीर कमी का प्रबंधन"}'::jsonb,
    '{"en": "Why dissolved oxygen plummets between 03:00 and 06:00, how phytoplankton respiration drives hypoxia, and proactive paddlewheel strategies.", "te": "వేకువజాము 03:00 నుండి 06:00 మధ్య ఆక్సిజన్ ఎందుకు తగ్గుతుంది మరియు ప్యాడిల్‌వీల్ వ్యూహాలు.", "hi": "भोर में 03:00 से 06:00 के बीच घुलित ऑक्सीजन क्यों गिरती है और सक्रिय एयरेटर रणनीतियाँ।"}'::jsonb,
    '{"en": "### The Science Behind the Predawn DO Crash\nIn semi-intensive and intensive Penaeus vannamei ponds, photosynthetic algae produce copious oxygen during bright daylight. However, at night, all aquatic organisms consume oxygen via respiration...", "te": "రొయ్యల చెరువుల్లో వేకువజామున ఆక్సిజన్ స్థాయిలు పడిపోవడానికి ప్రధాన కారణం ఆల్గే శ్వాసక్రియ...", "hi": "झींगा तालाबों में रात के समय पादप प्लवक श्वसन के कारण ऑक्सीजन स्तर तेजी से गिरता है..."}'::jsonb,
    ARRAY['Dissolved Oxygen', 'Aeration', 'Vannamei', 'Water Quality', 'Predawn Hypoxia'],
    'from-teal-600 to-cyan-700'
),
(
    '00000000-0000-0000-0000-000000000102',
    'feed-tray-monitoring-fcr',
    'feed_management',
    5,
    CURRENT_DATE - INTERVAL '8 days',
    'P. Venkatasubbaiah',
    'Aqua Nutrition Specialist',
    true,
    'Marine Products Export Development Authority (MPEDA)',
    '{"en": "Optimizing Feed Conversion Ratio (FCR) Through Accurate Check-Tray Protocols", "te": "సరైన చెక్-ట్రే విధానాల ద్వారా ఫీడ్ కన్వర్షన్ రేషియో (FCR) మెరుగుపరచడం", "hi": "सटीक चेक-ट्रे प्रोटोकॉल के माध्यम से फ़ीड रूपांतरण अनुपात (FCR) को अनुकूलित करना"}'::jsonb,
    '{"en": "Feed accounts for over 60% of total crop expenditure. Master 2-hour check tray checks to eliminate waste and prevent toxic organic bottom buildup.", "te": "మొత్తం ఖర్చులో 60% మేతకే అవుతుంది. వృధాను అరికట్టేందుకు 2 గంటల చెక్ ట్రే తనిఖీలను పాటించండి.", "hi": "चारा कुल फसल खर्च का 60% से अधिक होता है। अपशिष्ट को समाप्त करने के लिए चेक ट्रे निगरानी सीखें।"}'::jsonb,
    '{"en": "### Why FCR Defines Crop Profitability\nFeed is the single largest operating expense in modern aquaculture...", "te": "ఆక్వాకల్చర్‌లో మేత ఖర్చు ప్రధానమైనది...", "hi": "आधुनिक जलीय कृषि में चारा सबसे बड़ा परिचालन व्यय है..."}'::jsonb,
    ARRAY['FCR', 'Feed Management', 'Cost Optimization', 'Check Tray', 'Bottom Soil'],
    'from-emerald-600 to-teal-800'
)
ON CONFLICT (slug) DO NOTHING;
