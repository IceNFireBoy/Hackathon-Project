export const BUILD_CATEGORIES = [
  { id: 'mcu', label: 'Microcontroller' },
  { id: 'sensor', label: 'Sensors' },
  { id: 'power', label: 'Power' },
  { id: 'connector', label: 'Connectors' },
];

export const INITIAL_BUILD = {
  id: 'demo-build-001',
  name: 'Line-Following Robot v2',
  slots: {
    mcu: { partId: 'arduino-uno', name: 'Arduino Uno R3', voltage: '5V', price: 850, specs: 'ATmega328P · 5V logic' },
    sensor: { partId: 'hc-sr04', name: 'HC-SR04 Ultrasonic', voltage: '5V', price: 120, specs: '2–400 cm range' },
    power: { partId: 'lipo-3s', name: 'LiPo 11.1V 2200mAh', voltage: '11.1V', price: 650, specs: '3S · XT60 connector' },
    connector: { partId: 'bmp280', name: 'BMP280 Barometric Sensor', voltage: '3.3V', price: 180, specs: 'I²C · 3.3V only' },
  },
};

export const VOLTAGE_CONFLICT = {
  id: 'conflict-i2c-voltage',
  severity: 'critical',
  type: 'voltage_mismatch',
  message: 'BMP280 (3.3V) connected to Arduino Uno I²C (5V logic)',
  affectedSlots: ['mcu', 'connector'],
  physicsExplanation:
    'I²C on Arduino Uno uses 5V logic levels. The BMP280 absolute maximum VIH is 3.6V. Applying 5V to SDA/SCL can permanently damage the sensor (exceeds abs max ratings). Use a bidirectional logic level shifter.',
  alternative: {
    partId: 'logic-shifter',
    name: '4-Channel Logic Level Shifter',
    price: 95,
    voltage: '3.3V ↔ 5V',
    specs: 'Bidirectional · 4 channels',
    resolvesConflict: true,
    insertSlot: 'connector',
  },
};

export function mapComponentToCategory(name) {
  const lower = name.toLowerCase();
  if (/arduino|esp|mcu|nano|uno|stm|microcontroller|processor/.test(lower)) return 'mcu';
  if (/sensor|ultrasonic|bmp|dht|gyro|accelerometer|tof|hc-sr/.test(lower)) return 'sensor';
  if (/battery|lipo|power|regulator|buck|boost|supply/.test(lower)) return 'power';
  return 'connector';
}

export const INSPIRATION_VIDEOS = [
  {
    id: 'v1',
    title: 'Build a Line Follower in 10 Minutes',
    channel: 'DroneBot Workshop',
    thumbnailUrl: '',
    duration: '10:24',
    gradient: 'from-[#2A2929] to-[#444342]',
    accent: '#FFB700',
  },
  {
    id: 'v2',
    title: 'ESP32 IoT Weather Station Tutorial',
    channel: 'Random Nerd Tutorials',
    thumbnailUrl: '',
    duration: '18:45',
    gradient: 'from-[#0F0F0F] to-[#2A2929]',
    accent: '#FFD000',
  },
  {
    id: 'v3',
    title: 'Logic Level Shifters Explained',
    channel: 'GreatScott!',
    thumbnailUrl: '',
    duration: '8:12',
    gradient: 'from-[#444342] to-[#2A2929]',
    accent: '#FFB700',
  },
  {
    id: 'v4',
    title: 'Sumo Bot Build Guide',
    channel: 'ElectroBOOM',
    thumbnailUrl: '',
    duration: '14:30',
    gradient: 'from-[#2A2929] to-[#0F0F0F]',
    accent: '#FFD000',
  },
  {
    id: 'v5',
    title: 'Arduino vs ESP32 — Which to Choose?',
    channel: 'ExplainingComputers',
    thumbnailUrl: '',
    duration: '12:08',
    gradient: 'from-[#444342] to-[#0F0F0F]',
    accent: '#FFB700',
  },
];

export const PRICE_LISTINGS = [
  { id: 'p1', partName: 'Arduino Uno R3', store: 'Shopee', pricePHP: 799, stock: 'In Stock', url: '#' },
  { id: 'p2', partName: 'Arduino Uno R3', store: 'Lazada', pricePHP: 850, stock: 'Low Stock', url: '#' },
  { id: 'p3', partName: 'HC-SR04 Ultrasonic', store: 'Shopee', pricePHP: 95, stock: 'In Stock', url: '#' },
  { id: 'p4', partName: 'HC-SR04 Ultrasonic', store: 'Lazada', pricePHP: 110, stock: 'In Stock', url: '#' },
  { id: 'p5', partName: 'BMP280 Sensor Module', store: 'Shopee', pricePHP: 165, stock: 'In Stock', url: '#' },
  { id: 'p6', partName: 'BMP280 Sensor Module', store: 'Lazada', pricePHP: 180, stock: 'In Stock', url: '#' },
  { id: 'p7', partName: '4-Ch Logic Level Shifter', store: 'Shopee', pricePHP: 89, stock: 'In Stock', url: '#' },
  { id: 'p8', partName: '4-Ch Logic Level Shifter', store: 'Lazada', pricePHP: 95, stock: 'In Stock', url: '#' },
  { id: 'p9', partName: 'LiPo 11.1V 2200mAh', store: 'Shopee', pricePHP: 620, stock: 'Low Stock', url: '#' },
  { id: 'p10', partName: 'LiPo 11.1V 2200mAh', store: 'Lazada', pricePHP: 650, stock: 'In Stock', url: '#' },
  { id: 'p11', partName: 'ESP32 DevKit V1', store: 'Shopee', pricePHP: 320, stock: 'In Stock', url: '#' },
  { id: 'p12', partName: 'ESP32 DevKit V1', store: 'Lazada', pricePHP: 345, stock: 'In Stock', url: '#' },
];

