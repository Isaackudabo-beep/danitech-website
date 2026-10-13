-- Optional one-time migration of the existing public content into the admin-managed tables.
-- Run after schema.sql on the intended Neon branch. Each table is seeded only when empty.

INSERT INTO projects (name, slug, description, status, screenshot_url, display_order, is_published)
SELECT v.name, v.slug, v.description, v.status, v.screenshot_url, v.display_order, true
FROM (VALUES
  ('FarmLink', 'farmlink', 'FarmLink is Dani-Tech''s digital agricultural marketplace connecting farmers, buyers and verified Dani-Tech agents. It enables farmers to list produce, buyers to discover trusted suppliers, and agents to coordinate pickups and deliveries. The platform promotes transparent pricing and efficient agricultural trade across Nigeria.', '80% Completed', '/images/farmlink.jpg', 1),
  ('ConversaAI', 'conversaai', 'ConversaAI is Dani-Tech''s intelligent customer engagement platform that helps businesses respond to customers 24/7 through websites and WhatsApp. It answers questions, recommends products and services, captures qualified leads, assists with bookings, and delivers AI-powered customer support tailored to each business.', 'Currently in Development', '/images/ConversaAI.png', 2),
  ('Threndz', 'threndz', 'Threndz is Dani-Tech''s next-generation creator platform combining social media, music streaming and video sharing into one ecosystem. It empowers creators to publish content, grow communities and monetize their audience.', 'Coming Soon • 2027', '/images/threndz1.jpg', 3),
  ('Climax AI', 'climax-ai', 'Climax AI is Dani-Tech''s future AI ecosystem designed to deliver intelligent automation, productivity tools and advanced AI assistants for businesses, developers and everyday users.', 'Coming Soon', '/images/climax.jpg', 4),
  ('DowealthHR', 'dowealthhr', 'DowealthHR is a Human Resources Management System developed through a strategic partnership between Dani-Tech and Dowealth Training & Consulting. It brings employee management, attendance tracking, KPI and performance management, payslips, recruitment and other essential workforce tools together in one connected platform.', 'Currently in Development', '/images/dowealthhr.png', 5),
  ('AI Lab', 'ai-lab', 'The Dani-Tech AI Lab is our future research division focused on artificial intelligence, robotics, smart home automation, autonomous systems and next-generation technologies that will shape the future.', 'Coming Soon', '/images/Ailabs.png', 6)
) AS v(name, slug, description, status, screenshot_url, display_order)
WHERE NOT EXISTS (SELECT 1 FROM projects);

INSERT INTO team_members (name, role, bio, image_url, highlights, social_links, display_order, is_published)
SELECT v.name, v.role, v.bio, v.image_url, v.highlights::jsonb, v.social_links::jsonb, v.display_order, true
FROM (VALUES
  ('Oloruntoba Daniel Abiodun', 'Founder • The Future Builder', 'Oloruntoba Daniel Abiodun is the Founder of Dani-Tech, a technology innovation company committed to building intelligent software, artificial intelligence, robotics and future digital solutions. Guided by a vision to solve real-world problems through technology, he leads the company''s long-term mission of creating products that improve lives, empower businesses and shape the future of Africa and beyond.', '/images/ceo.jpg', '["Company vision","Technology innovation"]', '[]', 1),
  ('Kudabo Isaac Oloruntoba', 'Chief Executive Officer (CEO)', 'Kudabo Isaac Oloruntoba serves as the Chief Executive Officer of Dani-Tech, providing strategic leadership and driving the company''s growth. He oversees business operations, product execution, partnerships and organizational development, ensuring Dani-Tech delivers innovative technology solutions that create lasting value for businesses and communities.', '/images/ceo2.jpg', '["Executive Leadership","Business Strategy","Product Management","Strategic Partnerships"]', '[{"label":"Email","url":"mailto:fufillmentkudabo@gmail.com"},{"label":"WhatsApp","url":"https://wa.me/2347064773900"}]', 2),
  ('Stephanie Dominic', 'Chief Technology Officer (CTO)', 'Stephanie Dominic, popularly known as The Tech Steph, serves as the Chief Technology Officer of Dani-Tech. She leads the company''s software engineering, front-end development and technical innovation, transforming ideas into modern, user-friendly digital experiences. Her passion for technology and continuous learning supports Dani-Tech''s vision of building world-class software, AI and future technologies.', '/images/stephanie%20pics.jpg', '["Software Engineering","Front-end Development","Technical Architecture","Product Innovation"]', '[{"label":"Email","url":"mailto:thetechsteph@gmail.com"},{"label":"X","url":"https://x.com/thetechsteph"},{"label":"Instagram","url":"https://www.instagram.com/thetechsteph"},{"label":"LinkedIn","url":"https://www.linkedin.com/in/stephanie-dominic-07415025b"}]', 3)
) AS v(name, role, bio, image_url, highlights, social_links, display_order)
WHERE NOT EXISTS (SELECT 1 FROM team_members);

INSERT INTO testimonials (author_name, author_role, quote, image_url, display_order, is_published)
SELECT v.author_name, v.author_role, v.quote, v.image_url, v.display_order, true
FROM (VALUES
  ('Dowealth Training & Consulting', 'HR & Business Consulting', 'Dani-Tech designed and developed our official company website, manages our Facebook content strategy, and is currently developing a Human Resource Management System (HRMS) tailored to our operations. Their professionalism, creativity and dedication have made them a trusted technology partner.', '/images/dowealth.jpg', 1),
  ('DEBDAN NIG. ENTERPRISE', 'Grace-Driven Creations for Everyday Essentials', 'Dani-Tech designed our official company logo and developed our business website, helping us establish a strong digital presence. Their team understood our vision and delivered a professional brand identity that represents our range of products, including liquid wash, Izal, Jik, air cream, body cream and air fresheners.', '/images/debdan1.jpg', 2),
  ('GB Holdings', 'Real Estate & Investment Company', 'Dani-Tech designed a professional logo that perfectly represents our company''s vision and identity. Their creativity, attention to detail and commitment to quality exceeded our expectations.', '/images/gb.png', 3),
  ('RichTech', 'Strategic Technology Partner', 'RichTech and Dani-Tech have entered a strategic partnership to develop next-generation smart home solutions. Dani-Tech will provide intelligent home automation systems and smart appliances that will power our future real estate developments.', '/images/richtech.png', 4)
) AS v(author_name, author_role, quote, image_url, display_order)
WHERE NOT EXISTS (SELECT 1 FROM testimonials);

INSERT INTO partners (name, description, logo_url, display_order, is_published)
SELECT v.name, v.description, v.logo_url, v.display_order, true
FROM (VALUES
  ('Dowealth Training & Consulting', 'Official Website • Facebook Management • HRMS Development', '/images/dowealth.jpg', 1),
  ('DEBDAN NIG. ENTERPRISE', 'Logo Design • Official Business Website', '/images/debdan1.jpg', 2),
  ('RichTech', 'Strategic Smart Home Automation Partner', '/images/richtech.png', 3)
) AS v(name, description, logo_url, display_order)
WHERE NOT EXISTS (SELECT 1 FROM partners);
