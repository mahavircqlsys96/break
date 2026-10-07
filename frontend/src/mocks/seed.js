// Deterministic demo data for the mock backend. Content mirrors the Figma screens
// (Al Wathba Farm, Desert Lodge, Palm Retreat, AED prices, UAE cities, etc.).

let s = 20250517;
const rand = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickSome = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);
const NOW = new Date("2026-09-29T10:00:00Z").getTime();
const DAY = 86_400_000;
const daysAgo = (d) =>
  new Date(NOW - d * DAY - int(0, 80_000_000)).toISOString();
const pad = (n, w = 4) => String(n).padStart(w, "0");

export const categories = [
  {
    id: "cat_farm",
    name: "Farms",
    nameAr: "مزارع",
    icon: "Tractor",
    active: true,
    order: 1,
  },
  {
    id: "cat_home",
    name: "Vacation Homes",
    nameAr: "بيوت العطلات",
    icon: "Home",
    active: true,
    order: 2,
  },
  {
    id: "cat_resort",
    name: "Resorts",
    nameAr: "منتجعات",
    icon: "Palmtree",
    active: true,
    order: 3,
  },
  {
    id: "cat_camp",
    name: "Desert Camp",
    nameAr: "مخيم صحراوي",
    icon: "Tent",
    active: true,
    order: 4,
  },
];

export const propertyTypes = categories.map((c) => ({
  id: c.id.replace("cat_", "pt_"),
  title: c.name,
  titleAr: c.nameAr,
  icon: c.icon,
  active: c.active,
  order: c.order,
}));

export const amenities = [
  {
    id: "am_pool",
    name: "Pool",
    nameAr: "مسبح",
    icon: "Waves",
    group: "features",
    active: true,
  },
  {
    id: "am_wifi",
    name: "WiFi",
    nameAr: "واي فاي",
    icon: "Wifi",
    group: "essentials",
    active: true,
  },
  {
    id: "am_parking",
    name: "Parking",
    nameAr: "موقف سيارات",
    icon: "Car",
    group: "essentials",
    active: true,
  },
  {
    id: "am_ac",
    name: "A/C",
    nameAr: "تكييف",
    icon: "Snowflake",
    group: "essentials",
    active: true,
  },
  {
    id: "am_kitchen",
    name: "Kitchen",
    nameAr: "مطبخ",
    icon: "CookingPot",
    group: "essentials",
    active: true,
  },
  {
    id: "am_washer",
    name: "Washer",
    nameAr: "غسالة",
    icon: "WashingMachine",
    group: "essentials",
    active: true,
  },
  {
    id: "am_bbq",
    name: "BBQ & Fire Pit",
    nameAr: "شواء",
    icon: "Flame",
    group: "outdoor",
    active: true,
  },
  {
    id: "am_playground",
    name: "Kids Playground",
    nameAr: "ملعب أطفال",
    icon: "Baby",
    group: "outdoor",
    active: true,
  },
  {
    id: "am_garden",
    name: "Garden",
    nameAr: "حديقة",
    icon: "Trees",
    group: "outdoor",
    active: true,
  },
  {
    id: "am_checkin",
    name: "Smart Self Check-in",
    nameAr: "تسجيل ذاتي",
    icon: "KeyRound",
    group: "features",
    active: true,
  },
  {
    id: "am_firstaid",
    name: "First Aid Kit",
    nameAr: "إسعافات أولية",
    icon: "Cross",
    group: "safety",
    active: true,
  },
  {
    id: "am_cctv",
    name: "Security Cameras",
    nameAr: "كاميرات",
    icon: "Cctv",
    group: "safety",
    active: false,
  },
];

export const cities = [
  {
    id: "city_auh",
    name: "Abu Dhabi",
    nameAr: "أبوظبي",
    emirate: "Abu Dhabi",
    active: true,
    featured: true,
  },
  {
    id: "city_dxb",
    name: "Dubai",
    nameAr: "دبي",
    emirate: "Dubai",
    active: true,
    featured: true,
  },
  {
    id: "city_aln",
    name: "Al Ain",
    nameAr: "العين",
    emirate: "Abu Dhabi",
    active: true,
    featured: true,
  },
  {
    id: "city_rak",
    name: "Ras Al Khaimah",
    nameAr: "رأس الخيمة",
    emirate: "Ras Al Khaimah",
    active: true,
    featured: false,
  },
  {
    id: "city_fuj",
    name: "Fujairah",
    nameAr: "الفجيرة",
    emirate: "Fujairah",
    active: true,
    featured: false,
  },
  {
    id: "city_shj",
    name: "Sharjah",
    nameAr: "الشارقة",
    emirate: "Sharjah",
    active: false,
    featured: false,
  },
];

