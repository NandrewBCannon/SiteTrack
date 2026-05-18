insert into sites (id, name, address, client_name, job_number) values
('00000000-0000-0000-0000-000000000101', 'Harbour Exchange Fitout', '24 Barangaroo Ave, Sydney NSW', 'Northline Property Group', 'HX-2408'),
('00000000-0000-0000-0000-000000000102', 'Metro Health Level 5 Upgrade', '88 George St, Parramatta NSW', 'Metro Health', 'MH-5102');

insert into buildings (id, site_id, name) values
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Tower A'),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Podium'),
('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000102', 'Clinical Wing');

insert into rooms (id, building_id, room_number, room_name, floor) values
('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'L12-1210', 'Boardroom', '12'),
('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 'L12-1242', 'Comms Closet', '12'),
('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000202', 'P1-018', 'Reception', '1');

insert into assets (id, asset_number, serial_number, item_name, item_type, brand, model, mac_address, ip_address, switch_port, network_patch_number, site_id, building_id, room_id, location_in_room, patching_details, status, notes) values
('00000000-0000-0000-0000-000000000401', 'HX-AUD-1201', 'SHM8A92103', 'Ceiling Microphone Array', 'Audio', 'Shure', 'MXA920', '00:0E:DD:A9:21:03', '10.12.40.33', 'SW12-18', 'AUD-12-04', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000301', 'Ceiling grid C4 above board table', 'Patch AUD-12-04 to DSP input 3, PoE port SW12-18', 'installed', 'Commissioned and labelled.'),
('00000000-0000-0000-0000-000000000402', 'HX-NET-0448', 'C9300LFTX448', 'Access Switch', 'Network', 'Cisco', 'C9300L-48P', 'D4:AD:BD:44:80:10', '10.12.0.2', 'Stack member 1', 'PP-B 1-48', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000302', 'Rack B, RU 18-19', 'Uplinks FIB-12A/B. Patch panel PP-B ports 1-48.', 'moved', 'Moved from temporary rack after comms room handover.');

insert into asset_photos (asset_id, photo_url, caption) values
('00000000-0000-0000-0000-000000000401', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80', 'Boardroom install position'),
('00000000-0000-0000-0000-000000000402', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80', 'Rack B final location');

insert into asset_logs (asset_id, action_type, previous_location, new_location, notes, user_name) values
('00000000-0000-0000-0000-000000000401', 'Installed', 'Staging area', 'Tower A > L12-1210 > Ceiling grid C4 above board table', 'Installed, patched, and tested.', 'Sam Lee'),
('00000000-0000-0000-0000-000000000402', 'Moved', 'Tower A > L12-1242 > Temporary rack', 'Tower A > L12-1242 > Rack B, RU 18-19', 'Moved after permanent rack was powered.', 'Mia Patel');
