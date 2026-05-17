import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("🌱 Starting seed...\n");

  // ─── 1. Seed Users ────────────────────────────────────────────
  console.log("👤 Seeding users...");

  const usersData = [
    { name: "System Admin", email: "admin@system.com", password: "admin123", role: "admin" },
    { name: "John Staff", email: "staff@system.com", password: "staff123", role: "user" },
    { name: "Sarah Coordinator", email: "sarah@system.com", password: "sarah123", role: "user" },
  ];

  const { data: users, error: usersErr } = await supabase
    .from("users")
    .upsert(usersData, { onConflict: "email" })
    .select();

  if (usersErr) {
    console.error("❌ Error seeding users:", usersErr.message);
    return;
  }
  console.log(`   ✅ ${users.length} users seeded`);

  const adminUser = users.find((u) => u.role === "admin");
  const staffJohn = users.find((u) => u.email === "staff@system.com");
  const staffSarah = users.find((u) => u.email === "sarah@system.com");

  // ─── 2. Seed Events ───────────────────────────────────────────
  console.log("📅 Seeding events...");

  const eventsData = [
    {
      name: "Music Festival 2026",
      date: "2026-06-15",
      time: "18:00",
      location: "Gelora Bung Karno",
      description: "Annual music festival featuring top artists from across the nation.",
    },
    {
      name: "Tech Conference",
      date: "2026-08-20",
      time: "09:00",
      location: "JIExpo Kemayoran",
      description: "International tech conference with speakers from leading companies.",
    },
    {
      name: "Art Exhibition",
      date: "2026-09-10",
      time: "10:00",
      location: "Museum MACAN",
      description: "Contemporary art exhibition showcasing works from emerging artists.",
    },
  ];

  const { data: events, error: eventsErr } = await supabase
    .from("events")
    .insert(eventsData)
    .select();

  if (eventsErr) {
    console.error("❌ Error seeding events:", eventsErr.message);
    return;
  }
  console.log(`   ✅ ${events.length} events seeded`);

  // ─── 3. Seed Tickets ──────────────────────────────────────────
  console.log("🎫 Seeding tickets...");

  const ticketsData = [
    // Music Festival tickets
    { event_id: events[0].id, name: "VIP", price: 1500000, total_quota: 500, sold: 350, scanned: 200 },
    { event_id: events[0].id, name: "Regular", price: 500000, total_quota: 2000, sold: 1800, scanned: 1500 },
    // Tech Conference tickets
    { event_id: events[1].id, name: "Early Bird", price: 750000, total_quota: 1000, sold: 1000, scanned: 0 },
    { event_id: events[1].id, name: "Standard", price: 900000, total_quota: 1500, sold: 200, scanned: 0 },
    // Art Exhibition tickets
    { event_id: events[2].id, name: "General", price: 150000, total_quota: 800, sold: 320, scanned: 150 },
    { event_id: events[2].id, name: "Student", price: 75000, total_quota: 500, sold: 480, scanned: 400 },
  ];

  const { data: tickets, error: ticketsErr } = await supabase
    .from("tickets")
    .insert(ticketsData)
    .select();

  if (ticketsErr) {
    console.error("❌ Error seeding tickets:", ticketsErr.message);
    return;
  }
  console.log(`   ✅ ${tickets.length} tickets seeded`);

  // ─── 4. Seed Staff Assignments ─────────────────────────────────
  console.log("🔗 Seeding staff assignments...");

  const staffData = [
    { event_id: events[0].id, user_id: staffJohn!.id },
    { event_id: events[1].id, user_id: staffJohn!.id },
    { event_id: events[1].id, user_id: staffSarah!.id },
    { event_id: events[2].id, user_id: staffSarah!.id },
  ];

  const { data: staff, error: staffErr } = await supabase
    .from("event_staff")
    .insert(staffData)
    .select();

  if (staffErr) {
    console.error("❌ Error seeding staff assignments:", staffErr.message);
    return;
  }
  console.log(`   ✅ ${staff.length} staff assignments seeded`);

  // ─── Summary ───────────────────────────────────────────────────
  console.log("\n🎉 Seed completed successfully!");
  console.log("────────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Admin : admin@system.com / admin123");
  console.log("  Staff : staff@system.com / staff123");
  console.log("  Staff : sarah@system.com / sarah123");
  console.log("────────────────────────────────────");
}

seed().catch(console.error);