const AREAS = {
  city_auh: ["Al Wathba", "Al Shahama", "Saadiyat", "Al Rahba"],
  city_dxb: ["Palm Jumeirah", "Al Marmoom", "Hatta", "Al Qudra"],
  city_aln: ["Al Hili", "Jebel Hafeet", "Al Foah"],
  city_rak: ["Al Hamra", "Jebel Jais"],
  city_fuj: ["Dibba", "Al Aqah"],
  city_shj: ["Al Dhaid"],
};

export const animals = [
  { id: "an_horse", name: "Horses", nameAr: "خيول", active: true },
  { id: "an_goat", name: "Goats", nameAr: "ماعز", active: true },
  { id: "an_rabbit", name: "Rabbits", nameAr: "أرانب", active: true },
  { id: "an_chicken", name: "Chickens", nameAr: "دجاج", active: true },
  { id: "an_camel", name: "Camels", nameAr: "جمال", active: true },
];

export const cancellationPolicies = [
  {
    id: "cp_flex",
    name: "Flexible",
    description: "Full refund up to 24 hours before check-in.",
    refundPercent: 100,
    daysBefore: 1,
    active: true,
  },
  {
    id: "cp_mod",
    name: "Moderate",
    description: "Full refund up to 5 days before check-in, 50% after.",
    refundPercent: 100,
    daysBefore: 5,
    active: true,
  },
  {
    id: "cp_strict",
    name: "Strict",
    description: "50% refund up to 7 days before check-in. No refund after.",
    refundPercent: 50,
    daysBefore: 7,
    active: true,
  },
];

export const countries = [
  {
    id: "c_ae",
    name: "United Arab Emirates",
    iso: "AE",
    dialCode: "+971",
    flag: "🇦🇪",
    gcc: true,
    active: true,
  },
  {
    id: "c_sa",
    name: "Saudi Arabia",
    iso: "SA",
    dialCode: "+966",
    flag: "🇸🇦",
    gcc: true,
    active: true,
  },
  {
    id: "c_kw",
    name: "Kuwait",
    iso: "KW",
    dialCode: "+965",
    flag: "🇰🇼",
    gcc: true,
    active: true,
  },
  {
    id: "c_qa",
    name: "Qatar",
    iso: "QA",
    dialCode: "+974",
    flag: "🇶🇦",
    gcc: true,
    active: true,
  },
  {
    id: "c_bh",
    name: "Bahrain",
    iso: "BH",
    dialCode: "+973",
    flag: "🇧🇭",
    gcc: true,
    active: true,
  },
  {
    id: "c_om",
    name: "Oman",
    iso: "OM",
    dialCode: "+968",
    flag: "🇴🇲",
    gcc: true,
    active: true,
  },
  {
    id: "c_in",
    name: "India",
    iso: "IN",
    dialCode: "+91",
    flag: "🇮🇳",
    gcc: false,
    active: true,
  },
  {
    id: "c_gb",
    name: "United Kingdom",
    iso: "GB",
    dialCode: "+44",
    flag: "🇬🇧",
    gcc: false,
    active: true,
  },
  {
    id: "c_eg",
    name: "Egypt",
    iso: "EG",
    dialCode: "+20",
    flag: "🇪🇬",
    gcc: false,
    active: true,
  },
  {
    id: "c_de",
    name: "Germany",
    iso: "DE",
    dialCode: "+49",
    flag: "🇩🇪",
    gcc: false,
    active: true,
  },
  {
    id: "c_ca",
    name: "Canada",
    iso: "CA",
    dialCode: "+1",
    flag: "🇨🇦",
    gcc: false,
    active: true,
  },
  {
    id: "c_cn",
    name: "China",
    iso: "CN",
    dialCode: "+86",
    flag: "🇨🇳",
    gcc: false,
    active: false,
  },
];

