import type { StoreData } from "@/lib/types";

export const seedData: StoreData = {
  sites: [
    {
      id: "site-1",
      name: "Harbour Exchange Fitout",
      address: "24 Barangaroo Ave, Sydney NSW",
      client_name: "Northline Property Group",
      job_number: "HX-2408",
      created_at: "2026-03-12T08:00:00.000Z"
    },
    {
      id: "site-2",
      name: "Metro Health Level 5 Upgrade",
      address: "88 George St, Parramatta NSW",
      client_name: "Metro Health",
      job_number: "MH-5102",
      created_at: "2026-04-04T08:00:00.000Z"
    }
  ],
  buildings: [
    { id: "building-1", site_id: "site-1", name: "Tower A", created_at: "2026-03-12T08:10:00.000Z" },
    { id: "building-2", site_id: "site-1", name: "Podium", created_at: "2026-03-12T08:12:00.000Z" },
    { id: "building-3", site_id: "site-2", name: "Clinical Wing", created_at: "2026-04-04T08:20:00.000Z" }
  ],
  rooms: [
    { id: "room-1", building_id: "building-1", room_number: "L12-1210", room_name: "Boardroom", floor: "12", created_at: "2026-03-13T08:00:00.000Z" },
    { id: "room-2", building_id: "building-1", room_number: "L12-1242", room_name: "Comms Closet", floor: "12", created_at: "2026-03-13T08:02:00.000Z" },
    { id: "room-3", building_id: "building-2", room_number: "P1-018", room_name: "Reception", floor: "1", created_at: "2026-03-13T08:04:00.000Z" },
    { id: "room-4", building_id: "building-3", room_number: "5.032", room_name: "Treatment Room", floor: "5", created_at: "2026-04-05T08:00:00.000Z" }
  ],
  assets: [
    {
      id: "asset-1",
      asset_number: "HX-AUD-1201",
      serial_number: "SHM8A92103",
      item_name: "Ceiling Microphone Array",
      item_type: "Audio",
      brand: "Shure",
      model: "MXA920",
      mac_address: "00:0E:DD:A9:21:03",
      ip_address: "10.12.40.33",
      switch_port: "SW12-18",
      network_patch_number: "AUD-12-04",
      site_id: "site-1",
      building_id: "building-1",
      room_id: "room-1",
      location_in_room: "Ceiling grid C4 above board table",
      patching_details: "Patch AUD-12-04 to DSP input 3, PoE port SW12-18",
      status: "installed",
      notes: "Commissioned and labelled. Firmware current.",
      created_at: "2026-05-02T10:12:00.000Z",
      updated_at: "2026-05-14T13:21:00.000Z"
    },
    {
      id: "asset-2",
      asset_number: "HX-NET-0448",
      serial_number: "C9300LFTX448",
      item_name: "Access Switch",
      item_type: "Network",
      brand: "Cisco",
      model: "C9300L-48P",
      mac_address: "D4:AD:BD:44:80:10",
      ip_address: "10.12.0.2",
      switch_port: "Stack member 1",
      network_patch_number: "PP-B 1-48",
      site_id: "site-1",
      building_id: "building-1",
      room_id: "room-2",
      location_in_room: "Rack B, RU 18-19",
      patching_details: "Uplinks FIB-12A/B. Patch panel PP-B ports 1-48.",
      status: "moved",
      notes: "Moved from temporary rack after comms room handover.",
      created_at: "2026-04-28T09:45:00.000Z",
      updated_at: "2026-05-15T08:33:00.000Z"
    },
    {
      id: "asset-3",
      asset_number: "MH-DSP-0503",
      serial_number: "QSC-8FLEX-503",
      item_name: "Audio DSP",
      item_type: "AV Control",
      brand: "Q-SYS",
      model: "Core 8 Flex",
      mac_address: "00:60:74:05:03:08",
      ip_address: "10.50.32.18",
      switch_port: "SW5-03",
      network_patch_number: "DSP-5.032",
      site_id: "site-2",
      building_id: "building-3",
      room_id: "room-4",
      location_in_room: "Joinery cabinet lower bay",
      patching_details: "Inputs MIC-5.032-1/2, outputs AMP-5-03A/B",
      status: "damaged",
      notes: "Front USB port damaged during joinery works. Awaiting replacement.",
      created_at: "2026-05-04T11:00:00.000Z",
      updated_at: "2026-05-16T15:10:00.000Z"
    }
  ],
  asset_photos: [
    {
      id: "photo-1",
      asset_id: "asset-1",
      photo_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
      caption: "Boardroom install position",
      created_at: "2026-05-02T10:20:00.000Z"
    },
    {
      id: "photo-2",
      asset_id: "asset-2",
      photo_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80",
      caption: "Rack B final location",
      created_at: "2026-05-15T08:42:00.000Z"
    },
    {
      id: "photo-3",
      asset_id: "asset-3",
      photo_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      caption: "Cabinet placement before damage noted",
      created_at: "2026-05-04T11:18:00.000Z"
    }
  ],
  asset_logs: [
    {
      id: "log-1",
      asset_id: "asset-1",
      action_type: "Installed",
      previous_location: "Staging area",
      new_location: "Tower A > L12-1210 > Ceiling grid C4 above board table",
      notes: "Installed, patched, and tested.",
      user_name: "Sam Lee",
      created_at: "2026-05-02T10:24:00.000Z"
    },
    {
      id: "log-2",
      asset_id: "asset-2",
      action_type: "Moved",
      previous_location: "Tower A > L12-1242 > Temporary rack",
      new_location: "Tower A > L12-1242 > Rack B, RU 18-19",
      notes: "Moved after permanent rack was powered.",
      user_name: "Mia Patel",
      created_at: "2026-05-15T08:33:00.000Z"
    },
    {
      id: "log-3",
      asset_id: "asset-3",
      action_type: "Faulty/Damaged",
      previous_location: "Clinical Wing > 5.032 > Joinery cabinet lower bay",
      new_location: "Clinical Wing > 5.032 > Joinery cabinet lower bay",
      notes: "Damage photographed and replacement requested.",
      user_name: "Alex Nguyen",
      created_at: "2026-05-16T15:10:00.000Z"
    }
  ]
};