export const PROCUREMENT_KPIS = {
  totalCostPHP: 2847,
  itemCount: 12,
  avgLeadTimeDays: 4.2,
  storesCompared: 6,
};

export const STORE_DISTRIBUTION = [
  { store: 'Shopee', share: 42, color: '#FF5722' },
  { store: 'Lazada', share: 28, color: '#0F146D' },
  { store: 'Local Hobby Shop', share: 18, color: '#FFB700' },
  { store: 'Other', share: 12, color: '#64748B' },
];

export const COST_BREAKDOWN = [
  { category: 'Microcontrollers', cost: 850 },
  { category: 'Sensors', cost: 420 },
  { category: 'Power & Batteries', cost: 650 },
  { category: 'Connectors & Misc', cost: 527 },
  { category: 'Tools & Accessories', cost: 400 },
];

export const MOCK_INVOICE = {
  invoiceNumber: 'OC-2026-0612',
  date: '2026-06-12',
  customer: 'STEM Lab — Demo Account',
  lineItems: [
    { name: 'Arduino Uno R3', qty: 1, unitPrice: 850 },
    { name: 'HC-SR04 Ultrasonic', qty: 2, unitPrice: 120 },
    { name: 'LiPo 11.1V 2200mAh', qty: 1, unitPrice: 650 },
    { name: 'BMP280 Barometric Sensor', qty: 1, unitPrice: 180 },
    { name: '4-Channel Logic Level Shifter', qty: 1, unitPrice: 95 },
    { name: 'Jumper Wire Kit', qty: 1, unitPrice: 150 },
    { name: 'Breadboard Full Size', qty: 2, unitPrice: 120 },
    { name: 'Resistor Assortment', qty: 1, unitPrice: 85 },
  ],
};

export const SAVED_BUILDS = [
  {
    id: 'build-001',
    title: 'Line-Following Robot v2',
    createdAt: '2026-06-12',
    tags: ['robotics', 'classroom'],
    componentCount: 8,
    notes: 'Used for STEM week demo. Swap ultrasonic for ToF later.',
    components: [
      { name: 'Arduino Uno R3', quantity: 1, confidence_score: 0.95 },
      { name: 'HC-SR04 Ultrasonic', quantity: 2, confidence_score: 0.88 },
      { name: 'L298N Motor Driver', quantity: 1, confidence_score: 0.92 },
      { name: 'DC Gear Motor', quantity: 2, confidence_score: 0.85 },
      { name: 'LiPo 11.1V 2200mAh', quantity: 1, confidence_score: 0.90 },
      { name: 'Chassis Kit', quantity: 1, confidence_score: 0.78 },
      { name: 'Jumper Wire Kit', quantity: 1, confidence_score: 0.99 },
      { name: 'Breadboard', quantity: 1, confidence_score: 0.97 },
    ],
  },
  {
    id: 'build-002',
    title: 'IoT Weather Station',
    createdAt: '2026-05-28',
    tags: ['iot', 'classroom'],
    componentCount: 6,
    notes: 'ESP32-based. Add solar panel for outdoor deployment.',
    components: [
      { name: 'ESP32 DevKit', quantity: 1, confidence_score: 0.96 },
      { name: 'BMP280 Sensor', quantity: 1, confidence_score: 0.91 },
      { name: 'DHT22 Humidity Sensor', quantity: 1, confidence_score: 0.89 },
      { name: '0.96" OLED Display', quantity: 1, confidence_score: 0.87 },
      { name: 'Logic Level Shifter', quantity: 1, confidence_score: 0.94 },
      { name: 'USB Power Bank', quantity: 1, confidence_score: 0.82 },
    ],
  },
  {
    id: 'build-003',
    title: 'Smart Plant Monitor',
    createdAt: '2026-05-15',
    tags: ['iot', 'robotics'],
    componentCount: 5,
    notes: 'Soil moisture + auto-watering prototype.',
    components: [
      { name: 'Arduino Nano', quantity: 1, confidence_score: 0.93 },
      { name: 'Capacitive Soil Sensor', quantity: 2, confidence_score: 0.86 },
      { name: 'Mini Water Pump', quantity: 1, confidence_score: 0.80 },
      { name: 'Relay Module', quantity: 1, confidence_score: 0.91 },
      { name: '5V Power Supply', quantity: 1, confidence_score: 0.88 },
    ],
  },
  {
    id: 'build-004',
    title: 'Sumo Bot Competition',
    createdAt: '2026-04-02',
    tags: ['robotics'],
    componentCount: 7,
    notes: 'Competition rules: max 500g. IR sensors for edge detection.',
    components: [
      { name: 'Arduino Uno R3', quantity: 1, confidence_score: 0.95 },
      { name: 'Sharp IR Sensor', quantity: 4, confidence_score: 0.90 },
      { name: 'High-Torque Servo', quantity: 2, confidence_score: 0.87 },
      { name: 'Metal Chassis', quantity: 1, confidence_score: 0.84 },
      { name: 'LiPo 7.4V 1500mAh', quantity: 1, confidence_score: 0.89 },
    ],
  },
];

export const ALL_TAGS = ['robotics', 'iot', 'classroom'];