const FIRST = [
  "Khalifa",
  "Sara",
  "Omar",
  "Abdulla",
  "Fatima",
  "Ahmed",
  "Mariam",
  "Hamdan",
  "Noura",
  "Yousef",
  "Aisha",
  "Rashid",
  "Layla",
  "Saeed",
  "Hessa",
  "Priya",
  "James",
  "Emma",
  "Ali",
  "Reem",
  "Mohammed",
  "Salma",
  "Faisal",
  "Dana",
];
const LAST = [
  "Alkaab",
  "Al Mansoori",
  "Al Nuaimi",
  "Al Suwaidi",
  "Al Hashimi",
  "Khan",
  "Al Mazrouei",
  "Al Dhaheri",
  "Haddad",
  "Sharma",
  "Carter",
  "Al Qasimi",
  "Al Ketbi",
  "Nasser",
];
const person = () => {
  const first = pick(FIRST);
  const last = pick(LAST);
  const female = [
    "Sara",
    "Fatima",
    "Mariam",
    "Noura",
    "Aisha",
    "Layla",
    "Hessa",
    "Priya",
    "Emma",
    "Reem",
    "Salma",
    "Dana",
  ].includes(first);
  return {
    name: `${first} ${last}`,
    email:
      `${first}.${last.replace(/\s/g, "")}${int(1, 99)}@example.com`.toLowerCase(),
    gender: female ? "female" : "male",
  };
};
const phone = () => `5${int(0, 8)} ${int(100, 999)} ${int(1000, 9999)}`;

export const guests = Array.from({ length: 64 }, (_, i) => {
  const p = person();
  const c = rand() < 0.7 ? countries[0] : pick(countries);
  const joined = int(3, 420);
  return {
    id: `g_${pad(i + 1)}`,
    ...p,
    dialCode: c.dialCode,
    phone: phone(),
    country: c.name,
    dob: new Date(
      Date.UTC(int(1965, 2005), int(0, 11), int(1, 28)),
    ).toISOString(),
    signupMethod: pick([
      "phone",
      "phone",
      "google",
      "apple",
      "uae_pass",
      "email",
    ]),
    language: rand() < 0.35 ? "ar" : "en",
    status: rand() < 0.08 ? "blocked" : "active",
    joinedAt: daysAgo(joined),
    lastActiveAt: daysAgo(int(0, Math.min(joined, 30))),
    bookings: 0,
    wishlists: int(0, 6),
    totalSpent: 0,
  };
});

export const hosts = Array.from({ length: 18 }, (_, i) => {
  const p = person();
  const status = i < 14 ? "active" : i < 16 ? "pending" : "suspended";
  return {
    id: `h_${pad(i + 1)}`,
    ...p,
    dialCode: "+971",
    phone: phone(),
    country: "United Arab Emirates",
    status,
    verified: status === "active",
    idDocument:
      status === "pending"
        ? "Emirates ID uploaded — awaiting review"
        : "Emirates ID verified",
    joinedAt: daysAgo(int(30, 500)),
    properties: 0,
    bookings: 0,
    earnings: 0,
    rating: Math.round((4 + rand()) * 10) / 10,
    responseRate: int(78, 100),
  };
});

