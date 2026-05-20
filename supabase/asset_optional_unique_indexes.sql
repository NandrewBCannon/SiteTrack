-- Repair asset uniqueness so optional blank fields do not collide.
-- Asset number stays unique per workspace; optional serial/network fields only
-- become unique when they contain real text.

alter table assets drop constraint if exists assets_asset_number_key;

drop index if exists assets_workspace_asset_number_unique;
create unique index assets_workspace_asset_number_unique
on assets(workspace_id, lower(asset_number))
where workspace_id is not null and nullif(trim(asset_number), '') is not null;

drop index if exists assets_workspace_serial_number_unique;
create unique index assets_workspace_serial_number_unique
on assets(workspace_id, lower(serial_number))
where workspace_id is not null and nullif(trim(serial_number), '') is not null;

drop index if exists assets_workspace_mac_address_unique;
create unique index assets_workspace_mac_address_unique
on assets(workspace_id, lower(replace(replace(mac_address, ':', ''), '-', '')))
where workspace_id is not null and nullif(trim(mac_address), '') is not null;

drop index if exists assets_workspace_ip_address_unique;
create unique index assets_workspace_ip_address_unique
on assets(workspace_id, lower(ip_address))
where workspace_id is not null and nullif(trim(ip_address), '') is not null;

drop index if exists assets_site_switch_port_unique;
create unique index assets_site_switch_port_unique
on assets(site_id, lower(replace(switch_port, ' ', '')))
where site_id is not null and nullif(trim(switch_port), '') is not null;

drop index if exists assets_site_network_patch_unique;
create unique index assets_site_network_patch_unique
on assets(site_id, lower(replace(network_patch_number, ' ', '')))
where site_id is not null and nullif(trim(network_patch_number), '') is not null;

update assets
set
  serial_number = nullif(trim(serial_number), ''),
  item_type = nullif(trim(item_type), ''),
  brand = nullif(trim(brand), ''),
  model = nullif(trim(model), ''),
  mac_address = nullif(trim(mac_address), ''),
  ip_address = nullif(trim(ip_address), ''),
  switch_port = nullif(trim(switch_port), ''),
  network_patch_number = nullif(trim(network_patch_number), ''),
  location_in_room = nullif(trim(location_in_room), ''),
  patching_details = nullif(trim(patching_details), ''),
  notes = nullif(trim(notes), '');