const PROPERTY_NAMES = [
  "Al Wathba Farm",
  "Desert Lodge",
  "Palm Retreat",
  "The Azure Waterfront Estate",
  "Farm View Villa",
  "Sunset Dunes Camp",
  "Olive Grove Farmhouse",
  "Hatta Mountain Chalet",
  "Saadiyat Beach Villa",
  "Qudra Lakes Camp",
  "Palm View Villa",
  "Jebel Jais Lodge",
  "Al Hili Date Farm",
  "Marmoom Oasis Camp",
  "Pearl Coast Resort",
  "Jumeirah Palm Villa",
  "Liwa Star Camp",
  "Green Meadows Farm",
  "Al Rahba Stables",
  "Coral Bay Resort",
  "Hafeet Hideaway",
  "Dibba Seaside Home",
  "Shahama Family Farm",
  "Golden Sands Retreat",
  "Aqah Lagoon Resort",
  "Foah Palm Farm",
  "Hamra Marina Villa",
  "Moonlight Desert Camp",
  "Rose Garden Estate",
  "Cedar Farm Stay",
  "Mangrove Escape",
  "Falcon Ridge Farm",
  "Dune Ridge Glamping",
  "Wadi Breeze Villa",
  "Blue Lagoon Resort",
  "Sidr Tree Farm",
];
const PHOTOS = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=70",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=70",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=70",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=70",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=70",
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=70",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=70",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=70",
];
const DESCRIPTIONS = [
  "A serene farm escape with private pool, lush date palms and a shaded majlis — perfect for family weekends away from the city.",
  "Contemporary bespoke waterfront sanctuary boasting 180° uninterrupted coastal views, private yacht dockage and smart home automation.",
  "Glamping under the stars with traditional Bedouin tents, fire pit dinners and sunrise dune walks.",
  "Friendly private animal sanctuary with horses and goats, open lawns and a BBQ area for gatherings.",
];

export const properties = PROPERTY_NAMES.map((name, i) => {
  const categoryId = /Camp|Glamping/.test(name)
    ? "cat_camp"
    : /Resort/.test(name)
      ? "cat_resort"
      : /Farm|Stables|Grove|Meadows/.test(name)
        ? "cat_farm"
        : "cat_home";
  const cityId = pick(cities.slice(0, 5)).id;
  const status =
    i < 26
      ? "live"
      : i < 31
        ? "pending"
        : i < 33
          ? "draft"
          : i < 35
            ? "rejected"
            : "unlisted";
  const host = hosts[i % 14];
  const price =
    categoryId === "cat_resort"
      ? int(18, 45) * 100
      : categoryId === "cat_camp"
        ? int(6, 16) * 100
        : int(9, 30) * 100;
  const created = int(10, 360);
  return {
    id: `p_${pad(i + 1)}`,
    name,
    categoryId,
    cityId,
    area: pick(AREAS[cityId]),
    address: `${int(1, 60)} ${pick(["Farm Road", "Street 12", "Oasis Way", "Coastal Rd"])}`,
    lat: 24.2 + rand(),
    lng: 54.3 + rand() * 1.4,
    hostId: host.id,
    status,
    rejectionReason:
      status === "rejected"
        ? "Photos are low resolution and the location pin does not match the address."
        : undefined,
    description: pick(DESCRIPTIONS),
    pricePerNight: price,
    bedrooms: int(1, 6),
    bathrooms: int(1, 5),
    maxGuests: int(2, 20),
    petsAllowed: rand() < 0.5,
    amenityIds: pickSome(
      amenities.filter((a) => a.active),
      int(4, 9),
    ).map((a) => a.id),
    animalIds:
      categoryId === "cat_farm"
        ? pickSome(animals, int(1, 4)).map((a) => a.id)
        : [],
    photos: pickSome(PHOTOS, 5),
    houseRules: {
      checkIn: "15:00",
      checkOut: "11:00",
      smoking: false,
      parties: rand() < 0.3,
      pets: rand() < 0.5,
    },
    cancellationPolicyId: pick(cancellationPolicies).id,
    guestFavourite: status === "live" && rand() < 0.35,
    featured: status === "live" && rand() < 0.25,
    rating: status === "live" ? Math.round((4 + rand()) * 100) / 100 : 0,
    reviewCount: 0,
    bookings: 0,
    views: status === "live" ? int(200, 8000) : int(0, 30),
    createdAt: daysAgo(created),
    updatedAt: daysAgo(int(0, created)),
  };
});

const livePropertyIds = properties
  .filter((p) => p.status === "live")
  .map((p) => p.id);
const propertyById = Object.fromEntries(properties.map((p) => [p.id, p]));

export const bookings = Array.from({ length: 140 }, (_, i) => {
  const property = propertyById[pick(livePropertyIds)];
  const guest = pick(guests);
  const created = int(0, 330);
  const startOffset = created - int(2, 40);
  const nights = int(1, 5);
  const checkIn = new Date(NOW - startOffset * DAY);
  checkIn.setUTCHours(15, 0, 0, 0);
  const checkOut = new Date(checkIn.getTime() + nights * DAY);
  checkOut.setUTCHours(11, 0, 0, 0);
  const inPast = checkOut.getTime() < NOW;
  const cancelled = rand() < 0.1;
  const status = cancelled
    ? "cancelled"
    : inPast
      ? "completed"
      : rand() < 0.2
        ? "pending"
        : "confirmed";
  const subtotal = property.pricePerNight * nights;
  const cleaningFee = 150;
  const serviceFee = Math.round(subtotal * 0.1);
  const vat = Math.round((subtotal + cleaningFee + serviceFee) * 0.05);
  return {
    id: `b_${pad(i + 1)}`,
    code: `BRK-${pad(24100 + i, 6)}`,
    propertyId: property.id,
    guestId: guest.id,
    hostId: property.hostId,
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
    nights,
    adults: int(1, 8),
    children: int(0, 4),
    pets: property.petsAllowed ? int(0, 1) : 0,
    pricePerNight: property.pricePerNight,
    subtotal,
    cleaningFee,
    serviceFee,
    vat,
    total: subtotal + cleaningFee + serviceFee + vat,
    status,
    paymentStatus: cancelled
      ? "refunded"
      : status === "pending"
        ? "pending"
        : "paid",
    paymentMethod: pick(["card", "card", "apple_pay", "google_pay"]),
    createdAt: daysAgo(created),
    cancelledReason: cancelled
      ? pick([
          "Change of plans",
          "Found another stay",
          "Host cancelled",
          "Emergency",
        ])
      : undefined,
  };
});

// Derive aggregates so the numbers stay consistent across screens.
const guestById = Object.fromEntries(guests.map((g) => [g.id, g]));
const hostById = Object.fromEntries(hosts.map((h) => [h.id, h]));
for (const p of properties) hostById[p.hostId].properties += 1;
for (const b of bookings) {
  propertyById[b.propertyId].bookings += 1;
  guestById[b.guestId].bookings += 1;
  hostById[b.hostId].bookings += 1;
  if (b.paymentStatus === "paid") {
    guestById[b.guestId].totalSpent += b.total;
    hostById[b.hostId].earnings += Math.round(b.subtotal * 0.85);
  }
}

export const transactions = bookings.flatMap((b, i) => {
  const pay = {
    id: `t_${pad(i * 2 + 1, 5)}`,
    bookingId: b.id,
    bookingCode: b.code,
    guestId: b.guestId,
    type: "payment",
    amount: b.total,
    method: b.paymentMethod,
    status: b.paymentStatus === "pending" ? "pending" : "succeeded",
    createdAt: b.createdAt,
  };
  if (b.paymentStatus !== "refunded") return [pay];
  return [
    pay,
    {
      ...pay,
      id: `t_${pad(i * 2 + 2, 5)}`,
      type: "refund",
      createdAt: b.createdAt,
    },
  ];
});

export const payouts = hosts
  .filter((h) => h.status === "active")
  .flatMap((h, i) =>
    [0, 1, 2].map((k) => {
      const gross = int(4, 40) * 500;
      const start = new Date(NOW - (k + 1) * 30 * DAY);
      return {
        id: `po_${pad(i * 3 + k + 1)}`,
        hostId: h.id,
        amount: Math.round(gross * 0.85),
        commission: Math.round(gross * 0.15),
        bookings: int(1, 9),
        periodStart: start.toISOString(),
        periodEnd: new Date(start.getTime() + 29 * DAY).toISOString(),
        status: k === 0 ? pick(["scheduled", "processing", "on_hold"]) : "paid",
        paidAt:
          k === 0
            ? undefined
            : new Date(start.getTime() + 32 * DAY).toISOString(),
      };
    }),
  );

const REVIEW_TEXT = [
  "Amazing place! The pool was spotless and the kids loved the animals.",
  "Host was very responsive, check-in was smooth. Would come back.",
  "Beautiful property but the WiFi was weak in the bedrooms.",
  "Perfect weekend escape, exactly like the photos.",
  "Not as clean as expected. Host sorted it quickly though.",
  "The sunset from the majlis was unforgettable.",
];
export const reviews = bookings
  .filter((b) => b.status === "completed")
  .slice(0, 70)
  .map((b, i) => {
    const rating = pick([5, 5, 5, 4, 4, 3, 2]);
    propertyById[b.propertyId].reviewCount += 1;
    return {
      id: `r_${pad(i + 1)}`,
      propertyId: b.propertyId,
      guestId: b.guestId,
      bookingId: b.id,
      rating,
      comment: rating <= 2 ? REVIEW_TEXT[4] : pick(REVIEW_TEXT),
      status:
        rating <= 2 && rand() < 0.6
          ? "flagged"
          : rand() < 0.05
            ? "hidden"
            : "published",
      createdAt: b.checkOut,
    };
  });

export const supportThreads = Array.from({ length: 12 }, (_, i) => {
  const isHost = i % 4 === 0;
  const who = isHost ? hosts[i % hosts.length] : guests[i * 3];
  const subject = pick(
    isHost
      ? [
          "Payout not received",
          "How to edit my listing photos?",
          "Listing still pending review",
        ]
      : [
          "Refund for cancelled booking",
          "Cannot add pets to booking",
          "Payment failed twice",
          "Change my phone number",
        ],
  );
  const updated = int(0, 20);
  return {
    id: `st_${pad(i + 1)}`,
    participantId: who.id,
    participantRole: isHost ? "host" : "guest",
    subject,
    status: i < 7 ? "open" : "resolved",
    unread: i < 5 ? int(1, 3) : 0,
    updatedAt: daysAgo(updated),
    messages: [
      {
        id: "m1",
        from: isHost ? "host" : "guest",
        text: `Hi Break team, ${subject.toLowerCase()}. Can you help?`,
        at: daysAgo(updated + 1),
      },
      {
        id: "m2",
        from: "support",
        text: "Hi! Thanks for reaching out — we are looking into this for you now.",
        at: daysAgo(updated + 1),
      },
      {
        id: "m3",
        from: isHost ? "host" : "guest",
        text: "Thank you, please keep me posted.",
        at: daysAgo(updated),
      },
    ],
  };
});

export const reports = Array.from({ length: 10 }, (_, i) => {
  const guestReports = i % 3 !== 0;
  return {
    id: `rp_${pad(i + 1)}`,
    type: i % 2 ? "block" : "conversation",
    reporterId: guestReports ? guests[i * 5].id : hosts[i].id,
    reporterRole: guestReports ? "guest" : "host",
    reportedId: guestReports ? hosts[i].id : guests[i * 5 + 1].id,
    reportedRole: guestReports ? "host" : "guest",
    propertyId: livePropertyIds[i],
    reason: pick([
      "Inappropriate language",
      "Asked to pay outside Break",
      "Spam messages",
      "Harassment",
      "Misleading listing",
    ]),
    status: i < 5 ? "open" : i < 8 ? "resolved" : "dismissed",
    createdAt: daysAgo(int(0, 40)),
    resolution:
      i >= 5 && i < 8 ? "Warning issued to the reported account." : undefined,
  };
});

export const enquiries = Array.from({ length: 14 }, (_, i) => {
  const p = person();
  return {
    id: `e_${pad(i + 1)}`,
    name: p.name,
    email: p.email,
    source: i % 3 === 0 ? "host_app" : "user_app",
    message: pick([
      "I would like to list my farm in Al Ain, what documents do I need?",
      "Is there a corporate booking option for team retreats?",
      "The app keeps logging me out after OTP verification.",
      "Do you plan to add properties in Oman?",
      "I want to change my registered email address.",
    ]),
    status: i < 6 ? "new" : i < 11 ? "replied" : "closed",
    createdAt: daysAgo(int(0, 45)),
    reply:
      i >= 6 && i < 11
        ? "Thanks for contacting Break — our team has shared the details by email."
        : undefined,
  };
});

export const pushNotifications = [
  {
    id: "n_001",
    title: "Property Price Drop",
    body: "Good news! Farms in Al Wathba are 20% off this weekend.",
    audience: "guests",
    status: "sent",
    sentAt: daysAgo(2),
    recipients: 58,
    opens: 31,
  },
  {
    id: "n_002",
    title: "New Property Added",
    body: "A new desert camp matching your preferences is now available.",
    audience: "city",
    cityId: "city_dxb",
    status: "sent",
    sentAt: daysAgo(6),
    recipients: 22,
    opens: 9,
  },
  {
    id: "n_003",
    title: "Host payouts schedule",
    body: "Payouts for September will be processed on the 3rd.",
    audience: "hosts",
    status: "sent",
    sentAt: daysAgo(12),
    recipients: 14,
    opens: 12,
  },
  {
    id: "n_004",
    title: "National Day escapes",
    body: "Book your long-weekend escape before it sells out.",
    audience: "all",
    status: "scheduled",
    sentAt: new Date(NOW + 20 * DAY).toISOString(),
    recipients: 82,
    opens: 0,
  },
];

const LOREM =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.";
export const cmsPages = [
  {
    id: "cms_privacy",
    slug: "privacy",
    title: "Privacy Policy",
    titleAr: "سياسة الخصوصية",
    body: LOREM,
    bodyAr: "نص سياسة الخصوصية",
    updatedAt: daysAgo(40),
  },
  {
    id: "cms_terms",
    slug: "terms",
    title: "Terms & Conditions",
    titleAr: "الشروط والأحكام",
    body: LOREM,
    bodyAr: "نص الشروط والأحكام",
    updatedAt: daysAgo(40),
  },
  {
    id: "cms_about",
    slug: "about",
    title: "About Us",
    titleAr: "من نحن",
    body: "Break helps you find your escape — farms, vacation homes, resorts and desert camps across the UAE.",
    bodyAr: "بريك يساعدك على إيجاد ملاذك",
    updatedAt: daysAgo(90),
  },
  {
    id: "cms_cancel",
    slug: "cancellation",
    title: "Cancellation Policy",
    titleAr: "سياسة الإلغاء",
    body: LOREM,
    bodyAr: "نص سياسة الإلغاء",
    updatedAt: daysAgo(60),
  },
  {
    id: "cms_host",
    slug: "host_terms",
    title: "Host Terms",
    titleAr: "شروط المضيف",
    body: LOREM,
    bodyAr: "نص شروط المضيف",
    updatedAt: daysAgo(15),
  },
];

export const admins = [
  {
    id: "a_001",
    name: "Break Admin",
    email: "admin@break.ae",
    role: "super_admin",
    active: true,
    lastLoginAt: daysAgo(0),
  },
  {
    id: "a_002",
    name: "Mariam Al Nuaimi",
    email: "mariam@break.ae",
    role: "operations",
    active: true,
    lastLoginAt: daysAgo(1),
  },
  {
    id: "a_003",
    name: "Omar Haddad",
    email: "omar@break.ae",
    role: "support",
    active: true,
    lastLoginAt: daysAgo(3),
  },
  {
    id: "a_004",
    name: "Priya Sharma",
    email: "priya@break.ae",
    role: "finance",
    active: false,
    lastLoginAt: daysAgo(48),
  },
];

export const deletionRequests = [
  {
    id: "dr_001",
    accountId: guests[4].id,
    role: "guest",
    reason: "I no longer use the app.",
    status: "pending",
    createdAt: daysAgo(1),
  },
  {
    id: "dr_002",
    accountId: guests[11].id,
    role: "guest",
    reason: "Privacy concerns.",
    status: "pending",
    createdAt: daysAgo(3),
  },
  {
    id: "dr_003",
    accountId: hosts[15].id,
    role: "host",
    reason: "Sold my property.",
    status: "pending",
    createdAt: daysAgo(5),
  },
  {
    id: "dr_004",
    accountId: guests[20].id,
    role: "guest",
    reason: "Duplicate account.",
    status: "approved",
    createdAt: daysAgo(20),
  },
];

export const appSettings = {
  currency: "AED",
  commissionPercent: 15,
  serviceFeePercent: 10,
  vatPercent: 5,
  cleaningFeeDefault: 150,
  supportEmail: "support@break.ae",
  supportPhone: "+971 4 000 0000",
  languages: ["en", "ar"],
  autoApproveListings: false,
  maintenanceMode: false,
};

/** Demo admin credentials for the mock backend only. */
export const MOCK_ADMIN_LOGIN = {
  email: "admin@break.ae",
  password: "break-demo-2026",
};
